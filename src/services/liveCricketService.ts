import axios from 'axios';
import * as cheerio from 'cheerio';

import type { Match, MatchScore, MatchStatus } from '../types/types';

// =========================
// Config
// =========================

const CRICBUZZ_BASE_URL = 'https://www.cricbuzz.com';

// Cache TTLs
const MATCH_LIST_TTL_MS = 30_000;

// =========================
// In-memory cache
// =========================

type CacheEntry<T> = {
    value: T;
    ts: number;
};

const matchListCache: CacheEntry<Match[]> | null = null;
// NOTE: We keep the cache at module scope.
// Using a variable so TS understands it's a mutable binding.
let _matchListCache: CacheEntry<Match[]> | null = matchListCache;

// Optional per-match cache (no TTL requirement from task, but cheap to include)
const matchScoreCache = new Map<string, CacheEntry<MatchScore | undefined>>();
const matchCommentaryCache = new Map<string, CacheEntry<string[]>>();

// =========================
// Helpers
// =========================

function nowMs() {
    return Date.now();
}

function withinTtl(ts: number, ttlMs: number) {
    return nowMs() - ts <= ttlMs;
}

function normalizeWhitespace(s: string) {
    return s.replace(/\s+/g, ' ').trim();
}

// (Intentionally not used yet; kept for future parsing improvements)
function safeText($el: any): string {
    try {
        if (!$el) return '';
        if (typeof $el.text === 'function') return normalizeWhitespace($el.text());
        if (typeof $el.root === 'function') return normalizeWhitespace($el.root().text());
        return '';
    } catch {
        return '';
    }
}




function inferStatus(statusText: string, scorePresent: boolean): MatchStatus {
    const t = statusText.toLowerCase();
    if (t.includes('live') || t.includes('in progress')) return 'live';
    if (t.includes('upcoming') || t.includes('match begins') || t.includes('scheduled')) return 'upcoming';
    if (t.includes('finished') || t.includes('won') || t.includes('result')) return 'finished';
    if (scorePresent) return 'live';
    return 'upcoming';
}

function parseFormatFromText(text: string) {
    const t = text.toUpperCase();
    if (t.includes('T20')) return 'T20' as const;
    if (t.includes('ODI')) return 'ODI' as const;
    if (t.includes('TEST')) return 'Test' as const;
    return 'T20' as const;
}

function parseScoreFromText(raw: string): MatchScore | undefined {
    // Cricbuzz often uses patterns like:
    //  156/4 (18.2 ov)
    // We'll be conservative: if we can't find scores, return undefined.
    const s = normalizeWhitespace(raw);
    if (!s) return undefined;

    // Try overs: e.g. (18.2 ov)
    const oversMatch = s.match(/\((\s*\d+(?:\.\d+)?)\s*ov\b|\s*\d+(?:\.\d+)?\s*\.?\s*\)/i);
    const overs = oversMatch ? oversMatch[1].replace(/\s/g, '') : undefined;

    // Try team scores: very hard without specific DOM; just parse first two innings-like patterns.
    // Find something like: 156/4 (18.2)
    const inningsMatches = Array.from(s.matchAll(/(\d{1,3}\d)\/(\d{1,2}|\d{1,2})\s*\([^)]*\d+(?:\.\d+)?/g));

    // Fallback: extract first two score occurrences like 156/4 and 112/3
    const simpleScores = Array.from(s.matchAll(/(\d{1,3}\d)\s*\/\s*(\d{1,2}|\d{1,2})/g));

    if (simpleScores.length >= 2) {
        const team1Score = `${simpleScores[0][1]}/${simpleScores[0][2]}`;
        const team2Score = `${simpleScores[1][1]}/${simpleScores[1][2]}`;
        return { team1Score, team2Score, overs };
    }

    // If only one score present, return it in team1Score
    if (simpleScores.length === 1) {
        const team1Score = `${simpleScores[0][1]}/${simpleScores[0][2]}`;
        return { team1Score, overs };
    }

    // If results text includes a winner phrase
    const result = s.match(/(won by .+|won\b|result\b|tied|drawn)/i)?.[1] || undefined;
    if (result) return { result };

    return undefined;
}

function parseCommentaryFromDom($: cheerio.CheerioAPI): string[] {
    // Cricbuzz ball-by-ball/commentary varies by page/format.
    // We attempt to grab list-like commentary lines.
    const lines: string[] = [];

    // Common containers: .cb-commentary, .commentary, #commentary
    const candidates = [
        '.cb-commentary',
        '.commentary',
        '#commentary',
        '.match-commentary',
        '[data-testid="commentary"], [class*="commentary" i]',
    ];

    for (const sel of candidates) {
        const nodes = $(sel);
        if (nodes && nodes.length) {
            nodes
                .find('li, p, span, div')
                .each((_, el) => {
                    const t = normalizeWhitespace($(el).text());
                    if (t && t.length >= 8) {
                        // avoid duplicates / boilerplate
                        lines.push(t);
                    }
                });
        }
        if (lines.length >= 8) break;
    }

    // De-dupe preserving order
    const seen = new Set<string>();
    const out: string[] = [];
    for (const l of lines) {
        const key = l.toLowerCase();
        if (!seen.has(key)) {
            seen.add(key);
            out.push(l);
        }
    }

    // Limit
    return out.slice(0, 30);
}

