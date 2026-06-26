import { TrendingUp, TrendingDown } from 'lucide-react';
import { useBetStore, selectTodayPnL, selectWeeklyPnL } from '../../store/betStore';
import { formatCurrencyWithSign } from '../../utils/utils';

export default function PnLCards() {
  const todayPnL = useBetStore(selectTodayPnL);
  const weeklyPnL = useBetStore(selectWeeklyPnL);

  return (
    <div
      className="grid grid-cols-2 gap-3 animate-slide-up stagger-2"
      style={{ opacity: 0 }}
    >
      <PnLCard label="Today's P&L" value={todayPnL} />
      <PnLCard label="Weekly P&L" value={weeklyPnL} />
    </div>
  );
}

function PnLCard({ label, value }: { label: string; value: number }) {
  const isPositive = value >= 0;

  return (
    <div
      className={`bg-surface card-border rounded-xl p-4 transition-all duration-300 ${
        isPositive ? 'hover:glow-profit' : 'hover:glow-loss'
      }`}
    >
      <p className="text-muted text-[11px] font-medium tracking-wide uppercase mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-2">
        <span
          className={`text-xl font-bold ${
            isPositive ? 'text-profit' : 'text-loss'
          }`}
        >
          {formatCurrencyWithSign(value)}
        </span>
        {isPositive ? (
          <TrendingUp className="w-4 h-4 text-profit opacity-60" />
        ) : (
          <TrendingDown className="w-4 h-4 text-loss opacity-60" />
        )}
      </div>
    </div>
  );
}
