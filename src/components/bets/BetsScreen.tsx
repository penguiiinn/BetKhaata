import { ClipboardList, Search, Download, FileJson, ArrowUpDown, FileUp } from 'lucide-react';
import { useBetStore, selectWinRate, selectFilteredBets } from '../../store/betStore';
import { exportBetsCSV, exportBetsJSON } from '../../utils/utils';
import FilterChips from './FilterChips';
import BetCard from './BetCard';
import type { BetSortKey } from '../../types/types';

const sortOptions: { label: string; value: BetSortKey }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Oldest', value: 'oldest' },
  { label: 'Highest Stake', value: 'highest_stake' },
  { label: 'Highest Profit', value: 'highest_profit' },
];

export default function BetsScreen() {
  const bets = useBetStore((s) => s.bets);
  const betFilters = useBetStore((s) => s.betFilters);
  const setBetFilters = useBetStore((s) => s.setBetFilters);
  const winRate = useBetStore(selectWinRate);
  const filteredBets = useBetStore(selectFilteredBets);
  const openModal = useBetStore((s) => s.openModal);

  return (
    <div className="px-4 py-4 w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto">
      {/* Header with stats */}
      <div
        className="flex items-center justify-between mb-4 animate-slide-up"
        style={{ opacity: 1 }}
      >
        <div>
          <h2 className="text-lg font-bold">My Bets</h2>
          <p className="text-xs text-muted mt-0.5">
            {filteredBets.length} bet{filteredBets.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('importSlip')}
            className="w-9 h-9 rounded-xl bg-surface card-border flex items-center justify-center hover:bg-surface-light transition-colors tap-effect"
            title="Import Bet Slip"
          >
            <FileUp className="w-4 h-4 text-gold" />
          </button>
          <button
            onClick={() => exportBetsCSV(filteredBets)}
            className="w-9 h-9 rounded-xl bg-surface card-border flex items-center justify-center hover:bg-surface-light transition-colors tap-effect"
            title="Export as CSV"
          >
            <Download className="w-4 h-4 text-muted" />
          </button>
          <button
            onClick={() => exportBetsJSON(filteredBets)}
            className="w-9 h-9 rounded-xl bg-surface card-border flex items-center justify-center hover:bg-surface-light transition-colors tap-effect"
            title="Export as JSON"
          >
            <FileJson className="w-4 h-4 text-muted" />
          </button>
          <div className="bg-surface card-border rounded-xl px-3 py-2 text-center">
            <p className="text-[10px] text-dim uppercase">Win Rate</p>
            <p className="text-lg font-bold text-gold">{winRate}%</p>
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div
        className="mb-3 animate-slide-up stagger-1"
        style={{ opacity: 0 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dim" />
          <input
            type="text"
            className="input-dark w-full pl-9 pr-3 py-2.5 text-xs"
            placeholder="Search by match, team, selection..."
            value={betFilters.search}
            onChange={(e) => setBetFilters({ search: e.target.value })}
          />
        </div>
      </div>

      {/* Sort selector */}
      <div
        className="flex items-center gap-2 mb-3 animate-slide-up stagger-1"
        style={{ opacity: 0 }}
      >
        <ArrowUpDown className="w-3.5 h-3.5 text-dim shrink-0" />
        <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-0.5">
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setBetFilters({ sort: opt.value })}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                betFilters.sort === opt.value
                  ? 'bg-gold/[0.15] text-gold border border-gold/30'
                  : 'bg-surface card-border text-muted hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div
        className="animate-slide-up stagger-2"
        style={{ opacity: 0 }}
      >
        <FilterChips />
      </div>

      {/* Bet list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBets.length > 0 ? (
          filteredBets.map((bet, i) => (
            <div
              key={bet.id}
              className="animate-slide-up"
              style={{
                opacity: 0,
                animationDelay: `${0.05 * (i + 1) + 0.1}s`,
              }}
            >
              <BetCard bet={bet} />
            </div>
          ))
        ) : (
          <div className="text-center py-12 col-span-full bg-surface card-border rounded-2xl p-6 border-white/[0.04] max-w-sm mx-auto space-y-2.5 shadow-lg animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-1 border border-white/[0.06]">
              <ClipboardList className="w-5.5 h-5.5 text-muted" />
            </div>
            {!bets || bets.length === 0 ? (
              <div>
                <p className="text-white/90 text-sm font-bold">No Bets Recorded Yet</p>
                <p className="text-dim text-xs mt-1.5 leading-relaxed">Go to the Live Cricket page or Matches tab to pick your first match and log a bet!</p>
              </div>
            ) : (
              <div>
                <p className="text-white/90 text-sm font-bold">No Matching Bets</p>
                <p className="text-dim text-xs mt-1.5 leading-relaxed">No bets match your current search terms, status, or format filters. Adjust filters to broaden your search.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
