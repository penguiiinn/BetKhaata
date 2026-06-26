import { useMemo } from 'react';
import clsx from 'clsx';
import { useBetStore } from '../../store/betStore';
import type { BetStatus } from '../../types/types';

interface FilterOption {
  label: string;
  period?: 'all' | 'today' | 'week';
  status?: BetStatus | 'all';
  tournament?: string;
}

const periodFilters: FilterOption[] = [
  { label: 'All Time', period: 'all' },
  { label: 'Today', period: 'today' },
  { label: 'This Week', period: 'week' },
];

const statusFilters: FilterOption[] = [
  { label: 'All', status: 'all' },
  { label: 'Running', status: 'running' },
  { label: 'Won', status: 'won' },
  { label: 'Lost', status: 'lost' },
];

export default function FilterChips() {
  const betFilters = useBetStore((s) => s.betFilters);
  const setBetFilters = useBetStore((s) => s.setBetFilters);
  const bets = useBetStore((s) => s.bets);
  const tournaments = useMemo(() => {
    const set = new Set(bets.map((b) => b.tournament));
    return Array.from(set);
  }, [bets]);

  return (
    <div className="space-y-2.5 mb-4">
      {/* Period filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
        {periodFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setBetFilters({ period: f.period })}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
              betFilters.period === f.period
                ? 'bg-gold text-dark'
                : 'bg-surface card-border text-muted hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px h-6 bg-white/[0.06] self-center shrink-0" />
        {statusFilters.map((f) => (
          <button
            key={f.label}
            onClick={() => setBetFilters({ status: f.status })}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
              betFilters.status === f.status
                ? 'bg-gold text-dark'
                : 'bg-surface card-border text-muted hover:text-white',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tournament filters */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
        <button
          onClick={() => setBetFilters({ tournament: 'all' })}
          className={clsx(
            'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            betFilters.tournament === 'all'
              ? 'bg-purple/[0.15] text-purple border border-purple/30'
              : 'bg-surface card-border text-muted hover:text-white',
          )}
        >
          All Tournaments
        </button>
        {tournaments.map((t) => (
          <button
            key={t}
            onClick={() => setBetFilters({ tournament: t })}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
              betFilters.tournament === t
                ? 'bg-purple/[0.15] text-purple border border-purple/30'
                : 'bg-surface card-border text-muted hover:text-white',
            )}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
