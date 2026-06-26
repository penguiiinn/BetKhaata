import type { Bankroll } from '../../types/types';
import { formatCurrency } from '../../utils/utils';

interface BankrollDetailCardProps {
  bankroll: Bankroll;
}

export default function BankrollDetailCard({ bankroll }: BankrollDetailCardProps) {
  const dailyPercent = bankroll.limits.daily > 0
    ? Math.min((bankroll.limits.dailyUsed / bankroll.limits.daily) * 100, 100)
    : 0;
  const weeklyPercent = bankroll.limits.weekly > 0
    ? Math.min((bankroll.limits.weeklyUsed / bankroll.limits.weekly) * 100, 100)
    : 0;
  const monthlyPercent = bankroll.limits.monthly > 0
    ? Math.min((bankroll.limits.monthlyUsed / bankroll.limits.monthly) * 100, 100)
    : 0;

  const getLimitColor = (percent: number) => {
    if (percent < 50) return '#00C896';
    if (percent < 80) return '#F5A623';
    return '#FF5C72';
  };

  return (
    <div className="bg-surface card-border rounded-xl overflow-hidden">
      {/* Header with colored accent */}
      <div
        className="h-1"
        style={{ background: bankroll.color }}
      />

      <div className="p-4">
        {/* Name & Balance */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: bankroll.color }}
              />
              <h3 className="text-sm font-semibold">{bankroll.name}</h3>
            </div>
            <p className="text-xl font-bold mt-1">{formatCurrency(bankroll.balance)}</p>
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-right"
            style={{ backgroundColor: `${bankroll.color}12` }}
          >
            <p className="text-[9px] text-dim uppercase">Exposure</p>
            <p className="text-xs font-bold" style={{ color: bankroll.color }}>
              {formatCurrency(bankroll.activeExposure)}
            </p>
          </div>
        </div>

        {/* Deposits & Withdrawals */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div className="bg-dark/50 rounded-lg px-3 py-2">
            <p className="text-[9px] text-dim uppercase">Deposited</p>
            <p className="text-xs font-semibold text-profit">
              {formatCurrency(bankroll.totalDeposits)}
            </p>
          </div>
          <div className="bg-dark/50 rounded-lg px-3 py-2">
            <p className="text-[9px] text-dim uppercase">Withdrawn</p>
            <p className="text-xs font-semibold text-muted">
              {formatCurrency(bankroll.totalWithdrawals)}
            </p>
          </div>
        </div>

        {/* Limits */}
        <div className="space-y-2.5">
          <p className="text-[10px] text-dim uppercase tracking-wider font-medium">
            Betting Limits
          </p>

          <LimitBar
            label="Daily"
            used={bankroll.limits.dailyUsed}
            limit={bankroll.limits.daily}
            percent={dailyPercent}
            color={getLimitColor(dailyPercent)}
          />
          <LimitBar
            label="Weekly"
            used={bankroll.limits.weeklyUsed}
            limit={bankroll.limits.weekly}
            percent={weeklyPercent}
            color={getLimitColor(weeklyPercent)}
          />
          <LimitBar
            label="Monthly"
            used={bankroll.limits.monthlyUsed}
            limit={bankroll.limits.monthly}
            percent={monthlyPercent}
            color={getLimitColor(monthlyPercent)}
          />
        </div>
      </div>
    </div>
  );
}

function LimitBar({
  label,
  used,
  limit,
  percent,
  color,
}: {
  label: string;
  used: number;
  limit: number;
  percent: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] text-muted">{label}</span>
        <span className="text-[10px] text-dim">
          {formatCurrency(used, true)} / {formatCurrency(limit, true)}
        </span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-bar-fill"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}
