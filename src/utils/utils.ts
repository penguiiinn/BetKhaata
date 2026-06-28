import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { BetStatus } from '../types/types';

dayjs.extend(relativeTime);

// ── Currency Formatting (Indian System) ───────────────────────────────

export function formatCurrency(amount: number, compact = false): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : amount > 0 ? '+' : '';
  const prefix = amount < 0 ? '-' : '';

  if (compact) {
    if (absAmount >= 10000000) {
      return `${prefix}₹${(absAmount / 10000000).toFixed(1)}Cr`;
    }
    if (absAmount >= 100000) {
      return `${prefix}₹${(absAmount / 100000).toFixed(1)}L`;
    }
    if (absAmount >= 1000) {
      return `${prefix}₹${(absAmount / 1000).toFixed(1)}K`;
    }
  }

  const formatted = absAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
  return `${prefix}₹${formatted}`;
}

export function formatCurrencyWithSign(amount: number): string {
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '+';
  const formatted = absAmount.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  });
  return `${sign}₹${formatted}`;
}

// ── Odds Formatting ───────────────────────────────────────────────────

export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

// ── Date/Time Formatting ──────────────────────────────────────────────

export function getRelativeTime(timestamp: string): string {
  return dayjs(timestamp).fromNow();
}

export function formatTime(timestamp: string): string {
  return dayjs(timestamp).format('h:mm A');
}

export function formatDate(timestamp: string): string {
  return dayjs(timestamp).format('DD MMM YYYY');
}

export function formatDateTime(timestamp: string): string {
  return dayjs(timestamp).format('DD MMM, h:mm A');
}

export function formatShortDate(timestamp: string): string {
  return dayjs(timestamp).format('DD MMM');
}

// ── Bet Calculations ──────────────────────────────────────────────────

export function calculatePotentialReturn(stake: number, odds: number): number {
  return stake * odds;
}

export function calculatePotentialProfit(stake: number, odds: number): number {
  return stake * (odds - 1);
}

// ── Risk Assessment ───────────────────────────────────────────────────

export function getRiskLevel(
  exposure: number,
  totalBalance: number,
): 'Low' | 'Medium' | 'High' {
  if (totalBalance === 0) return 'High';
  const ratio = exposure / totalBalance;
  if (ratio < 0.15) return 'Low';
  if (ratio < 0.40) return 'Medium';
  return 'High';
}

export function getRiskColor(risk: 'Low' | 'Medium' | 'High'): string {
  switch (risk) {
    case 'Low':
      return '#00C896';
    case 'Medium':
      return '#F5A623';
    case 'High':
      return '#FF5C72';
  }
}

// ── Status Helpers ────────────────────────────────────────────────────

export function getStatusColor(status: BetStatus): string {
  switch (status) {
    case 'won':
      return '#00C896';
    case 'lost':
      return '#FF5C72';
    case 'running':
      return '#F5A623';
    case 'void':
      return '#8B8FA3';
  }
}

export function getStatusBgColor(status: BetStatus): string {
  switch (status) {
    case 'won':
      return 'rgba(0, 200, 150, 0.12)';
    case 'lost':
      return 'rgba(255, 92, 114, 0.12)';
    case 'running':
      return 'rgba(245, 166, 35, 0.12)';
    case 'void':
      return 'rgba(139, 143, 163, 0.12)';
  }
}

// ── Date Checks ───────────────────────────────────────────────────────

export function isToday(timestamp: string): boolean {
  return dayjs(timestamp).isSame(dayjs(), 'day');
}

export function isThisWeek(timestamp: string): boolean {
  const now = dayjs();
  const date = dayjs(timestamp);
  return date.isAfter(now.subtract(7, 'day'));
}

// ── Format Badge Colors ───────────────────────────────────────────────

export function getFormatColor(format: string): string {
  switch (format) {
    case 'T20':
      return '#6C5CE7';
    case 'ODI':
      return '#00B894';
    case 'Test':
      return '#E17055';
    default:
      return '#8B8FA3';
  }
}

// ── Streak Calculations ───────────────────────────────────────────────

