import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import dayjs from 'dayjs';
import type {
  AnalyticsSnapshot,
  Bet,
  BetSortKey,
  BetStatus,
  Bankroll,
  BankrollHistoryEntry,
  DailyPnL,
  Match,
  MatchStatus,
  TabId,
  Transaction,
  TournamentPerformance,
  TeamPerformance,
  PlayerPerformance,
} from '../types/types';
import {
  mockBets,
  mockBankrollHistory,
  mockBankrolls,
  mockMatches,
  mockTransactions,
} from '../data/mockData';
import { computeStreaks, isThisWeek, isToday } from '../utils/utils';

// ── Filter & Modal Types ──────────────────────────────────────────────

interface BetFilters {
  period: 'all' | 'today' | 'week';
  status: BetStatus | 'all';
  tournament: string;
  search: string;
  sort: BetSortKey;
  format: 'all' | 'IPL' | 'T20' | 'ODI' | 'Test';
  marketType: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface Modals {
  addBet: boolean;
  deposit: boolean;
  withdraw: boolean;
  setLimit: boolean;
  matchCenter: boolean;
}

// ── Store Interface ───────────────────────────────────────────────────

interface BetState {
  bets: Bet[];
  matches: Match[];
  bankrolls: Bankroll[];
  transactions: Transaction[];
  bankrollHistory: BankrollHistoryEntry[];
  activeTab: TabId;
  matchTab: MatchStatus;
  betFilters: BetFilters;
  modals: Modals;
  selectedMatchId: string | null;
  editBetId: string | null;
  prefilledBet?: {
    marketType: string;
    selection: string;
    odds: number;
  };
}

interface BetActions {
  setActiveTab: (tab: TabId) => void;
  setMatchTab: (tab: MatchStatus) => void;
  setBetFilters: (filters: Partial<BetFilters>) => void;
  openModal: (modal: keyof Modals) => void;
  closeModal: (modal: keyof Modals) => void;
  closeAllModals: () => void;
  addBet: (bet: Omit<Bet, 'id'>) => void;
  setSelectedMatchId: (id: string | null) => void;
  settleBet: (betId: string, status: 'won' | 'lost' | 'void') => void;
  deposit: (bankrollId: string, amount: number) => void;
  withdraw: (bankrollId: string, amount: number) => void;
  setLimit: (bankrollId: string, limit: number) => void;
  deleteBet: (betId: string) => void;
  editBet: (betId: string, updates: Partial<Omit<Bet, 'id'>>) => void;
  setEditBetId: (id: string | null) => void;
  setPrefilledBet: (bet: { marketType: string; selection: string; odds: number } | undefined) => void;
  importBackup: (backup: any) => boolean;
  resetAllData: () => void;
  tickCricketEngine: () => void;
}

export type BetStore = BetState & BetActions;

// ── Helper: record bankroll change ────────────────────────────────────

function createHistoryEntry(
  bankrollId: string,
  balance: number,
  change: number,
  reason: string,
): BankrollHistoryEntry {
  return {
    id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    bankrollId,
    balance,
    change,
    reason,
    timestamp: new Date().toISOString(),
  };
}

// ── localStorage corruption protection (safe sanitize) ───────────────

function safeParseJSON<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

type PersistedShape = Partial<{
  bets: unknown;
  matches: unknown;
  bankrolls: unknown;
  transactions: unknown;
  bankrollHistory: unknown;
}>;

function sanitizePersistedState(
  raw: PersistedShape | null | undefined,
): {
  bets: Bet[];
  matches: Match[];
  bankrolls: Bankroll[];
  transactions: Transaction[];
  bankrollHistory: BankrollHistoryEntry[];
} {
  const fallback = {
    bets: mockBets,
    matches: mockMatches,
    bankrolls: mockBankrolls,
    transactions: mockTransactions,
    bankrollHistory: mockBankrollHistory,
  };

  if (!raw || typeof raw !== 'object') return fallback;

  const betsRaw = (raw as any).bets;
  const matchesRaw = (raw as any).matches;
  const bankrollsRaw = (raw as any).bankrolls;
  const transactionsRaw = (raw as any).transactions;
  const bankrollHistoryRaw = (raw as any).bankrollHistory;

  const betsArr = Array.isArray(betsRaw) ? betsRaw : null;
  const matchesArr = Array.isArray(matchesRaw) ? matchesRaw : null;
  const bankrollsArr = Array.isArray(bankrollsRaw) ? bankrollsRaw : null;
  const transactionsArr = Array.isArray(transactionsRaw) ? transactionsRaw : null;
  const historyArr = Array.isArray(bankrollHistoryRaw) ? bankrollHistoryRaw : null;

  const safeBet = (b: any): Bet | null => {
    if (!b || typeof b !== 'object') return null;
    if (typeof b.id !== 'string') return null;
    if (typeof b.bankrollId !== 'string') return null;
    if (typeof b.matchTitle !== 'string') return null;
    if (typeof b.selection !== 'string') return null;
    if (!b.timePlaced || typeof b.timePlaced !== 'string') return null;

    const stake = Number(b.stake);
    const odds = Number(b.odds);
    const profitLoss = Number(b.profitLoss);

    if (!Number.isFinite(stake) || stake <= 0) return null;
    if (!Number.isFinite(odds) || odds < 1.01) return null;
    if (!Number.isFinite(profitLoss)) return null;

    const status: BetStatus = b.status;
    if (!['running', 'won', 'lost', 'void'].includes(status)) return null;

    const format = b.format;
    const marketType = b.marketType;
    if (typeof format !== 'string' || typeof marketType !== 'string') return null;

    return {
      id: b.id,
      matchId: typeof b.matchId === 'string' ? b.matchId : '',
      matchTitle: b.matchTitle,
      tournament: typeof b.tournament === 'string' ? b.tournament : 'all',
      format: format as any,
      marketType: marketType as any,
      selection: b.selection,
      stake,
      odds,
      timePlaced: b.timePlaced,
      status,
      profitLoss,
      bankrollId: b.bankrollId,
    };
  };

  const safeBankroll = (b: any): Bankroll | null => {
    if (!b || typeof b !== 'object') return null;
    if (typeof b.id !== 'string') return null;
    const balance = Number(b.balance);
    if (!Number.isFinite(balance)) return null;

    const limitsRaw = b.limits || {};
    const dailyUsed = Number(limitsRaw.dailyUsed);
    const weeklyUsed = Number(limitsRaw.weeklyUsed);
    const monthlyUsed = Number(limitsRaw.monthlyUsed);
    const daily = Number(limitsRaw.daily);
    const weekly = Number(limitsRaw.weekly);
    const monthly = Number(limitsRaw.monthly);

    const mkFinite = (n: any, fb: number) => (Number.isFinite(Number(n)) ? Number(n) : fb);

    return {
      id: b.id,
      name: typeof b.name === 'string' ? b.name : 'Bankroll',
      balance,
      totalDeposits: mkFinite(b.totalDeposits, 0),
      totalWithdrawals: mkFinite(b.totalWithdrawals, 0),
      activeExposure: mkFinite(b.activeExposure, 0),
      color: typeof b.color === 'string' ? b.color : '#6C5CE7',
      limits: {
        daily: mkFinite(daily, 0),
        weekly: mkFinite(weekly, 0),
        monthly: mkFinite(monthly, 0),
        dailyUsed: mkFinite(dailyUsed, 0),
        weeklyUsed: mkFinite(weeklyUsed, 0),
        monthlyUsed: mkFinite(monthlyUsed, 0),
      },
    };
  };

  const bets = (betsArr ? betsArr : fallback.bets).map(safeBet).filter((x: Bet | null): x is Bet => !!x);
  const bankrolls = (bankrollsArr ? bankrollsArr : fallback.bankrolls)
    .map(safeBankroll)
    .filter((x: Bankroll | null): x is Bankroll => !!x);

  // matches/transactions/history: keep permissive since they’re used in UI charts; if corrupted, fallback.
  const matches = matchesArr && matchesArr.length > 0 ? (matchesArr as any) : fallback.matches;
  const transactions = transactionsArr && transactionsArr.length >= 0 ? (transactionsArr as any) : fallback.transactions;
  const bankrollHistory = historyArr && historyArr.length >= 0 ? (historyArr as any) : fallback.bankrollHistory;

  return {
    bets: bets.length > 0 ? bets : fallback.bets,
    matches: Array.isArray(matches) && matches.length > 0 ? (matches as any) : fallback.matches,
    bankrolls: bankrolls.length > 0 ? bankrolls : fallback.bankrolls,
    transactions: Array.isArray(transactions) ? (transactions as any) : fallback.transactions,
    bankrollHistory: Array.isArray(bankrollHistory) ? (bankrollHistory as any) : fallback.bankrollHistory,
  };
}

export const useBetStore = create<BetStore>()(
  persist(
    (set) => ({
      // Data
      bets: mockBets,
      matches: mockMatches,
      bankrolls: mockBankrolls,
      transactions: mockTransactions,
      bankrollHistory: mockBankrollHistory,

      // UI state (NOT persisted)
      activeTab: 'home',
      matchTab: 'live',
      betFilters: {
        period: 'all',
        status: 'all',
        tournament: 'all',
        search: '',
        sort: 'newest',
        format: 'all',
        marketType: 'all',
        dateRange: { start: '', end: '' },
      },
      modals: { addBet: false, deposit: false, withdraw: false, setLimit: false, matchCenter: false },
      selectedMatchId: null,
      editBetId: null,
      prefilledBet: undefined,

      // ── UI Actions ────────────────────────────────────────────────

      setActiveTab: (tab) => set({ activeTab: tab }),
      setMatchTab: (tab) => set({ matchTab: tab }),

      setBetFilters: (filters) => set((s) => ({ betFilters: { ...s.betFilters, ...filters } })),

      openModal: (modal) => set((s) => ({ modals: { ...s.modals, [modal]: true } })),
      closeModal: (modal) => set((s) => ({ modals: { ...s.modals, [modal]: false } })),
      closeAllModals: () =>
        set({
          modals: { addBet: false, deposit: false, withdraw: false, setLimit: false, matchCenter: false },
        }),

      setSelectedMatchId: (id) => set({ selectedMatchId: id }),
      setEditBetId: (id) => set({ editBetId: id }),
      setPrefilledBet: (bet) => set({ prefilledBet: bet }),

      // ── Add Bet ───────────────────────────────────────────────────

      addBet: (bet) =>
        set((s) => {
          if (!bet.selection || bet.selection.trim().length === 0) return {};
          if (isNaN(bet.stake) || bet.stake <= 0) return {};
          if (isNaN(bet.odds) || bet.odds < 1.01) return {};

          const bankroll = s.bankrolls.find((b) => b.id === bet.bankrollId);
          if (!bankroll || bet.stake > bankroll.balance) return {};

          const newBalance = bankroll.balance - bet.stake;
          const bankrolls = s.bankrolls.map((b) =>
            b.id === bet.bankrollId
              ? {
                ...b,
                balance: newBalance,
                activeExposure: b.activeExposure + bet.stake,
                limits: {
                  ...b.limits,
                  dailyUsed: b.limits.dailyUsed + bet.stake,
                  weeklyUsed: b.limits.weeklyUsed + bet.stake,
                  monthlyUsed: b.limits.monthlyUsed + bet.stake,
                },
              }
              : b,
          );

          const historyEntry = createHistoryEntry(
            bet.bankrollId,
            newBalance,
            -bet.stake,
            `Bet placed: ${bet.selection}`,
          );

          return {
            bets: [{ ...bet, id: `bet-${Date.now()}` }, ...s.bets],
            bankrolls,
            bankrollHistory: [...s.bankrollHistory, historyEntry],
          };
        }),

      // ── Settle Bet ────────────────────────────────────────────────

      settleBet: (betId, status) =>
        set((s) => {
          const betIndex = s.bets.findIndex((b) => b.id === betId);
          if (betIndex === -1) return {};

          const bet = s.bets[betIndex];
          if (bet.status !== 'running') return {};

          let profitLoss = 0;
          let balanceReturn = 0;

          if (status === 'won') {
            profitLoss = bet.stake * (bet.odds - 1);
            balanceReturn = bet.stake * bet.odds;
          } else if (status === 'lost') {
            profitLoss = -bet.stake;
            balanceReturn = 0;
          } else {
            profitLoss = 0;
            balanceReturn = bet.stake;
          }

          const updatedBets = s.bets.map((b) =>
            b.id === betId ? { ...b, status, profitLoss } : b,
          );

          const bankrolls = s.bankrolls.map((b) => {
            if (b.id === bet.bankrollId) {
              return {
                ...b,
                balance: b.balance + balanceReturn,
                activeExposure: Math.max(0, b.activeExposure - bet.stake),
              };
            }
            return b;
          });

          const updatedBankroll = bankrolls.find((b) => b.id === bet.bankrollId);
          const reason =
            status === 'won'
              ? `Won: ${bet.selection}`
              : status === 'lost'
                ? `Lost: ${bet.selection}`
                : `Void: ${bet.selection}`;

          const historyEntry = createHistoryEntry(
            bet.bankrollId,
            updatedBankroll?.balance ?? 0,
            balanceReturn,
            reason,
          );

          return {
            bets: updatedBets,
            bankrolls,
            bankrollHistory: [...s.bankrollHistory, historyEntry],
          };
        }),

      // ── Deposit ───────────────────────────────────────────────────

      deposit: (bankrollId, amount) =>
        set((s) => {
          if (isNaN(amount) || amount <= 0) return {};

          const bankrolls = s.bankrolls.map((b) =>
            b.id === bankrollId
              ? {
                ...b,
                balance: b.balance + amount,
                totalDeposits: b.totalDeposits + amount,
              }
              : b,
          );

          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: 'deposit',
            amount,
            bankrollId,
            timestamp: new Date().toISOString(),
          };

          const updatedBankroll = bankrolls.find((b) => b.id === bankrollId);
          const historyEntry = createHistoryEntry(
            bankrollId,
            updatedBankroll?.balance ?? 0,
            amount,
            'Deposit',
          );

          return {
            bankrolls,
            transactions: [transaction, ...s.transactions],
            bankrollHistory: [...s.bankrollHistory, historyEntry],
          };
        }),

      // ── Withdraw ──────────────────────────────────────────────────

      withdraw: (bankrollId, amount) =>
        set((s) => {
          if (isNaN(amount) || amount <= 0) return {};
          const bankroll = s.bankrolls.find((b) => b.id === bankrollId);
          if (!bankroll || amount > bankroll.balance) return {};

          const bankrolls = s.bankrolls.map((b) =>
            b.id === bankrollId
              ? {
                ...b,
                balance: b.balance - amount,
                totalWithdrawals: b.totalWithdrawals + amount,
              }
              : b,
          );

          const transaction: Transaction = {
            id: `tx-${Date.now()}`,
            type: 'withdrawal',
            amount,
            bankrollId,
            timestamp: new Date().toISOString(),
          };

          const updatedBankroll = bankrolls.find((b) => b.id === bankrollId);
          const historyEntry = createHistoryEntry(
            bankrollId,
            updatedBankroll?.balance ?? 0,
            -amount,
            'Withdrawal',
          );

          return {
            bankrolls,
            transactions: [transaction, ...s.transactions],
            bankrollHistory: [...s.bankrollHistory, historyEntry],
          };
        }),

      // ── Set Limit ─────────────────────────────────────────────────

      setLimit: (bankrollId, limit) =>
        set((s) => ({
          bankrolls: s.bankrolls.map((b) =>
            b.id === bankrollId
              ? {
                ...b,
                limits: { ...b.limits, daily: limit },
              }
              : b,
          ),
        })),

      // ── Delete Bet ───────────────────────────────────────────────

      deleteBet: (betId) =>
        set((s) => {
          const bet = s.bets.find((b) => b.id === betId);
          if (!bet) return {};

          let bankrolls = s.bankrolls;
          const newHistory: BankrollHistoryEntry[] = [];

          if (bet.status === 'running') {
            bankrolls = s.bankrolls.map((b) => {
              if (b.id === bet.bankrollId) {
                const newBalance = b.balance + bet.stake;
                newHistory.push(
                  createHistoryEntry(
                    bet.bankrollId,
                    newBalance,
                    bet.stake,
                    `Bet deleted (refund): ${bet.selection}`,
                  ),
                );
                return {
                  ...b,
                  balance: newBalance,
                  activeExposure: Math.max(0, b.activeExposure - bet.stake),
                };
              }
              return b;
            });
          }

          return {
            bets: s.bets.filter((b) => b.id !== betId),
            bankrolls,
            bankrollHistory: [...s.bankrollHistory, ...newHistory],
          };
        }),

      // ── Edit Bet ──────────────────────────────────────────────────

      editBet: (betId, updates) =>
        set((s) => {
          const bet = s.bets.find((b) => b.id === betId);
          if (!bet || bet.status !== 'running') return {};

          if (updates.stake !== undefined && (isNaN(updates.stake) || updates.stake <= 0)) return {};
          if (updates.odds !== undefined && (isNaN(updates.odds) || updates.odds < 1.01)) return {};
          if (updates.selection !== undefined && updates.selection.trim().length === 0) return {};

          const stakeDiff = (updates.stake ?? bet.stake) - bet.stake;
          let bankrolls = s.bankrolls;
          const newHistory: BankrollHistoryEntry[] = [];

          if (stakeDiff !== 0) {
            const bankroll = s.bankrolls.find((b) => b.id === bet.bankrollId);
            if (!bankroll) return {};

            if (stakeDiff > 0 && stakeDiff > bankroll.balance) return {};

            bankrolls = s.bankrolls.map((b) => {
              if (b.id === bet.bankrollId) {
                const newBalance = b.balance - stakeDiff;
                newHistory.push(
                  createHistoryEntry(
                    bet.bankrollId,
                    newBalance,
                    -stakeDiff,
                    `Bet edited: ${bet.selection}`,
                  ),
                );
                return {
                  ...b,
                  balance: newBalance,
                  activeExposure: Math.max(0, b.activeExposure + stakeDiff),
                };
              }
              return b;
            });
          }

          return {
            bets: s.bets.map((b) => (b.id === betId ? { ...b, ...updates } : b)),
            bankrolls,
            bankrollHistory: [...s.bankrollHistory, ...newHistory],
          };
        }),

      // ── Data Backup / Restore ──────────────────────────────────────

      importBackup: (backup) => {
        try {
          // If it's a string, try parsing it first
          const parsed = typeof backup === 'string' ? JSON.parse(backup) : backup;
          const sanitized = sanitizePersistedState(parsed);
          set({
            bets: sanitized.bets,
            matches: sanitized.matches,
            bankrolls: sanitized.bankrolls,
            transactions: sanitized.transactions,
            bankrollHistory: sanitized.bankrollHistory,
          });
          return true;
        } catch (e) {
          console.error('Failed to import backup:', e);
          return false;
        }
      },

      resetAllData: () =>
        set(() => {
          const fallback = {
            bets: mockBets,
            matches: mockMatches,
            bankrolls: mockBankrolls,
            transactions: mockTransactions,
            bankrollHistory: mockBankrollHistory,
          };
          return {
            bets: fallback.bets,
            matches: fallback.matches,
            bankrolls: fallback.bankrolls,
            transactions: fallback.transactions,
            bankrollHistory: fallback.bankrollHistory,
          };
        }),

      // ── Cricket Engine Simulation Tick ─────────────────────────────

      tickCricketEngine: () =>
        set((s) => {
          let matchesChanged = false;
          let betsChanged = false;
          let bankrollsChanged = false;
          let historyChanged = false;

          let updatedBets = [...s.bets];
          let updatedBankrolls = [...s.bankrolls];
          let updatedHistory = [...s.bankrollHistory];

          // Helper to settle a bet dynamically in simulation
          const autoSettle = (
            betId: string,
            status: 'won' | 'lost' | 'void',
            profitLoss: number,
            returnAmt: number,
            reason: string,
          ) => {
            const betIdx = updatedBets.findIndex((b) => b.id === betId);
            if (betIdx === -1) return;
            const bet = updatedBets[betIdx];
            if (bet.status !== 'running') return;

            // Settle bet
            updatedBets[betIdx] = { ...bet, status, profitLoss };
            betsChanged = true;

            // Update bankroll balance
            updatedBankrolls = updatedBankrolls.map((b) => {
              if (b.id === bet.bankrollId) {
                bankrollsChanged = true;
                return {
                  ...b,
                  balance: b.balance + returnAmt,
                  activeExposure: Math.max(0, b.activeExposure - bet.stake),
                };
              }
              return b;
            });

            // Add history entry
            const bankroll = updatedBankrolls.find((b) => b.id === bet.bankrollId);
            const entry = createHistoryEntry(
              bet.bankrollId,
              bankroll?.balance ?? 0,
              returnAmt,
              reason,
            );
            updatedHistory = [...updatedHistory, entry];
            historyChanged = true;
          };

          const updatedMatches = s.matches.map((m) => {
            if (m.status !== 'live') return m;
            matchesChanged = true;

            // 1. Initialize live data if not present
            if (!m.liveData) {
              const team1Players = [
                'Ruturaj Gaikwad',
                'Rachin Ravindra',
                'Ajinkya Rahane',
                'Shivam Dube',
                'Daryl Mitchell',
                'Ravindra Jadeja',
                'MS Dhoni',
                'Mitchell Santner',
                'Shardul Thakur',
                'Tushar Deshpande',
                'Matheesha Pathirana',
              ];
              const team2Players = [
                'Rohit Sharma',
                'Ishan Kishan',
                'Suryakumar Yadav',
                'Tilak Varma',
                'Hardik Pandya',
                'Tim David',
                'Romario Shepherd',
                'Gerald Coetzee',
                'Jasprit Bumrah',
                'Piyush Chawla',
                'Akash Madhwal',
              ];

              const team1Bowlers = ['Jasprit Bumrah', 'Gerald Coetzee', 'Piyush Chawla', 'Hardik Pandya', 'Akash Madhwal'];
              const team2Bowlers = ['Matheesha Pathirana', 'Ravindra Jadeja', 'Shardul Thakur', 'Tushar Deshpande', 'Mitchell Santner'];

              const formatTeams = m.team1.shortName === 'CSK' ? { bat: team1Players, bowl: team1Bowlers } : { bat: team2Players, bowl: team2Bowlers };
              const oppTeams = m.team1.shortName === 'CSK' ? { bat: team2Players, bowl: team2Bowlers } : { bat: team1Players, bowl: team1Bowlers };

              const batsmen = formatTeams.bat.map((name) => ({
                name,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
              }));
              const bowlers = oppTeams.bowl.map((name) => ({
                name,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                overs: 0,
                runsConceded: 0,
                wickets: 0,
                maidens: 0,
              }));

              const sessionMarkets = [
                {
                  id: `${m.id}-sm-over`,
                  type: 'over_runs' as const,
                  title: 'Next Over Runs',
                  question: 'Runs scored in Over 1',
                  target: 7.5,
                  oddsOver: 1.9,
                  oddsUnder: 1.9,
                  status: 'open' as const,
                },
                {
                  id: `${m.id}-sm-wicket`,
                  type: 'wickets' as const,
                  title: 'Wickets in Session',
                  question: 'Will a wicket fall in next 3 overs?',
                  target: 0.5,
                  oddsOver: 2.1,
                  oddsUnder: 1.65,
                  status: 'open' as const,
                },
                {
                  id: `${m.id}-sm-partnership`,
                  type: 'partnership' as const,
                  title: 'Partnership Runs',
                  question: 'Will current partnership cross 35.5 runs?',
                  target: 35.5,
                  oddsOver: 1.85,
                  oddsUnder: 1.85,
                  status: 'open' as const,
                },
              ];

              return {
                ...m,
                score: {
                  team1Score: '0/0',
                  team2Score: '',
                  overs: '0.0',
                },
                liveData: {
                  innings: 1,
                  battingTeam: m.team1.shortName,
                  bowlingTeam: m.team2.shortName,
                  oversBowled: 0.0,
                  ballsInOver: 0,
                  runsInCurrentOver: 0,
                  runsCurrentOverList: [],
                  wickets: 0,
                  runs: 0,
                  crr: 0,
                  liveStatus: `${m.team1.shortName} elected to bat first.`,
                  batsmen,
                  bowlers,
                  currentBatsmenIds: [0, 1],
                  currentBowlerId: 0,
                  partnershipRuns: 0,
                  partnershipBalls: 0,
                  sessionMarkets,
                },
              };
            }

            // 2. Simulate ball update
            const ld = { ...m.liveData };
            const batsmen = ld.batsmen.map((b) => ({ ...b }));
            const bowlers = ld.bowlers.map((b) => ({ ...b }));

            const strikeIdx = ld.currentBatsmenIds[0];
            const nonStrikeIdx = ld.currentBatsmenIds[1];
            const bowlerIdx = ld.currentBowlerId;

            const outcomeRand = Math.random();
            let runs = 0;
            let isWicket = false;

            if (outcomeRand < 0.35) {
              runs = 0;
            } else if (outcomeRand < 0.75) {
              runs = 1;
            } else if (outcomeRand < 0.85) {
              runs = 2;
            } else if (outcomeRand < 0.91) {
              runs = 4;
            } else if (outcomeRand < 0.95) {
              runs = 6;
            } else {
              isWicket = true;
            }

            // Update stats
            ld.ballsInOver++;
            ld.partnershipBalls++;

            if (isWicket) {
              ld.wickets++;
              batsmen[strikeIdx] = {
                ...batsmen[strikeIdx],
                balls: batsmen[strikeIdx].balls + 1,
                isOut: true,
                howOut: `c fielder b ${bowlers[bowlerIdx].name}`,
              };
              bowlers[bowlerIdx] = {
                ...bowlers[bowlerIdx],
                wickets: bowlers[bowlerIdx].wickets + 1,
              };

              // Wickets in session check
              const wicketMarket = ld.sessionMarkets.find(
                (x) => x.type === 'wickets' && x.status === 'open',
              );
              if (wicketMarket) {
                // Wicket fell, Over wins
                wicketMarket.status = 'settled';
                wicketMarket.result = 'over';

                // settle bets
                const matchBets = updatedBets.filter(
                  (b) =>
                    b.matchId === m.id &&
                    b.status === 'running' &&
                    b.marketType === 'Wickets',
                );
                for (const b of matchBets) {
                  const sel = b.selection.toLowerCase();
                  if (sel.includes('over')) {
                    autoSettle(
                      b.id,
                      'won',
                      b.stake * (b.odds - 1),
                      b.stake * b.odds,
                      'Won: Wicket fell in session',
                    );
                  } else {
                    autoSettle(b.id, 'lost', -b.stake, 0, 'Lost: Wicket fell in session');
                  }
                }
              }

              // Partnership check
              const partMarket = ld.sessionMarkets.find(
                (x) => x.type === 'partnership' && x.status === 'open',
              );
              if (partMarket) {
                const crossed = ld.partnershipRuns >= partMarket.target;
                partMarket.status = 'settled';
                partMarket.result = crossed ? 'over' : 'under';

                const matchBets = updatedBets.filter(
                  (b) =>
                    b.matchId === m.id &&
                    b.status === 'running' &&
                    b.marketType === 'Boundary Count',
                );
                for (const b of matchBets) {
                  if (b.selection.toLowerCase().includes('over')) {
                    if (crossed) {
                      autoSettle(
                        b.id,
                        'won',
                        b.stake * (b.odds - 1),
                        b.stake * b.odds,
                        `Won: Partnership crossed ${partMarket.target}`,
                      );
                    } else {
                      autoSettle(
                        b.id,
                        'lost',
                        -b.stake,
                        0,
                        `Lost: Partnership failed to cross ${partMarket.target}`,
                      );
                    }
                  } else {
                    if (crossed) {
                      autoSettle(
                        b.id,
                        'lost',
                        -b.stake,
                        0,
                        `Lost: Partnership crossed ${partMarket.target}`,
                      );
                    } else {
                      autoSettle(
                        b.id,
                        'won',
                        b.stake * (b.odds - 1),
                        b.stake * b.odds,
                        `Won: Partnership stayed under ${partMarket.target}`,
                      );
                    }
                  }
                }
              }

              // Reset partnership
              ld.partnershipRuns = 0;
              ld.partnershipBalls = 0;

              // Bring next batsman in
              const nextBatsmanIdx = batsmen.findIndex(
                (bt) => !bt.isOut && !ld.currentBatsmenIds.includes(batsmen.indexOf(bt)),
              );
              if (nextBatsmanIdx !== -1 && ld.wickets < 10) {
                ld.currentBatsmenIds = [nextBatsmanIdx, nonStrikeIdx];
                ld.liveStatus = `${batsmen[strikeIdx].name} falls. ${batsmen[nextBatsmanIdx].name} comes to the crease.`;
              } else {
                ld.liveStatus = 'All out! Innings complete.';
              }
            } else {
              ld.runs += runs;
              ld.runsInCurrentOver += runs;
              ld.runsCurrentOverList = [...ld.runsCurrentOverList, runs];
              ld.partnershipRuns += runs;

              batsmen[strikeIdx] = {
                ...batsmen[strikeIdx],
                runs: batsmen[strikeIdx].runs + runs,
                balls: batsmen[strikeIdx].runs === 0 && runs === 0 && batsmen[strikeIdx].balls === 0 ? 1 : batsmen[strikeIdx].balls + 1,
                fours: batsmen[strikeIdx].fours + (runs === 4 ? 1 : 0),
                sixes: batsmen[strikeIdx].sixes + (runs === 6 ? 1 : 0),
              };

              // Correct balls count
              if (runs > 0 && batsmen[strikeIdx].balls === 0) {
                batsmen[strikeIdx].balls = 1;
              }

              bowlers[bowlerIdx] = {
                ...bowlers[bowlerIdx],
                runsConceded: bowlers[bowlerIdx].runsConceded + runs,
              };

              // Rotate strike on odd runs
              if (runs === 1 || runs === 3) {
                ld.currentBatsmenIds = [nonStrikeIdx, strikeIdx];
              }

              ld.liveStatus = `${batsmen[strikeIdx].name} hits ${
                runs === 0 ? 'no run' : runs === 4 ? 'a BOUNDARY 4!' : runs === 6 ? 'a HUGE 6!' : `${runs} run`
              }.`;
            }

            // Calculate oversBowled
            const totalBalls = Math.floor(ld.oversBowled) * 6 + ld.ballsInOver;
            ld.oversBowled = Math.floor(totalBalls / 6) + (totalBalls % 6) / 10;
            ld.crr = ld.oversBowled > 0 ? ld.runs / (totalBalls / 6) : 0;

            // Check if over completed
            if (ld.ballsInOver === 6) {
              const completedOverNum = Math.floor(ld.oversBowled);

              // Settle "Next Over Runs" market
              const overMarket = ld.sessionMarkets.find(
                (x) => x.type === 'over_runs' && x.status === 'open',
              );
              if (overMarket) {
                const actualRuns = ld.runsInCurrentOver;
                const wonOver = actualRuns > overMarket.target;
                overMarket.status = 'settled';
                overMarket.result = wonOver ? 'over' : 'under';

                // Auto-settle bets placed on this session
                const matchBets = updatedBets.filter(
                  (b) =>
                    b.matchId === m.id &&
                    b.status === 'running' &&
                    b.marketType === 'Session Betting',
                );
                for (const b of matchBets) {
                  const selectionVal = b.selection.toLowerCase();
                  if (selectionVal.includes('over')) {
                    if (wonOver) {
                      autoSettle(
                        b.id,
                        'won',
                        b.stake * (b.odds - 1),
                        b.stake * b.odds,
                        `Won: Over runs ${actualRuns} > ${overMarket.target}`,
                      );
                    } else {
                      autoSettle(
                        b.id,
                        'lost',
                        -b.stake,
                        0,
                        `Lost: Over runs ${actualRuns} <= ${overMarket.target}`,
                      );
                    }
                  } else {
                    if (wonOver) {
                      autoSettle(
                        b.id,
                        'lost',
                        -b.stake,
                        0,
                        `Lost: Over runs ${actualRuns} > ${overMarket.target}`,
                      );
                    } else {
                      autoSettle(
                        b.id,
                        'won',
                        b.stake * (b.odds - 1),
                        b.stake * b.odds,
                        `Won: Over runs ${actualRuns} <= ${overMarket.target}`,
                      );
                    }
                  }
                }
              }

              // Reset over details
              ld.ballsInOver = 0;
              ld.runsInCurrentOver = 0;
              ld.runsCurrentOverList = [];

              // Rotate strike at end of over
              ld.currentBatsmenIds = [nonStrikeIdx, strikeIdx];

              // Update bowler's overs
              bowlers[bowlerIdx] = {
                ...bowlers[bowlerIdx],
                overs: (bowlers[bowlerIdx].overs ?? 0) + 1,
              };

              // Select next bowler (cycle)
              ld.currentBowlerId = (ld.currentBowlerId + 1) % bowlers.length;

              // Generate new session markets for upcoming over
              ld.sessionMarkets = ld.sessionMarkets.map((x) => {
                if (x.type === 'over_runs') {
                  return {
                    id: `${m.id}-sm-over-${completedOverNum + 1}`,
                    type: 'over_runs' as const,
                    title: 'Next Over Runs',
                    question: `Runs scored in Over ${completedOverNum + 1}`,
                    target: Math.random() > 0.5 ? 8.5 : 7.5,
                    oddsOver: 1.9,
                    oddsUnder: 1.9,
                    status: 'open' as const,
                  };
                }
                if (x.type === 'partnership' && x.status === 'settled') {
                  return {
                    id: `${m.id}-sm-partnership-${completedOverNum + 1}`,
                    type: 'partnership' as const,
                    title: 'Partnership Runs',
                    question: `Will current partnership cross ${ld.partnershipRuns + 25.5} runs?`,
                    target: Math.round(ld.partnershipRuns + 25.5) + 0.5,
                    oddsOver: 1.85,
                    oddsUnder: 1.85,
                    status: 'open' as const,
                  };
                }
                return x;
              });
            }

            // 3. Innings logic
            const formatLimit = m.format === 'T20' ? 20 : m.format === 'ODI' ? 50 : 90;

            if (ld.innings === 1) {
              m.score = {
                team1Score: `${ld.runs}/${ld.wickets}`,
                team2Score: '',
                overs: `${ld.oversBowled}`,
              };

              // Innings 1 completes
              if (ld.wickets === 10 || Math.floor(ld.oversBowled) >= formatLimit) {
                ld.innings = 2;
                ld.battingTeam = m.team2.shortName;
                ld.bowlingTeam = m.team1.shortName;
                ld.target = ld.runs + 1;
                ld.runs = 0;
                ld.wickets = 0;
                ld.oversBowled = 0.0;
                ld.ballsInOver = 0;
                ld.partnershipRuns = 0;
                ld.partnershipBalls = 0;
                ld.crr = 0;
                ld.rrr = (ld.target / formatLimit) * 6;
                ld.liveStatus = `Innings break! ${m.team2.shortName} needs ${ld.target} runs to win.`;

                // Reset batsmen scorecard for team 2
                ld.batsmen = ld.batsmen.map((b) => ({
                  ...b,
                  runs: 0,
                  balls: 0,
                  fours: 0,
                  sixes: 0,
                  isOut: false,
                  howOut: undefined,
                }));
                ld.bowlers = ld.bowlers.map((b) => ({
                  ...b,
                  overs: 0,
                  runsConceded: 0,
                  wickets: 0,
                }));
                ld.currentBatsmenIds = [0, 1];
                ld.currentBowlerId = 0;
              }
            } else {
              m.score = {
                team1Score: m.score?.team1Score,
                team2Score: `${ld.runs}/${ld.wickets}`,
                overs: `${ld.oversBowled}`,
              };

              const oversRemaining = formatLimit - Math.floor(ld.oversBowled) - ld.ballsInOver / 6;
              ld.rrr = oversRemaining > 0 ? (ld.target! - ld.runs) / oversRemaining : 0;
              ld.liveStatus = `${m.team2.shortName} needs ${ld.target! - ld.runs} runs in ${Math.round(
                oversRemaining * 6,
              )} balls.`;

              // Check if Team 2 (Chasing Team) wins
              if (ld.runs >= ld.target!) {
                m.status = 'finished';
                m.score = {
                  ...m.score,
                  result: `${m.team2.name} won by ${10 - ld.wickets} wickets`,
                };

                // Auto-settle Match Winner bets!
                const matchBets = updatedBets.filter(
                  (b) =>
                    b.matchId === m.id &&
                    b.status === 'running' &&
                    b.marketType === 'Match Winner',
                );
                for (const b of matchBets) {
                  if (b.selection === m.team2.name || b.selection === m.team2.shortName) {
                    autoSettle(
                      b.id,
                      'won',
                      b.stake * (b.odds - 1),
                      b.stake * b.odds,
                      `Auto-won: ${m.team2.shortName} won the match`,
                    );
                  } else {
                    autoSettle(b.id, 'lost', -b.stake, 0, `Auto-lost: ${m.team2.shortName} won the match`);
                  }
                }
              }
              // Check if Team 1 wins
              else if (ld.wickets === 10 || Math.floor(ld.oversBowled) >= formatLimit) {
                m.status = 'finished';
                if (ld.runs === ld.target! - 1) {
                  m.score = {
                    ...m.score,
                    result: 'Match tied',
                  };

                  const matchBets = updatedBets.filter(
                    (b) =>
                      b.matchId === m.id &&
                      b.status === 'running' &&
                      b.marketType === 'Match Winner',
                  );
                  for (const b of matchBets) {
                    autoSettle(b.id, 'void', 0, b.stake, 'Auto-void: Match tied');
                  }
                } else {
                  m.score = {
                    ...m.score,
                    result: `${m.team1.name} won by ${ld.target! - 1 - ld.runs} runs`,
                  };

                  // Auto-settle Match Winner bets!
                  const matchBets = updatedBets.filter(
                    (b) =>
                      b.matchId === m.id &&
                      b.status === 'running' &&
                      b.marketType === 'Match Winner',
                  );
                  for (const b of matchBets) {
                    if (b.selection === m.team1.name || b.selection === m.team1.shortName) {
                      autoSettle(
                        b.id,
                        'won',
                        b.stake * (b.odds - 1),
                        b.stake * b.odds,
                        `Auto-won: ${m.team1.shortName} won the match`,
                      );
                    } else {
                      autoSettle(b.id, 'lost', -b.stake, 0, `Auto-lost: ${m.team1.shortName} won the match`);
                    }
                  }
                }
              }
            }

            m.liveData = ld;
            return m;
          });

          return {
            ...(matchesChanged ? { matches: updatedMatches } : {}),
            ...(betsChanged ? { bets: updatedBets } : {}),
            ...(bankrollsChanged ? { bankrolls: updatedBankrolls } : {}),
            ...(historyChanged ? { bankrollHistory: updatedHistory } : {}),
          };
        }),
    }),
    {
      name: 'betkhaata-store',
      version: 1,
      migrate: (persisted: any) => {
        // zustand persist passes already-parsed data in most cases, but if storage got corrupted we still guard.
        try {
          const parsed = safeParseJSON<PersistedShape>(persisted) || (persisted as PersistedShape);
          return sanitizePersistedState(parsed);
        } catch {
          return sanitizePersistedState(null);
        }
      },
      // Always persist only data arrays (not UI state)
      partialize: (state) => ({
        bets: state.bets,
        matches: state.matches,
        bankrolls: state.bankrolls,
        transactions: state.transactions,
        bankrollHistory: state.bankrollHistory,
      }),
    },
  ),
);

