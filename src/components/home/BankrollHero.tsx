import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { useBetStore, selectTotalBalance, selectTodayPnL } from '../../store/betStore';
import { formatCurrency, formatCurrencyWithSign } from '../../utils/utils';

export default function BankrollHero() {
  const totalBalance = useBetStore(selectTotalBalance);
  const todayPnL = useBetStore(selectTodayPnL);

  const isPositive = todayPnL >= 0;

  return (
    <div
      className="gradient-hero card-border rounded-2xl p-5 relative overflow-hidden animate-slide-up"
      style={{ opacity: 0 }}
    >
      {/* Decorative glow orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-profit/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-3 right-4 opacity-[0.06]">
        <Sparkles className="w-20 h-20 text-gold" />
      </div>

      <div className="relative z-10">
        <p className="text-muted text-xs font-medium tracking-wide uppercase mb-1">
          Total Bankroll
        </p>
        <h2 className="text-3xl font-bold tracking-tight mb-1.5">
          {formatCurrency(totalBalance)}
        </h2>

        <div className="flex items-center gap-1.5">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
              isPositive
                ? 'bg-profit/[0.12] text-profit'
                : 'bg-loss/[0.12] text-loss'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatCurrencyWithSign(todayPnL)}
          </div>
          <span className="text-dim text-xs">today</span>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
    </div>
  );
}
