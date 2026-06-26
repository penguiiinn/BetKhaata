import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { useBetStore, selectDailyPnLFromBets } from '../../store/betStore';

export default function DailyPnLChart() {
  const bets = useBetStore((s) => s.bets);
  const dailyPnLData = useMemo(() => selectDailyPnLFromBets({ bets } as any) || [], [bets]);


  if (dailyPnLData.length === 0) {
    return (
      <div className="bg-surface card-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1">Daily P&L</h3>
        <p className="text-[10px] text-dim mb-4">Last 14 days</p>
        <div className="h-48 flex items-center justify-center">
          <p className="text-xs text-muted">No settled bets yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-1">Daily P&L</h3>
      <p className="text-[10px] text-dim mb-4">Last 14 days</p>

      <div className="h-48">
        <ResponsiveContainer width="100%" height={192}>
          <BarChart
            data={dailyPnLData}
            margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A4E5A', fontSize: 9 }}
              interval={1}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A4E5A', fontSize: 9 }}
              tickFormatter={(v) =>
                v >= 1000
                  ? `${(v / 1000).toFixed(0)}K`
                  : v <= -1000
                    ? `${(v / 1000).toFixed(0)}K`
                    : `${v}`
              }
            />
            <Tooltip
              contentStyle={{
                background: '#1E222D',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              cursor={{ fill: 'rgba(255,255,255,0.03)' }}
              formatter={(value: any) => {
                const numericValue = typeof value === 'number' ? value : Number(value) || 0;
                return [
                  `₹${Math.abs(numericValue).toLocaleString('en-IN')}`,
                  numericValue >= 0 ? 'Profit' : 'Loss',
                ];
              }}
              labelStyle={{ color: '#8B8FA3', fontSize: '11px' }}
            />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)" />
            <Bar dataKey="net" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {dailyPnLData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.net >= 0 ? '#00C896' : '#FF5C72'}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