// ── Selector Memoization Helper ───────────────────────────────────────
// Prevents returning new array/object references when the derived data
// hasn't actually changed. This is critical for Recharts which uses
// reference equality to detect data changes — new refs on every render
// cause infinite setState loops in ChartDataContextProvider.

function createDependencySelector<T, D>(
  selector: (state: BetStore) => T,
  getDependencies: (state: BetStore) => D,
  areDepsEqual: (a: D, b: D) => boolean,
): (state: BetStore) => T {
  let lastDeps: D | undefined;
  let lastResult: T | undefined;
  return (state: BetStore) => {
    const newDeps = getDependencies(state);
    if (lastResult !== undefined && lastDeps !== undefined && areDepsEqual(lastDeps, newDeps)) {
      return lastResult;
    }
    lastDeps = newDeps;
    lastResult = selector(state);
    return lastResult;
  };
}

// Helper to determine the team associated with a bet
function getTeamForBet(bet: Bet, matches: Match[]): string | null {
  const match = matches.find((m) => m.id === bet.matchId);
  const selectionLower = (bet.selection || '').toLowerCase();
  
  if (match) {
    const t1 = match.team1;
    const t2 = match.team2;
    if (
      selectionLower.includes(t1.name.toLowerCase()) || 
      selectionLower.includes(t1.shortName.toLowerCase())
    ) {
      return t1.shortName;
    }
    if (
      selectionLower.includes(t2.name.toLowerCase()) || 
      selectionLower.includes(t2.shortName.toLowerCase())
    ) {
      return t2.shortName;
    }
  }

  // player mappings to IPL/International team short names
  if (selectionLower.includes('kohli')) return match?.tournament.includes('IPL') ? 'RCB' : 'IND';
  if (selectionLower.includes('bumrah')) return match?.tournament.includes('IPL') ? 'MI' : 'IND';
  if (selectionLower.includes('dhoni')) return 'CSK';
  if (selectionLower.includes('rahul')) return match?.tournament.includes('IPL') ? 'PBKS' : 'IND';
  if (selectionLower.includes('rohit')) return match?.tournament.includes('IPL') ? 'MI' : 'IND';
  if (selectionLower.includes('cummins')) return match?.tournament.includes('IPL') ? 'SRH' : 'AUS';
  if (selectionLower.includes('gill')) return match?.tournament.includes('IPL') ? 'GT' : 'IND';
  if (selectionLower.includes('pant')) return match?.tournament.includes('IPL') ? 'DC' : 'IND';

  // Fallback to match title substrings
  const titleLower = (bet.matchTitle || '').toLowerCase();
  if (titleLower.includes('csk')) return 'CSK';
  if (titleLower.includes('mi')) return 'MI';
  if (titleLower.includes('rcb')) return 'RCB';
  if (titleLower.includes('kkr')) return 'KKR';
  if (titleLower.includes('ind')) return 'IND';
  if (titleLower.includes('pak')) return 'PAK';
  if (titleLower.includes('aus')) return 'AUS';
  if (titleLower.includes('pbks')) return 'PBKS';
  if (titleLower.includes('lsg')) return 'LSG';
  if (titleLower.includes('gt')) return 'GT';
  if (titleLower.includes('dc')) return 'DC';
  if (titleLower.includes('rr')) return 'RR';
  if (titleLower.includes('srh')) return 'SRH';
  if (titleLower.includes('eng')) return 'ENG';
  if (titleLower.includes('sa')) return 'SA';

  return null;
}

