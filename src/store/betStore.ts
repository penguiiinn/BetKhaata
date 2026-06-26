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
}

interface Modals {
  addBet: boolean;
  deposit: boolean;
  withdraw: boolean;
  setLimit: boolean;
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
      betFilters: { period: 'all', status: 'all', tournament: 'all', search: '', sort: 'newest' },
      modals: { addBet: false, deposit: false, withdraw: false, setLimit: false },
      selectedMatchId: null,
      editBetId: null,

      // ── UI Actions ────────────────────────────────────────────────

      setActiveTab: (tab) => set({ activeTab: tab }),
      setMatchTab: (tab) => set({ matchTab: tab }),

      setBetFilters: (filters) => set((s) => ({ betFilters: { ...s.betFilters, ...filters } })),

      openModal: (modal) => set((s) => ({ modals: { ...s.modals, [modal]: true } })),
      closeModal: (modal) => set((s) => ({ modals: { ...s.modals, [modal]: false } })),
      closeAllModals: () =>
        set({
          modals: { addBet: false, deposit: false, withdraw: false, setLimit: false },
        }),

      setSelectedMatchId: (id) => set({ selectedMatchId: id }),
      setEditBetId: (id) => set({ editBetId: id }),

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

function createMemoSelector<T>(
  selector: (state: BetStore) => T,
  isEqual: (a: T, b: T) => boolean = (a, b) => JSON.stringify(a) === JSON.stringify(b),
): (state: BetStore) => T {
  let lastResult: T | undefined;
  return (state: BetStore) => {
    const newResult = selector(state);
    if (lastResult !== undefined && isEqual(lastResult, newResult)) {
      return lastResult;
    }
    lastResult = newResult;
    return newResult;
  };
}

// ── Selectors ─────────────────────────────────────────────────────────

export const selectTodayPnL = (state: BetStore) =>
  (state.bets || [])
    .filter((b) => b && b.status !== 'running' && b.status !== 'void' && isToday(b.timePlaced))
    .reduce((sum, b) => sum + (b?.profitLoss || 0), 0);

export const selectWeeklyPnL = (state: BetStore) =>
  (state.bets || [])
    .filter((b) => b && b.status !== 'running' && b.status !== 'void' && isThisWeek(b.timePlaced))
    .reduce((sum, b) => sum + (b?.profitLoss || 0), 0);

export const selectTotalExposure = (state: BetStore) =>
  (state.bets || [])
    .filter((b) => b && b.status === 'running')
    .reduce((sum, b) => sum + (b?.stake || 0), 0);

export const selectActiveBetsCount = (state: BetStore) =>
  (state.bets || []).filter((b) => b && b.status === 'running').length;

export const selectTotalBalance = (state: BetStore) =>
  (state.bankrolls || []).reduce((sum, b) => sum + (b?.balance || 0), 0);

export const selectWinRate = (state: BetStore) => {
  const settled = (state.bets || []).filter((b) => b && (b.status === 'won' || b.status === 'lost'));
  if (settled.length === 0) return 0;
  const won = settled.filter((b) => b && b.status === 'won').length;
  return Math.round((won / settled.length) * 100);
};

export const selectFilteredBets = createMemoSelector((state: BetStore) => {
  const safeBets = Array.isArray(state.bets) ? state.bets : [];
  let filtered = [...safeBets];

  const period = state.betFilters?.period ?? 'all';
  const status = state.betFilters?.status ?? 'all';
  const tournament = state.betFilters?.tournament ?? 'all';
  const searchVal = state.betFilters?.search ?? '';
  const sort = state.betFilters?.sort ?? 'newest';

  if (period === 'today') filtered = filtered.filter((b) => b && isToday(b.timePlaced));
  else if (period === 'week') filtered = filtered.filter((b) => b && isThisWeek(b.timePlaced));

  if (status !== 'all') filtered = filtered.filter((b) => b && b.status === status);
  if (tournament !== 'all') filtered = filtered.filter((b) => b && b.tournament === tournament);

  if (searchVal.trim()) {
    const q = searchVal.toLowerCase().trim();
    filtered = filtered.filter(
      (b) =>
        b &&
        ((b.matchTitle || '').toLowerCase().includes(q) ||
          (b.selection || '').toLowerCase().includes(q) ||
          (b.tournament || '').toLowerCase().includes(q) ||
          (b.marketType || '').toLowerCase().includes(q)),
    );
  }

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
});

export const selectRunningBets = (state: BetStore) =>
  (Array.isArray(state.bets) ? state.bets : []).filter((b) => b && b.status === 'running');

export const selectMatchesByStatus = (status: MatchStatus) => (state: BetStore) =>
  (state.matches || []).filter((m) => m && m.status === status);

export const selectTournaments = (state: BetStore) => {
  const s = new Set((state.bets || []).filter((b) => b && b.tournament).map((b) => b.tournament));
  return Array.from(s);
};

// ── Analytics Selectors (Memoized) ────────────────────────────────────

export const selectAnalytics = createMemoSelector((state: BetStore): AnalyticsSnapshot => {
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

  const { bestWin: bestWinStreak, worstLoss: worstLoseStreak } = computeStreaks(safeBets as any);

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
    averageOdds,
    roiPercent,
    totalSettled,
    activeBets,
  };
});

export const selectDailyPnLFromBets = createMemoSelector((state: BetStore): DailyPnL[] => {
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
});

export const selectBankrollGrowthData = createMemoSelector((
  state: BetStore,
): { date: string; balance: number }[] => {
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
});

export const selectWinLossPieData = createMemoSelector((state: BetStore): { name: string; value: number }[] => {
  const won = (state.bets || []).filter((b) => b && b.status === 'won').length;
  const lost = (state.bets || []).filter((b) => b && b.status === 'lost').length;
  return [
    { name: 'Won', value: won },
    { name: 'Lost', value: lost },
  ];
});