function buildMatchIdFromUrl(href?: string) {
    // Example: /cricket-series/1234/ipl-2026/match/67890/live-cricket-score
    if (!href) return '';
    const m = href.match(/\/match\/([0-9]+)/);
    if (m?.[1]) return `match-${m[1]}`;
    const generic = href.match(/([0-9]{5,})/);
    if (generic?.[1]) return `match-${generic[1]}`;
    return '';
}

function formatVenueAndStart($: cheerio.CheerioAPI, $root: any): { venue?: string; startTime?: string } {
    // Cricbuzz match list page may not have these.
    const text = typeof $root?.text === 'function' ? $root.text() : '';

    const venue = $(
        '[class*="Venue" i], [class*="venue" i], .cb-venue, [itemprop="location"], [data-venue]'
    )
        .first()
        .text();

    // Start time: look for time-like patterns.
    // We'll try a data attribute first.
    const startTimeAttr = $root.attr('data-start-time') || $root.attr('data-match-start');
    const startTime = startTimeAttr ? String(startTimeAttr) : undefined;

    return {
        venue: normalizeWhitespace(venue || '') || (text ? undefined : undefined),
        startTime: startTime ? normalizeWhitespace(startTime) : undefined,
    };
}

// =========================
// Public API
// =========================

export async function fetchLiveMatches(): Promise<Match[]> {
    console.log('[liveCricketService] fetchLiveMatches(): starting HTTP request...');
    if (_matchListCache && withinTtl(_matchListCache.ts, MATCH_LIST_TTL_MS)) {
        console.log('[liveCricketService] fetchLiveMatches(): returning cached matches count =', _matchListCache.value.length);
        return _matchListCache.value;
    }

    const endpoint = `${CRICBUZZ_BASE_URL}/cricket-scores/`;
    let html = '';
    let success = false;

    // Try direct fetch first
    try {
        console.log('[liveCricketService] fetchLiveMatches(): Attempting direct GET to', endpoint);
        const res = await axios.get(endpoint, {
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });
        html = res.data;
        success = true;
        console.log('[liveCricketService] fetchLiveMatches(): Direct GET succeeded. HTML length =', html.length);
    } catch (err: any) {
        console.warn('[liveCricketService] fetchLiveMatches(): Direct GET failed (likely CORS or network). Error:', err?.message || err);
    }

    // Try AllOrigins CORS Proxy if direct failed
    if (!success) {
        try {
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(endpoint)}`;
            console.log('[liveCricketService] fetchLiveMatches(): Attempting GET via AllOrigins Proxy:', proxyUrl);
            const res = await axios.get(proxyUrl, { timeout: 8000 });
            html = res.data;
            success = true;
            console.log('[liveCricketService] fetchLiveMatches(): AllOrigins Proxy succeeded. HTML length =', html.length);
        } catch (err: any) {
            console.warn('[liveCricketService] fetchLiveMatches(): AllOrigins Proxy failed. Error:', err?.message || err);
        }
    }

    // Try CorsProxy.io if AllOrigins failed
    if (!success) {
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(endpoint)}`;
            console.log('[liveCricketService] fetchLiveMatches(): Attempting GET via CorsProxy.io:', proxyUrl);
            const res = await axios.get(proxyUrl, { timeout: 8000 });
            html = res.data;
            success = true;
            console.log('[liveCricketService] fetchLiveMatches(): CorsProxy.io succeeded. HTML length =', html.length);
        } catch (err: any) {
            console.error('[liveCricketService] fetchLiveMatches(): All fallback requests failed. Error:', err?.message || err);
            return [];
        }
    }

    try {
        const $ = cheerio.load(html);
        const matchAnchors = $('a').toArray();
        const seen = new Set<string>();
        const matches: Match[] = [];

        console.log('[liveCricketService] fetchLiveMatches(): total anchors found =', matchAnchors.length);

        for (const a of matchAnchors) {
            const href = $(a).attr('href');
            if (!href) continue;

            // Check if it's a match page link
            if (!href.includes('/live-cricket-scores/') && 
                !href.includes('/cricket-scores/') && 
                !href.includes('/cricket-scorecard/') && 
                !href.includes('/live-cricket-score/') &&
                !href.includes('/match/')) {
                continue;
            }

            const matchId = buildMatchIdFromUrl(href);
            if (!matchId || seen.has(matchId)) continue;

            const cardText = normalizeWhitespace($(a).text());
            const title = $(a).attr('title') || cardText;
            if (!title && !cardText) continue;

            // Extract team names
            let team1Name = '';
            let team2Name = '';
            const vsMatch = title.match(/(.+?)\s*(?:v|vs|VS)\s*(.+)/i);
            if (vsMatch) {
                team1Name = normalizeWhitespace(vsMatch[1]);
                team2Name = normalizeWhitespace(vsMatch[2]);
            } else {
                const parts = title.split(/[\-–|•]/g).map((p) => normalizeWhitespace(p));
                if (parts.length >= 2) {
                    team1Name = parts[0];
                    team2Name = parts[1];
                } else {
                    // Try parsing from cardText
                    const vsMatch2 = cardText.match(/(.+?)\s*(?:v|vs|VS)\s*(.+)/i);
                    if (vsMatch2) {
                        team1Name = normalizeWhitespace(vsMatch2[1]);
                        team2Name = normalizeWhitespace(vsMatch2[2]);
                    }
                }
            }

            // Cleanup team names (e.g. MI vs CSK 29th Match)
            // Remove text like "Match 29", "Commentary", "Scorecard", etc.
            const cleanTeam = (name: string) => {
                return name
                    .replace(/Match\s+\d+/i, '')
                    .replace(/\d+(st|nd|rd|th)\s+Match/i, '')
                    .replace(/Commentary|Scorecard|Highlights|Live/gi, '')
                    .replace(/,/g, '')
                    .trim();
            };

            team1Name = cleanTeam(team1Name);
            team2Name = cleanTeam(team2Name);

            // Status: infer from surrounding container
            const containerText = normalizeWhitespace($(a).closest('li, div, tr, td').text());
            const status = inferStatus(containerText, !!containerText.match(/\d+\s*\/\s*\d+/));
            const format = parseFormatFromText(containerText + ' ' + title);

            // Series/Tournament
            const tournamentText = normalizeWhitespace(
                $(a).closest('li, div, tr').find('[class*="cb-series" i], [class*="series" i], [class*="hdr" i]').text()
            );
            const tournament = tournamentText || 'Live Cricket';
            const { venue } = formatVenueAndStart($, $(a));

            const match: Match = {
                id: matchId,
                team1: { 
                    name: team1Name || 'Team 1', 
                    shortName: team1Name ? team1Name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() : 'T1' 
                },
                team2: { 
                    name: team2Name || 'Team 2', 
                    shortName: team2Name ? team2Name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase() : 'T2' 
                },
                tournament,
                format,
                status,
                startTime: new Date().toISOString(),
                venue: venue || '',
            };

            const score = parseScoreFromText(containerText);
            if (score && (score.team1Score || score.team2Score || score.result)) {
                match.score = score;
            }

            matches.push(match);
            seen.add(matchId);

            if (matches.length >= 12) break;
        }

        console.log('[liveCricketService] fetchLiveMatches(): successfully parsed matches count =', matches.length);
        _matchListCache = { value: matches, ts: nowMs() };
        return matches;
    } catch (err: any) {
        console.error('[liveCricketService] fetchLiveMatches(): Parsing error caught:', err);
        return [];
    }
}

