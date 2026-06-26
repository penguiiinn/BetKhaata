import { useMemo } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import { useBetStore } from '../../store/betStore';
import { formatCurrency, formatOdds, getRelativeTime, calculatePotentialProfit } from '../../utils/utils';
import StatusBadge from '../shared/StatusBadge';

export default function RunningBets() {
  const bets = useBetStore((s) => s.bets);
  const runningBets = useMemo(
    () => bets.filter((b) => b.status === 'running'),
    [bets],
  );
  const settleBet = useBetStore((s) => s.settleBet);
  const setActiveTab = useBetStore((s) => s.setActiveTab);

  if (runningBets.length === 0) return null;

  return (
    <div
      className="animate-slide-up stagger-5"
      style={{ opacity: 0 }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">Running Bets</h3>
          <span className="bg-gold/[0.12] text-gold text-[10px] font-bold px-2 py-0.5 rounded-full">
            {runningBets.length}
          </span>
        </div>
        <button
          onClick={() => setActiveTab('bets')}
          className="flex items-center gap-0.5 text-gold text-xs font-medium hover:opacity-80 transition-opacity"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Bet cards */}
      <div className="space-y-2.5">
        {runningBets.slice(0, 4).map((bet) => (
          <div
            key={bet.id}
            className="bg-surface card-border rounded-xl p-3.5 hover:bg-surface-light transition-all duration-200 card-border-hover"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">
                    {bet.matchTitle}
                  </p>
                  <StatusBadge status={bet.status} />
                </div>
                <p className="text-xs text-muted truncate">{bet.selection}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[10px] text-dim uppercase">Stake</p>
                  <p className="text-xs font-semibold">
                    {formatCurrency(bet.stake)}
                  </p>
                </div>
                <div className="w-px h-6 bg-white/[0.06]" />
                <div>
                  <p className="text-[10px] text-dim uppercase">Odds</p>
                  <p className="text-xs font-semibold">{formatOdds(bet.odds)}</p>
                </div>
                <div className="w-px h-6 bg-white/[0.06]" />
                <div>
                  <p className="text-[10px] text-dim uppercase">Returns</p>
                  <p className="text-xs font-semibold text-profit">
                    {formatCurrency(calculatePotentialProfit(bet.stake, bet.odds))}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-dim">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">
                  {getRelativeTime(bet.timePlaced)}
                </span>
              </div>
            </div>

            {/* Quick Settle */}
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.04]">
              <span className="text-[9px] text-muted uppercase font-bold mr-auto">Settle:</span>
              <button
                onClick={() => settleBet(bet.id, 'won')}
                className="px-2.5 py-1 rounded bg-profit/[0.12] text-profit hover:bg-profit/[0.2] transition-colors text-[9px] font-bold tap-effect cursor-pointer"
              >
                Won
              </button>
              <button
                onClick={() => settleBet(bet.id, 'lost')}
                className="px-2.5 py-1 rounded bg-loss/[0.12] text-loss hover:bg-loss/[0.2] transition-colors text-[9px] font-bold tap-effect cursor-pointer"
              >
                Lost
              </button>
              <button
                onClick={() => settleBet(bet.id, 'void')}
                className="px-2.5 py-1 rounded bg-white/[0.06] text-muted hover:bg-white/[0.12] transition-colors text-[9px] font-bold tap-effect cursor-pointer"
              >
                Void
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
