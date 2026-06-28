import { useMemo } from 'react';
import clsx from 'clsx';
import { useBetStore } from '../../store/betStore';
import { MARKET_TYPES } from '../../types/types';
import type { BetStatus } from '../../types/types';

interface FilterOption {
  label: string;
  period?: 'all' | 'today' | 'week';
  status?: BetStatus | 'all';
}

const periodFilters: FilterOption[] = [
  { label: 'All Time', period: 'all' },
  { label: 'Today', period: 'today' },
  { label: 'This Week', period: 'week' },
];

const statusFilters: FilterOption[] = [
  { label: 'All Status', status: 'all' },
  { label: 'Pending', status: 'running' },
  { label: 'Won', status: 'won' },
  { label: 'Lost', status: 'lost' },
];

const formatFilters = [
  { label: 'All Formats', format: 'all' },
  { label: 'IPL', format: 'IPL' },
  { label: 'T20', format: 'T20' },
  { label: 'ODI', format: 'ODI' },
  { label: 'Test', format: 'Test' },
] as const;

export default function FilterChips() {
  const betFilters = useBetStore((s) => s.betFilters);
  const setBetFilters = useBetStore((s) => s.setBetFilters);
  const bets = useBetStore((s) => s.bets);
  
  const tournaments = useMemo(() => {
    const set = new Set(bets.map((b) => b.tournament).filter(Boolean));
    return Array.from(set);
  }, [bets]);

  const handleResetDates = () => {
    setBetFilters({ dateRange: { start: '', end: '' } });
  };

  return (
    <div className="space-y-3.5 mb-5 bg-surface/50 border border-white/[0.04] rounded-2xl p-4">
      {/* Date Range & Market Select Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Date Start */}
        <div className="space-y-1">
          <label className="text-[10px] text-dim font-bold uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            className="input-dark py-1.5 px-3 text-[11px] h-8"
            style={{ colorScheme: 'dark' }}
            value={betFilters.dateRange?.start || ''}
            onChange={(e) =>
              setBetFilters({
                dateRange: {
                  start: e.target.value,
                  end: betFilters.dateRange?.end || '',
                },
              })
            }
          />
        </div>

        {/* Date End */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-dim font-bold uppercase tracking-wider">End Date</label>
            {(betFilters.dateRange?.start || betFilters.dateRange?.end) && (
              <button
                onClick={handleResetDates}
                className="text-[9px] text-loss hover:text-loss-dim font-bold"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="date"
            className="input-dark py-1.5 px-3 text-[11px] h-8"
            style={{ colorScheme: 'dark' }}
            value={betFilters.dateRange?.end || ''}
            onChange={(e) =>
              setBetFilters({
                dateRange: {
                  start: betFilters.dateRange?.start || '',
                  end: e.target.value,
                },
              })
            }
          />
        </div>

        {/* Market Type Selector */}
        <div className="space-y-1">
          <label className="text-[10px] text-dim font-bold uppercase tracking-wider">Market Type</label>
          <div className="relative">
            <select
              className="select-dark py-1.5 px-3 text-[11px] h-8 pr-8"
              value={betFilters.marketType}
              onChange={(e) => setBetFilters({ marketType: e.target.value })}
            >
              <option value="all">All Markets</option>
              {MARKET_TYPES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-dim text-xs">
              ▼
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-white/[0.04]" />

      {/* Period & Status Chips */}
      <div className="space-y-2">
        <p className="text-[10px] text-dim font-bold uppercase tracking-wider">Time & Status</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {periodFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setBetFilters({ period: f.period })}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 tap-effect',
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
                'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 tap-effect',
                betFilters.status === f.status
                  ? 'bg-gold text-dark'
                  : 'bg-surface card-border text-muted hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Format Chips */}
      <div className="space-y-2">
        <p className="text-[10px] text-dim font-bold uppercase tracking-wider">Formats</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          {formatFilters.map((f) => (
            <button
              key={f.label}
              onClick={() => setBetFilters({ format: f.format })}
              className={clsx(
                'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 tap-effect',
                betFilters.format === f.format
                  ? 'bg-purple text-white'
                  : 'bg-surface card-border text-muted hover:text-white',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tournaments Row */}
      <div className="space-y-2">
        <p className="text-[10px] text-dim font-bold uppercase tracking-wider">Tournaments</p>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-0.5">
          <button
            onClick={() => setBetFilters({ tournament: 'all' })}
            className={clsx(
              'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 tap-effect',
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
                'px-3.5 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 tap-effect',
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
    </div>
  );
}
