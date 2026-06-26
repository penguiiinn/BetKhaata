import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useBetStore, selectWinRate } from '../../store/betStore';

export default function WinRateChart() {
  const winRate = useBetStore(selectWinRate) || 0;
  const lossRate = 100 - winRate;

  const bets = useBetStore((s) => s.bets || []);
  const totalSettled = (bets || []).filter(
    (b) => b && (b.status === 'won' || b.status === 'lost'),
  ).length;
  const totalWon = (bets || []).filter((b) => b && b.status === 'won').length;
  const totalLost = (bets || []).filter((b) => b && b.status === 'lost').length;

  const hasBets = totalSettled > 0;
  const data = hasBets
    ? [
        { name: 'Won', value: winRate },
        { name: 'Lost', value: lossRate },
      ]
    : [{ name: 'No Bets', value: 1 }];

  const COLORS = hasBets ? ['#00C896', '#FF5C72'] : ['#2A2D38'];

  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-4">Win Rate</h3>

      <div className="flex items-center gap-4">
        {/* Donut chart */}
        <div className="relative w-28 h-28 shrink-0">
          <ResponsiveContainer width="100%" height={112}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={3}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-white">
              {hasBets ? `${winRate}%` : '—'}
            </span>
            <span className="text-[9px] text-dim">WIN RATE</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-profit" />
              <span className="text-xs text-muted">Won</span>
            </div>
            <span className="text-xs font-semibold text-profit">{totalWon}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-loss" />
              <span className="text-xs text-muted">Lost</span>
            </div>
            <span className="text-xs font-semibold text-loss">{totalLost}</span>
          </div>
          <div className="border-t border-white/[0.06] pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted">Total Settled</span>
              <span className="text-xs font-semibold">{totalSettled}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