export async function fetchMatchScore(matchId: string): Promise<MatchScore | undefined> {
    const cached = matchScoreCache.get(matchId);
    if (cached && withinTtl(cached.ts, MATCH_LIST_TTL_MS)) {
        return cached.value;
    }

    // Build a guess URL from matchId.
    // matchId is normalized as match-<number>.
    const m = matchId.match(/match-(\d+)/);
    if (!m?.[1]) return undefined;
    const matchNum = m[1];

    // Cricbuzz live score pages have /match/<id>/live-cricket-score
    const url = `${CRICBUZZ_BASE_URL}/match/${matchNum}/live-cricket-score`;

    try {
        const res = await axios.get(url, {
            timeout: 12_000,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        const $ = cheerio.load(res.data);

        // Score is usually in elements containing patterns like 156/4.
        const scoreText = normalizeWhitespace($('body').text());
        const score = parseScoreFromText(scoreText);

        matchScoreCache.set(matchId, { value: score, ts: nowMs() });
        return score;
    } catch {
        matchScoreCache.set(matchId, { value: undefined, ts: nowMs() });
        return undefined;
    }
}

export async function fetchMatchCommentary(matchId: string): Promise<string[]> {
    const cached = matchCommentaryCache.get(matchId);
    if (cached && withinTtl(cached.ts, MATCH_LIST_TTL_MS)) {
        return cached.value;
    }

    const m = matchId.match(/match-(\d+)/);
    if (!m?.[1]) return [];
    const matchNum = m[1];

    // Cricbuzz uses same live page; commentary often present there.
    const url = `${CRICBUZZ_BASE_URL}/match/${matchNum}/live-cricket-score`;

    try {
        const res = await axios.get(url, {
            timeout: 12_000,
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
        });

        const $ = cheerio.load(res.data);
        const commentary = parseCommentaryFromDom($);

        matchCommentaryCache.set(matchId, { value: commentary, ts: nowMs() });
        return commentary;
    } catch {
        matchCommentaryCache.set(matchId, { value: [], ts: nowMs() });
        return [];
    }
}

