import { Clock, Pencil, Trash2 } from 'lucide-react';
import type { Bet } from '../../types/types';
import {
  formatCurrency,
  formatCurrencyWithSign,
  formatOdds,
  formatDateTime,
  getFormatColor,
} from '../../utils/utils';
import StatusBadge from '../shared/StatusBadge';
import { useBetStore } from '../../store/betStore';

interface BetCardProps {
  bet: Bet;
}

export default function BetCard({ bet }: BetCardProps) {
  const settleBet = useBetStore((s) => s.settleBet);
  const deleteBet = useBetStore((s) => s.deleteBet);
  const setEditBetId = useBetStore((s) => s.setEditBetId);
  const formatColor = getFormatColor(bet.format);

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this bet?')) {
      deleteBet(bet.id);
    }
  };

  // Highlight big wins/losses
  const isBigWin = bet.status === 'won' && bet.profitLoss >= 5000;
  const isBigLoss = bet.status === 'lost' && bet.profitLoss <= -5000;
  const highlightStyle = isBigWin
    ? 'ring-1 ring-profit/40 shadow-[0_0_16px_rgba(0,200,150,0.15)]'
    : isBigLoss
      ? 'ring-1 ring-loss/40 shadow-[0_0_16px_rgba(255,92,114,0.15)]'
      : '';

  return (
    <div className={`bg-surface card-border rounded-xl overflow-hidden hover:bg-surface-light transition-all duration-200 card-border-hover ${highlightStyle}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{bet.matchTitle}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
            style={{
              color: formatColor,
              backgroundColor: `${formatColor}18`,
            }}
          >
            {bet.format}
          </span>
        </div>
        <StatusBadge status={bet.status} />
      </div>

      {/* Body */}
      <div className="p-3.5">
        {/* Market & Selection */}
        <div className="mb-3">
          <p className="text-[10px] text-dim uppercase tracking-wider font-medium mb-0.5">
            {bet.marketType}
          </p>
          <p className="text-sm font-semibold">{bet.selection}</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-0">
          <div className="flex-1">
            <p className="text-[10px] text-dim uppercase">Stake</p>
            <p className="text-xs font-semibold">{formatCurrency(bet.stake)}</p>
          </div>
          <div className="w-px h-7 bg-white/[0.06]" />
          <div className="flex-1 pl-3">
            <p className="text-[10px] text-dim uppercase">Odds</p>
            <p className="text-xs font-semibold">{formatOdds(bet.odds)}</p>
          </div>
          <div className="w-px h-7 bg-white/[0.06]" />
          <div className="flex-1 pl-3">
            <p className="text-[10px] text-dim uppercase">P&L</p>
            {bet.status === 'running' ? (
              <p className="text-xs font-semibold text-muted">—</p>
            ) : (
              <p
                className={`text-xs font-bold ${
                  bet.profitLoss >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {formatCurrencyWithSign(bet.profitLoss)}
              </p>
            )}
          </div>
        </div>

        {/* Settle Bet Actions */}
        {bet.status === 'running' && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/[0.04]">
            <span className="text-[10px] text-muted uppercase font-bold mr-auto">Settle:</span>
            <button
              onClick={() => settleBet(bet.id, 'won')}
              className="px-2.5 py-1 rounded bg-profit/[0.12] text-profit hover:bg-profit/[0.2] transition-colors text-[10px] font-bold tap-effect cursor-pointer"
            >
              Won
            </button>
            <button
              onClick={() => settleBet(bet.id, 'lost')}
              className="px-2.5 py-1 rounded bg-loss/[0.12] text-loss hover:bg-loss/[0.2] transition-colors text-[10px] font-bold tap-effect cursor-pointer"
            >
              Lost
            </button>
            <button
              onClick={() => settleBet(bet.id, 'void')}
              className="px-2.5 py-1 rounded bg-white/[0.06] text-muted hover:bg-white/[0.12] transition-colors text-[10px] font-bold tap-effect cursor-pointer"
            >
              Void
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
          <span className="text-[10px] text-dim">{bet.tournament}</span>
          <div className="flex items-center gap-1 text-dim">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">{formatDateTime(bet.timePlaced)}</span>
          </div>
        </div>

        {/* Edit & Delete Actions */}
        <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-white/[0.04]">
          {bet.status === 'running' && (
            <button
              onClick={() => setEditBetId(bet.id)}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-gold/[0.12] text-gold hover:bg-gold/[0.2] transition-colors text-[10px] font-bold tap-effect cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          )}
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-loss/[0.08] text-loss/80 hover:bg-loss/[0.15] hover:text-loss transition-colors text-[10px] font-bold tap-effect cursor-pointer ml-auto"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