// Helper to extract player name from bet selection
function getPlayerFromSelection(selection: string, marketType: string): string | null {
  const lower = selection.toLowerCase();
  if (marketType === 'Top Batter' || marketType === 'Top Bowler') {
    return selection.trim();
  }
  
  const players = [
    'Virat Kohli',
    'Jasprit Bumrah',
    'MS Dhoni',
    'KL Rahul',
    'Rohit Sharma',
    'Pat Cummins',
    'Shubman Gill',
    'Rishabh Pant',
    'Hardik Pandya',
    'Suryakumar Yadav',
    'Travis Head',
    'Mitchell Starc',
    'Rashid Khan',
    'Heinrich Klaasen',
  ];
  for (const p of players) {
    if (lower.includes(p.toLowerCase())) {
      return p;
    }
  }
  
  const match = selection.match(/^(.+?)\s+(Over|Under|To\s|Run|Wicket|Score|3\+|2\+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  if (marketType === 'Player Runs' || marketType === 'Wickets') {
    return selection.replace(/Over|Under|Runs|Wickets|\d+(\.\d+)?/gi, '').trim();
  }
  
  return null;
}

// ── Selectors ─────────────────────────────────────────────────────────

export const selectTodayPnL = createDependencySelector(
  (state: BetStore) =>
    (state.bets || [])
      .filter((b) => b && b.status !== 'running' && b.status !== 'void' && isToday(b.timePlaced))
      .reduce((sum, b) => sum + (b?.profitLoss || 0), 0),
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectWeeklyPnL = createDependencySelector(
  (state: BetStore) =>
    (state.bets || [])
      .filter((b) => b && b.status !== 'running' && b.status !== 'void' && isThisWeek(b.timePlaced))
      .reduce((sum, b) => sum + (b?.profitLoss || 0), 0),
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectTotalExposure = createDependencySelector(
  (state: BetStore) =>
    (state.bets || [])
      .filter((b) => b && b.status === 'running')
      .reduce((sum, b) => sum + (b?.stake || 0), 0),
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectActiveBetsCount = createDependencySelector(
  (state: BetStore) =>
    (state.bets || []).filter((b) => b && b.status === 'running').length,
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectTotalBalance = createDependencySelector(
  (state: BetStore) =>
    (state.bankrolls || []).reduce((sum, b) => sum + (b?.balance || 0), 0),
  (state) => state.bankrolls,
  (a, b) => a === b,
);

export const selectWinRate = createDependencySelector(
  (state: BetStore) => {
    const settled = (state.bets || []).filter((b) => b && (b.status === 'won' || b.status === 'lost'));
    if (settled.length === 0) return 0;
    const won = settled.filter((b) => b && b.status === 'won').length;
    return Math.round((won / settled.length) * 100);
  },
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectFilteredBets = createDependencySelector(
  (state: BetStore) => {
    const safeBets = Array.isArray(state.bets) ? state.bets : [];
    let filtered = [...safeBets];

    const period = state.betFilters?.period ?? 'all';
    const status = state.betFilters?.status ?? 'all';
    const tournament = state.betFilters?.tournament ?? 'all';
    const searchVal = state.betFilters?.search ?? '';
    const sort = state.betFilters?.sort ?? 'newest';
    const format = state.betFilters?.format ?? 'all';
    const marketType = state.betFilters?.marketType ?? 'all';
    const dateRange = state.betFilters?.dateRange;

    // Period filter
    if (period === 'today') filtered = filtered.filter((b) => b && isToday(b.timePlaced));
    else if (period === 'week') filtered = filtered.filter((b) => b && isThisWeek(b.timePlaced));

    // Status filter
    if (status !== 'all') filtered = filtered.filter((b) => b && b.status === status);

    // Tournament filter
    if (tournament !== 'all') filtered = filtered.filter((b) => b && b.tournament === tournament);

    // Format filter (IPL, T20, ODI, Test)
    if (format !== 'all') {
      if (format === 'IPL') {
        filtered = filtered.filter((b) => b && b.tournament.toLowerCase().includes('ipl'));
      } else {
        filtered = filtered.filter((b) => b && b.format === format);
      }
    }

    // MarketType filter
    if (marketType !== 'all') filtered = filtered.filter((b) => b && b.marketType === marketType);

    // DateRange filter
    if (dateRange) {
      if (dateRange.start) {
        const startMs = dayjs(dateRange.start).startOf('day').valueOf();
        filtered = filtered.filter((b) => b && dayjs(b.timePlaced).valueOf() >= startMs);
      }
      if (dateRange.end) {
        const endMs = dayjs(dateRange.end).endOf('day').valueOf();
        filtered = filtered.filter((b) => b && dayjs(b.timePlaced).valueOf() <= endMs);
      }
    }

    // Search query engine (search by team, player, match, venue, selection)
    if (searchVal.trim()) {
      const q = searchVal.toLowerCase().trim();
      filtered = filtered.filter((b) => {
        if (!b) return false;
        const matchTitle = (b.matchTitle || '').toLowerCase();
        const selection = (b.selection || '').toLowerCase();
        const tournamentStr = (b.tournament || '').toLowerCase();
        const mType = (b.marketType || '').toLowerCase();
        
        const inBasic = matchTitle.includes(q) || selection.includes(q) || tournamentStr.includes(q) || mType.includes(q);
        if (inBasic) return true;
        
        const match = state.matches.find((m) => m.id === b.matchId);
        if (match) {
          return (
            match.team1.name.toLowerCase().includes(q) ||
            match.team1.shortName.toLowerCase().includes(q) ||
            match.team2.name.toLowerCase().includes(q) ||
            match.team2.shortName.toLowerCase().includes(q) ||
            (match.venue || '').toLowerCase().includes(q)
          );
        }
        return false;
      });
    }

    // Sorting
    switch (sort) {
      case 'newest':
        filtered.sort(
          (a, b) =>
            new Date(b?.timePlaced || 0).getTime() - new Date(a?.timePlaced || 0).getTime(),
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a?.timePlaced || 0).getTime() - new Date(b?.timePlaced || 0).getTime(),
        );
        break;
      case 'highest_stake':
        filtered.sort((a, b) => (b?.stake || 0) - (a?.stake || 0));
        break;
      case 'highest_profit':
        filtered.sort((a, b) => (b?.profitLoss || 0) - (a?.profitLoss || 0));
        break;
    }

    return filtered;
  },
  (state) => ({
    bets: state.bets,
    matches: state.matches,
    filters: state.betFilters,
  }),
  (a, b) =>
    a.bets === b.bets &&
    a.matches === b.matches &&
    a.filters.period === b.filters.period &&
    a.filters.status === b.filters.status &&
    a.filters.tournament === b.filters.tournament &&
    a.filters.search === b.filters.search &&
    a.filters.sort === b.filters.sort &&
    a.filters.format === b.filters.format &&
    a.filters.marketType === b.filters.marketType &&
    a.filters.dateRange?.start === b.filters.dateRange?.start &&
    a.filters.dateRange?.end === b.filters.dateRange?.end
);

export const selectRunningBets = createDependencySelector(
  (state: BetStore) =>
    (Array.isArray(state.bets) ? state.bets : []).filter((b) => b && b.status === 'running'),
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectMatchesByStatus = (status: MatchStatus) =>
  createDependencySelector(
    (state: BetStore) => (state.matches || []).filter((m) => m && m.status === status),
    (state) => state.matches,
    (a, b) => a === b,
  );

export const selectTournaments = createDependencySelector(
  (state: BetStore) => {
    const s = new Set((state.bets || []).filter((b) => b && b.tournament).map((b) => b.tournament));
    return Array.from(s);
  },
  (state) => state.bets,
  (a, b) => a === b,
);

// ── Analytics Selectors (Memoized) ────────────────────────────────────

export const selectAnalytics = createDependencySelector(
  (state: BetStore): AnalyticsSnapshot => {
    const safeBets = Array.isArray(state.bets) ? state.bets : [];
    const settled = safeBets.filter((b) => b && (b.status === 'won' || b.status === 'lost'));

    const totalBets = safeBets.length;
    const activeBets = safeBets.filter((b) => b && b.status === 'running').length;

    const totalSettled = settled.length;
    const won = settled.filter((b) => b && b.status === 'won').length;
    const lost = settled.filter((b) => b && b.status === 'lost').length;

    const winRate = totalSettled > 0 ? Math.round((won / totalSettled) * 100) : 0;
    const lossRate = totalSettled > 0 ? Math.round((lost / totalSettled) * 100) : 0;

    const totalPnL = settled.reduce((sum, b) => sum + (Number(b?.profitLoss) || 0), 0);

    const currentExposure = safeBets
      .filter((b) => b && b.status === 'running')
      .reduce((sum, b) => sum + (Number(b?.stake) || 0), 0);

    const {
      bestWin: bestWinStreak,
      worstLoss: worstLoseStreak,
      currentStreakType,
      currentStreakLength,
    } = computeStreaks(safeBets as any);

    const averageOdds =
      totalBets > 0
        ? safeBets.reduce((sum, b) => sum + (Number(b?.odds) || 0), 0) / totalBets
        : 0;

    const totalStaked = settled.reduce((sum, b) => sum + (Number(b?.stake) || 0), 0);
    const roiPercent = totalStaked > 0 ? (totalPnL / totalStaked) * 100 : 0;

    return {
      totalBets,
      winRate,
      lossRate,
      totalPnL,
      currentExposure,
      bestWinStreak,
      worstLoseStreak,
      currentStreakType,
      currentStreakLength,
      averageOdds,
      roiPercent,
      totalSettled,
      activeBets,
    };
  },
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectDailyPnLFromBets = createDependencySelector(
  (state: BetStore): DailyPnL[] => {
    const safeBets = Array.isArray(state.bets) ? state.bets : [];
    const settled = safeBets.filter((b) => b && (b.status === 'won' || b.status === 'lost'));

    const grouped: Record<string, { profit: number; loss: number }> = {};

    for (const bet of settled) {
      if (!bet || !bet.timePlaced) continue;
      const date = dayjs(bet.timePlaced).format('YYYY-MM-DD');
      if (!grouped[date]) grouped[date] = { profit: 0, loss: 0 };

      const profitLoss = Number(bet.profitLoss) || 0;
      if (profitLoss >= 0) grouped[date].profit += profitLoss;
      else grouped[date].loss += profitLoss;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([date, { profit, loss }]) => ({
        date,
        label: dayjs(date).format('DD MMM'),
        profit,
        loss,
        net: profit + loss,
      }));
  },
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectBankrollGrowthData = createDependencySelector(
  (state: BetStore): { date: string; balance: number }[] => {
    const safeHistory = Array.isArray(state.bankrollHistory) ? state.bankrollHistory : [];

    const entries = [...safeHistory]
      .filter((e) => e && e.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const bankrollLatest: Record<string, Record<string, number>> = {};

    for (const entry of entries) {
      if (!entry || typeof entry.bankrollId !== 'string') continue;

      const date = dayjs(entry.timestamp).format('YYYY-MM-DD');
      if (!bankrollLatest[date]) {
        const prevDates = Object.keys(bankrollLatest).sort();
        const prevDate = prevDates[prevDates.length - 1];
        bankrollLatest[date] = prevDate ? { ...bankrollLatest[prevDate] } : {};
      }

      const balance = Number(entry.balance) || 0;
      bankrollLatest[date][entry.bankrollId] = balance;
    }

    return Object.entries(bankrollLatest)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, balances]) => ({
        date,
        balance: Object.values(balances).reduce((sum, b) => sum + (b || 0), 0),
      }));
  },
  (state) => state.bankrollHistory,
  (a, b) => a === b,
);

export const selectWinLossPieData = createDependencySelector(
  (state: BetStore): { name: string; value: number }[] => {
    const won = (state.bets || []).filter((b) => b && b.status === 'won').length;
    const lost = (state.bets || []).filter((b) => b && b.status === 'lost').length;
    return [
      { name: 'Won', value: won },
      { name: 'Lost', value: lost },
    ];
  },
  (state) => state.bets,
  (a, b) => a === b,
);

// ── Dynamic Performance Tables Selectors ───────────────────────────────

export const selectTournamentPerformance = createDependencySelector(
  (state: BetStore): (TournamentPerformance & { roi: number })[] => {
    const settled = (state.bets || []).filter((b) => b && (b.status === 'won' || b.status === 'lost'));
    const grouped: Record<string, { total: number; won: number; lost: number; pnl: number; stake: number }> = {};
    
    for (const b of settled) {
      const t = b.tournament || 'Unknown';
      if (!grouped[t]) {
        grouped[t] = { total: 0, won: 0, lost: 0, pnl: 0, stake: 0 };
      }
      grouped[t].total++;
      if (b.status === 'won') grouped[t].won++;
      else if (b.status === 'lost') grouped[t].lost++;
      grouped[t].pnl += b.profitLoss;
      grouped[t].stake += b.stake;
    }
    
    return Object.entries(grouped).map(([tournament, s]) => ({
      tournament,
      totalBets: s.total,
      won: s.won,
      lost: s.lost,
      profitLoss: s.pnl,
      winRate: s.total > 0 ? Math.round((s.won / s.total) * 100) : 0,
      roi: s.stake > 0 ? (s.pnl / s.stake) * 100 : 0,
    })).sort((a, b) => b.profitLoss - a.profitLoss);
  },
  (state) => state.bets,
  (a, b) => a === b,
);

export const selectTeamPerformance = createDependencySelector(
  (state: BetStore): TeamPerformance[] => {
    const settled = (state.bets || []).filter((b) => b && (b.status === 'won' || b.status === 'lost'));
    const matches = state.matches || [];
    const grouped: Record<string, { total: number; won: number; lost: number; pnl: number }> = {};
    
    for (const b of settled) {
      const team = getTeamForBet(b, matches);
      if (!team) continue;
      if (!grouped[team]) {
        grouped[team] = { total: 0, won: 0, lost: 0, pnl: 0 };
      }
      grouped[team].total++;
      if (b.status === 'won') grouped[team].won++;
      else if (b.status === 'lost') grouped[team].lost++;
      grouped[team].pnl += b.profitLoss;
    }
    
    return Object.entries(grouped).map(([team, s]) => ({
      team,
      betsOn: s.total,
      profitLoss: s.pnl,
      winRate: s.total > 0 ? Math.round((s.won / s.total) * 100) : 0,
    })).sort((a, b) => b.profitLoss - a.profitLoss);
  },
  (state) => ({ bets: state.bets, matches: state.matches }),
  (a, b) => a.bets === b.bets && a.matches === b.matches,
);

export const selectPlayerPerformance = createDependencySelector(
  (state: BetStore): PlayerPerformance[] => {
    const settled = (state.bets || []).filter((b) => b && (b.status === 'won' || b.status === 'lost'));
    const grouped: Record<string, { total: number; won: number; lost: number; pnl: number; market: string }> = {};
    
    for (const b of settled) {
      const player = getPlayerFromSelection(b.selection, b.marketType);
      if (!player) continue;
      if (!grouped[player]) {
        grouped[player] = { total: 0, won: 0, lost: 0, pnl: 0, market: b.marketType };
      }
      grouped[player].total++;
      if (b.status === 'won') grouped[player].won++;
      else if (b.status === 'lost') grouped[player].lost++;
      grouped[player].pnl += b.profitLoss;
    }
    
    return Object.entries(grouped).map(([player, s]) => ({
      player,
      market: s.market,
      bets: s.total,
      profitLoss: s.pnl,
      winRate: s.total > 0 ? Math.round((s.won / s.total) * 100) : 0,
    })).sort((a, b) => b.profitLoss - a.profitLoss);
  },
  (state) => state.bets,
  (a, b) => a === b,
);

export interface MarketPerformance {
  marketType: string;
  totalBets: number;
  won: number;
  lost: number;
  profitLoss: number;
  winRate: number;
  roi: number;
}

export const selectMarketPerformance = createDependencySelector(
  (state: BetStore): MarketPerformance[] => {
    const settled = (state.bets || []).filter((b) => b && (b.status === 'won' || b.status === 'lost'));
    const grouped: Record<string, { total: number; won: number; lost: number; pnl: number; stake: number }> = {};
    
    for (const b of settled) {
      const m = b.marketType || 'Unknown';
      if (!grouped[m]) {
        grouped[m] = { total: 0, won: 0, lost: 0, pnl: 0, stake: 0 };
      }
      grouped[m].total++;
      if (b.status === 'won') grouped[m].won++;
      else if (b.status === 'lost') grouped[m].lost++;
      grouped[m].pnl += b.profitLoss;
      grouped[m].stake += b.stake;
    }
    
    return Object.entries(grouped).map(([marketType, s]) => ({
      marketType,
      totalBets: s.total,
      won: s.won,
      lost: s.lost,
      profitLoss: s.pnl,
      winRate: s.total > 0 ? Math.round((s.won / s.total) * 100) : 0,
      roi: s.stake > 0 ? (s.pnl / s.stake) * 100 : 0,
    })).sort((a, b) => b.profitLoss - a.profitLoss);
  },
  (state) => state.bets,
  (a, b) => a === b,
);