export function computeStreaks(
  bets: { status: BetStatus; timePlaced: string }[],
): {
  bestWin: number;
  worstLoss: number;
  currentStreakType: 'win' | 'loss' | 'none';
  currentStreakLength: number;
} {
  const settled = bets
    .filter((b) => b && (b.status === 'won' || b.status === 'lost'))
    .sort(
      (a, b) =>
        new Date(a.timePlaced).getTime() - new Date(b.timePlaced).getTime(),
    );

  let bestWin = 0;
  let worstLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;

  for (const bet of settled) {
    if (bet.status === 'won') {
      currentWin++;
      currentLoss = 0;
      if (currentWin > bestWin) bestWin = currentWin;
    } else {
      currentLoss++;
      currentWin = 0;
      if (currentLoss > worstLoss) worstLoss = currentLoss;
    }
  }

  let currentStreakType: 'win' | 'loss' | 'none' = 'none';
  let currentStreakLength = 0;

  if (currentWin > 0) {
    currentStreakType = 'win';
    currentStreakLength = currentWin;
  } else if (currentLoss > 0) {
    currentStreakType = 'loss';
    currentStreakLength = currentLoss;
  }

  return {
    bestWin,
    worstLoss,
    currentStreakType,
    currentStreakLength,
  };
}

// ── Edge Case Validation ──────────────────────────────────────────────

export function validateBetInput(
  stake: number,
  odds: number,
  selection: string,
  bankrollBalance: number,
): string | null {
  if (!selection || selection.trim().length === 0) {
    return 'Selection is required.';
  }
  if (isNaN(stake) || stake <= 0) {
    return 'Stake must be a positive number.';
  }
  if (isNaN(odds) || odds < 1.01) {
    return 'Odds must be at least 1.01.';
  }
  if (stake > bankrollBalance) {
    return `Insufficient balance. Available: ₹${bankrollBalance.toLocaleString('en-IN')}`;
  }
  return null;
}

// ── CSV Export ─────────────────────────────────────────────────────────

function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportBetsCSV(
  bets: {
    id: string;
    matchTitle: string;
    tournament: string;
    format: string;
    marketType: string;
    selection: string;
    stake: number;
    odds: number;
    timePlaced: string;
    status: string;
    profitLoss: number;
  }[] = [],
) {
  if (!bets || bets.length === 0) {
    alert('No bets to export.');
    return;
  }

  const headers = [
    'ID',
    'Match',
    'Tournament',
    'Format',
    'Market',
    'Selection',
    'Stake',
    'Odds',
    'Potential Return',
    'Time Placed',
    'Status',
    'Profit/Loss',
  ];

  const rows = (bets || []).map((b) => [
    b.id,
    `"${b.matchTitle}"`,
    `"${b.tournament}"`,
    b.format,
    `"${b.marketType}"`,
    `"${b.selection}"`,
    b.stake.toString(),
    b.odds.toFixed(2),
    (b.stake * b.odds).toFixed(0),
    dayjs(b.timePlaced).format('YYYY-MM-DD HH:mm'),
    b.status,
    b.profitLoss.toString(),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCSV(`betkhaata_bets_${dayjs().format('YYYY-MM-DD')}.csv`, csv);
}

export function exportBankrollHistoryCSV(
  entries: {
    id: string;
    bankrollId: string;
    balance: number;
    change: number;
    reason: string;
    timestamp: string;
  }[] = [],
) {
  if (!entries || entries.length === 0) {
    alert('No bankroll history to export.');
    return;
  }

  const headers = ['ID', 'Bankroll', 'Balance', 'Change', 'Reason', 'Timestamp'];

  const rows = (entries || []).map((e) => [
    e.id,
    e.bankrollId,
    e.balance.toString(),
    e.change.toString(),
    `"${e.reason}"`,
    dayjs(e.timestamp).format('YYYY-MM-DD HH:mm'),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadCSV(`betkhaata_bankroll_history_${dayjs().format('YYYY-MM-DD')}.csv`, csv);
}

export function exportBetsJSON(
  bets: {
    id: string;
    matchTitle: string;
    tournament: string;
    format: string;
    marketType: string;
    selection: string;
    stake: number;
    odds: number;
    timePlaced: string;
    status: string;
    profitLoss: number;
  }[] = [],
) {
  if (!bets || bets.length === 0) {
    alert('No bets to export.');
    return;
  }
  const jsonContent = JSON.stringify(bets, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `betkhaata_bets_${dayjs().format('YYYY-MM-DD')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

