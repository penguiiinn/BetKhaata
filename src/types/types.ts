// ── Match & Format Types ──────────────────────────────────────────────

export type MatchFormat = 'T20' | 'ODI' | 'Test';

export type MatchStatus = 'live' | 'upcoming' | 'finished';

export type BetStatus = 'running' | 'won' | 'lost' | 'void';

export type TabId = 'home' | 'matches' | 'bets' | 'insights' | 'bankroll';

// ── Market Types ──────────────────────────────────────────────────────

export type MarketType =
  | 'Match Winner'
  | 'Session Betting'
  | 'Top Batter'
  | 'Top Bowler'
  | 'Over Runs'
  | 'Player Runs'
  | 'Wickets'
  | 'Toss Winner'
  | 'Odd/Even'
  | 'Powerplay Runs'
  | 'Boundary Count'
  | 'Sixes Count';

export const MARKET_TYPES: MarketType[] = [
  'Match Winner',
  'Session Betting',
  'Top Batter',
  'Top Bowler',
  'Over Runs',
  'Player Runs',
  'Wickets',
  'Toss Winner',
  'Odd/Even',
  'Powerplay Runs',
  'Boundary Count',
  'Sixes Count',
];

// ── Data Interfaces ───────────────────────────────────────────────────

export interface TeamInfo {
  name: string;
  shortName: string;
}

export interface MatchScore {
  team1Score?: string;
  team2Score?: string;
  result?: string;
  overs?: string;
}

export interface Match {
  id: string;
  team1: TeamInfo;
  team2: TeamInfo;
  tournament: string;
  format: MatchFormat;
  status: MatchStatus;
  startTime: string;
  venue: string;
  score?: MatchScore;
  liveData?: MatchLiveData;
}

export interface Bet {
  id: string;
  matchId: string;
  matchTitle: string;
  tournament: string;
  format: MatchFormat;
  marketType: MarketType;
  selection: string;
  stake: number;
  odds: number;
  timePlaced: string;
  status: BetStatus;
  profitLoss: number;
  bankrollId: string;
}

export interface BankrollLimits {
  daily: number;
  weekly: number;
  monthly: number;
  dailyUsed: number;
  weeklyUsed: number;
  monthlyUsed: number;
}

export interface Bankroll {
  id: string;
  name: string;
  balance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  activeExposure: number;
  limits: BankrollLimits;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  bankrollId: string;
  timestamp: string;
  note?: string;
}

// ── Analytics Types ───────────────────────────────────────────────────

export interface DailyPnL {
  date: string;
  label: string;
  profit: number;
  loss: number;
  net: number;
}

export interface TournamentPerformance {
  tournament: string;
  totalBets: number;
  won: number;
  lost: number;
  profitLoss: number;
  winRate: number;
}

export interface TeamPerformance {
  team: string;
  betsOn: number;
  profitLoss: number;
  winRate: number;
}

export interface PlayerPerformance {
  player: string;
  market: string;
  bets: number;
  profitLoss: number;
  winRate: number;
}

export interface HourlyData {
  hour: string;
  bets: number;
  pnl: number;
}

export interface LossChaseWarning {
  detected: boolean;
  instances: number;
  description: string;
  averageStakeIncrease: string;
}

// ── Bankroll History ──────────────────────────────────────────────────

export interface BankrollHistoryEntry {
  id: string;
  bankrollId: string;
  balance: number;
  change: number;
  reason: string;
  timestamp: string;
}

// ── Analytics ─────────────────────────────────────────────────────────

export interface AnalyticsSnapshot {
  totalBets: number;
  winRate: number;
  lossRate: number;
  totalPnL: number;
  currentExposure: number;
  bestWinStreak: number;
  worstLoseStreak: number;
  currentStreakType: 'win' | 'loss' | 'none';
  currentStreakLength: number;
  averageOdds: number;
  roiPercent: number;
  totalSettled: number;
  activeBets: number;
}

// ── Sorting ───────────────────────────────────────────────────────────

export type BetSortKey = 'newest' | 'oldest' | 'highest_stake' | 'highest_profit';

// ── Live Cricket Engine Types ─────────────────────────────────────────

export interface LivePlayer {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  howOut?: string;
  overs?: number;
  runsConceded?: number;
  wickets?: number;
  maidens?: number;
}

export interface LiveMarket {
  id: string;
  type: 'over_runs' | 'wickets' | 'partnership';
  title: string;
  question: string;
  target: number;
  oddsOver: number;
  oddsUnder: number;
  status: 'open' | 'settled';
  result?: 'over' | 'under';
}

export interface MatchLiveData {
  innings: 1 | 2;
  battingTeam: string; // shortName
  bowlingTeam: string; // shortName
  oversBowled: number; // e.g. 14.3
  ballsInOver: number; // 0 to 5
  runsInCurrentOver: number; // to track current over runs
  runsCurrentOverList: number[]; // e.g. [1, 4, 0, 1, 6, 0]
  target?: number;
  wickets: number;
  runs: number;
  crr: number;
  rrr?: number;
  liveStatus: string;
  batsmen: LivePlayer[];
  bowlers: LivePlayer[];
  currentBatsmenIds: number[]; // indices of the 2 active batsmen
  currentBowlerId: number;     // index of the current bowler
  partnershipRuns: number;
  partnershipBalls: number;
  sessionMarkets: LiveMarket[];
}


