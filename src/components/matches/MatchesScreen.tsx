import { useMemo, useState, useEffect } from 'react';
import { useBetStore } from '../../store/betStore';
import type { MatchStatus } from '../../types/types';
import MatchCard from './MatchCard';
import TournamentStandings from './TournamentStandings';
import clsx from 'clsx';
import { Loader2, AlertCircle } from 'lucide-react';

const matchTabs: { id: MatchStatus; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'finished', label: 'Finished' },
];

export default function MatchesScreen() {
  const [activeView, setActiveView] = useState<'fixtures' | 'standings'>('fixtures');
  const matchTab = useBetStore((s) => s.matchTab);
  const setMatchTab = useBetStore((s) => s.setMatchTab);
  const allMatches = useBetStore((s) => s.matches);
  const refreshCricketMatches = useBetStore((s) => s.refreshCricketMatches);

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const matches = useMemo(
    () => allMatches.filter((m) => m.status === matchTab),
    [allMatches, matchTab],
  );

  useEffect(() => {
    let active = true;
    const runSync = async () => {
      if (!active) return;
      try {
        setSyncing(true);
        setSyncError(null);
        await refreshCricketMatches();
      } catch (err: any) {
        setSyncError(err?.message || 'Sync failed');
      } finally {
        setSyncing(false);
      }
    };

    runSync();

    const interval = setInterval(() => {
      runSync();
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [refreshCricketMatches]);

  return (
    <div className="px-4 py-4 w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-4">
      {/* Sync Status Banner */}
      {(syncing || syncError) && (
        <div className={clsx(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold tracking-wide transition-all border shrink-0 justify-center",
          syncError 
            ? "bg-loss/[0.06] border-loss/20 text-loss"
            : "bg-gold/[0.06] border-gold/20 text-gold"
        )}>
          {syncing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>SYNCING REAL CRICKET MATCHES FROM API...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>SYNC ERROR: {syncError?.toUpperCase()} (USING OFFLINE SIMULATOR)</span>
            </>
          )}
        </div>
      )}
      {/* Top fixtures vs standings view toggle */}
      <div className="flex border-b border-white/[0.04]">
        <button
          onClick={() => setActiveView('fixtures')}
          className={clsx(
            'pb-2 px-4 text-xs font-bold transition-all relative',
            activeView === 'fixtures'
              ? 'text-white border-b-2 border-gold font-extrabold'
              : 'text-dim hover:text-white',
          )}
        >
          Match Fixtures
        </button>
        <button
          onClick={() => setActiveView('standings')}
          className={clsx(
            'pb-2 px-4 text-xs font-bold transition-all relative',
            activeView === 'standings'
              ? 'text-white border-b-2 border-gold font-extrabold'
              : 'text-dim hover:text-white',
          )}
        >
          Tournament Standings
        </button>
      </div>

      {activeView === 'fixtures' ? (
        <>
          {/* Tab bar */}
          <div
            className="flex gap-1 bg-surface card-border rounded-xl p-1 animate-slide-up"
            style={{ opacity: 1 }}
          >
            {matchTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMatchTab(tab.id)}
                className={clsx(
                  'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative',
                  matchTab === tab.id
                    ? 'bg-surface-light text-white shadow-sm'
                    : 'text-muted hover:text-white',
                )}
              >
                {tab.label}
                {tab.id === 'live' && matchTab !== 'live' && (
                  <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-loss animate-pulse-soft" />
                )}
              </button>
            ))}
          </div>

          {/* Match list */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.length > 0 ? (
              matches.map((match, i) => (
                <div
                  key={match.id}
                  className="animate-slide-up"
                  style={{ opacity: 1, animationDelay: `${0.05 * (i + 1)}s` }}
                >
                  <MatchCard match={match} />
                </div>
              ))
            ) : (
              <div className="text-center py-16 col-span-full">
                <p className="text-muted text-sm">No {matchTab} matches</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <TournamentStandings />
      )}
    </div>
  );
}
