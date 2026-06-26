import { useMemo, useState } from 'react';
import { AlertTriangle, TrendingUp, TrendingDown, Target, Eye, Flame, BarChart3, Download, Activity, Percent, CheckCircle2, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import WinRateChart from './WinRateChart';
import DailyPnLChart from './DailyPnLChart';
import PerformanceBreakdown from './PerformanceBreakdown';
import { hourlyBettingData, lossChaseWarning, dailyPnLData } from '../../data/mockData';
import { useBetStore, selectAnalytics, selectBankrollGrowthData, selectDailyPnLFromBets } from '../../store/betStore';
import { formatCurrency, formatCurrencyWithSign, exportBankrollHistoryCSV } from '../../utils/utils';
import dayjs from 'dayjs';

export default function InsightsScreen() {
  const analytics = useBetStore(selectAnalytics);

  return (
    <div className="px-4 py-4 w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {/* Title */}
      <div
        className="col-span-full animate-slide-up"
        style={{ opacity: 0 }}
      >
        <h2 className="text-lg font-bold">Insights</h2>
        <p className="text-xs text-muted mt-0.5">Your betting analytics & patterns</p>
      </div>

      {/* Analytics Dashboard */}
      <div
        className="col-span-full animate-slide-up stagger-1"
        style={{ opacity: 0 }}
      >
        <AnalyticsDashboard analytics={analytics} />
      </div>

      {/* Win Rate */}
      <div
        className="min-w-0 animate-slide-up stagger-2"
        style={{ opacity: 0 }}
      >
        <WinRateChart />
      </div>

      {/* Daily P&L */}
      <div
        className="min-w-0 animate-slide-up stagger-3"
        style={{ opacity: 0 }}
      >
        <DailyPnLChart />
      </div>

      {/* Bankroll Growth Chart */}
      <div
        className="min-w-0 animate-slide-up stagger-4 md:col-span-2 lg:col-span-1"
        style={{ opacity: 0 }}
      >
        <BankrollGrowthChart />
      </div>

      {/* Daily Heatmap */}
      <div
        className="animate-slide-up stagger-5"
        style={{ opacity: 0 }}
      >
        <DailyHeatmap />
      </div>

      {/* Hourly Activity */}
      <div
        className="min-w-0 animate-slide-up stagger-6"
        style={{ opacity: 0 }}
      >
        <HourlyChart />
      </div>

      {/* Loss Chasing Warning */}
      {lossChaseWarning.detected && (
        <div
          className="animate-slide-up stagger-7 md:col-span-2 lg:col-span-1"
          style={{ opacity: 0 }}
        >
          <LossChasingAlert />
        </div>
      )}

      {/* Performance Breakdown */}
      <div
        className="animate-slide-up stagger-8 md:col-span-2 lg:col-span-3"
        style={{ opacity: 0 }}
      >
        <PerformanceBreakdown />
      </div>
    </div>
  );
}

// ── Analytics Dashboard ───────────────────────────────────────────────

function AnalyticsDashboard({ analytics }: { analytics: ReturnType<typeof selectAnalytics> }) {
  const bankrollHistory = useBetStore((s) => s.bankrollHistory);

  const stats = [
    {
      label: 'Total Bets',
      value: analytics.totalBets.toString(),
      icon: BarChart3,
      color: '#6C5CE7',
    },
    {
      label: 'Win Rate',
      value: `${analytics.winRate}%`,
      icon: TrendingUp,
      color: '#00C896',
    },
    {
      label: 'Loss Rate',
      value: `${analytics.lossRate}%`,
      icon: TrendingDown,
      color: '#FF5C72',
    },
    {
      label: 'Total P&L',
      value: formatCurrencyWithSign(analytics.totalPnL),
      icon: Target,
      color: analytics.totalPnL >= 0 ? '#00C896' : '#FF5C72',
    },
    {
      label: 'Exposure',
      value: formatCurrency(analytics.currentExposure, true),
      icon: Eye,
      color: '#F5A623',
    },
    {
      label: 'Best Streak',
      value: `${analytics.bestWinStreak}W`,
      icon: Flame,
      color: '#00C896',
    },
    {
      label: 'Worst Streak',
      value: `${analytics.worstLoseStreak}L`,
      icon: Flame,
      color: '#FF5C72',
    },
    {
      label: 'Avg Odds',
      value: analytics.averageOdds > 0 ? analytics.averageOdds.toFixed(2) : '—',
      icon: Activity,
      color: '#6C5CE7',
    },
    {
      label: 'ROI',
      value: `${analytics.roiPercent >= 0 ? '+' : ''}${analytics.roiPercent.toFixed(1)}%`,
      icon: Percent,
      color: analytics.roiPercent >= 0 ? '#00C896' : '#FF5C72',
    },
    {
      label: 'Settled',
      value: analytics.totalSettled.toString(),
      icon: CheckCircle2,
      color: '#8B8FA3',
    },
    {
      label: 'Active',
      value: analytics.activeBets.toString(),
      icon: Zap,
      color: '#F5A623',
    },
  ];

  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Analytics Overview</h3>
        <button
          onClick={() => exportBankrollHistoryCSV(bankrollHistory)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.06] text-muted hover:text-white hover:bg-white/[0.1] transition-colors text-[10px] font-medium"
          title="Export Bankroll History"
        >
          <Download className="w-3 h-3" />
          Export
        </button>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-2 md:gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="text-center p-2 rounded-lg bg-dark/50"
            >
              <div className="flex justify-center mb-1">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <Icon className="w-3 h-3" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-[9px] text-dim uppercase tracking-wider mb-0.5">
                {stat.label}
              </p>
              <p
                className="text-xs font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Bankroll Growth Chart ─────────────────────────────────────────────

type GrowthRange = '7d' | '30d' | '90d' | 'all';

function BankrollGrowthChart() {
  const allGrowthData = useBetStore(selectBankrollGrowthData);
  const [range, setRange] = useState<GrowthRange>('all');

  const growthData = useMemo(() => {
    const data = allGrowthData || [];
    if (range === 'all' || data.length === 0) return data;

    const now = dayjs();
    const daysMap: Record<GrowthRange, number> = { '7d': 7, '30d': 30, '90d': 90, all: 999999 };
    const cutoff = now.subtract(daysMap[range], 'day');

    return data.filter((d) => {
      const parsed = dayjs(d.date);
      return parsed.isAfter(cutoff);
    });
  }, [allGrowthData, range]);

  const rangeOptions: { label: string; value: GrowthRange }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
  ];

  if ((allGrowthData || []).length === 0) {
    return (
      <div className="bg-surface card-border rounded-xl p-4">
        <h3 className="text-sm font-semibold mb-1">Bankroll Growth</h3>
        <p className="text-[10px] text-dim mb-4">Total balance over time</p>
        <div className="h-44 flex items-center justify-center">
          <p className="text-xs text-muted">No history data yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold">Bankroll Growth</h3>
        <div className="flex gap-1">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all duration-200 ${
                range === opt.value
                  ? 'bg-profit/[0.15] text-profit border border-profit/30'
                  : 'bg-white/[0.04] text-dim hover:text-muted'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-[10px] text-dim mb-4">Total balance over time</p>

      <div className="h-44">
        <ResponsiveContainer width="100%" height={176}>
          <AreaChart
              data={growthData}
              margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="bankrollGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00C896" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A4E5A', fontSize: 9 }}
              tickFormatter={(v) => dayjs(v).format('DD MMM')}
              interval={Math.max(0, Math.floor(growthData.length / 6))}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A4E5A', fontSize: 9 }}
              tickFormatter={(v) =>
                v >= 100000
                  ? `${(v / 100000).toFixed(0)}L`
                  : v >= 1000
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
              formatter={(value: any) => [
                `₹${(typeof value === 'number' ? value : Number(value) || 0).toLocaleString('en-IN')}`,
                'Balance',
              ]}
              labelFormatter={(label) => dayjs(label).format('DD MMM YYYY')}
              labelStyle={{ color: '#8B8FA3', fontSize: '11px' }}
            />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#00C896"
              strokeWidth={2}
              fill="url(#bankrollGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Daily Heatmap ─────────────────────────────────────────────────────

function DailyHeatmap() {
  const computedDailyPnL = useBetStore(selectDailyPnLFromBets);
  const heatmapData = (computedDailyPnL || []).length > 0 ? computedDailyPnL : dailyPnLData;

  const getIntensity = (net: number) => {
    const abs = Math.abs(net);
    if (abs === 0) return 'bg-white/[0.03]';
    if (net > 0) {
      if (abs > 4000) return 'bg-profit/40';
      if (abs > 2000) return 'bg-profit/25';
      return 'bg-profit/12';
    } else {
      if (abs > 4000) return 'bg-loss/40';
      if (abs > 2000) return 'bg-loss/25';
      return 'bg-loss/12';
    }
  };

  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-1">Daily Activity</h3>
      <p className="text-[10px] text-dim mb-3">Betting heatmap – last 14 days</p>

      <div className="grid grid-cols-7 gap-1.5">
        {heatmapData.map((day) => (
          <div key={day.date} className="text-center">
            <div
              className={`w-full aspect-square rounded-lg ${getIntensity(day.net)} transition-colors`}
              title={`${day.label}: ₹${day.net.toLocaleString('en-IN')}`}
            />
            <p className="text-[8px] text-dim mt-1">
              {day.label.split(' ')[0]}
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-white/[0.04]">
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-loss/30" />
          <span className="text-[9px] text-dim">Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-white/[0.03]" />
          <span className="text-[9px] text-dim">No Activity</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2.5 h-2.5 rounded bg-profit/30" />
          <span className="text-[9px] text-dim">Profit</span>
        </div>
      </div>
    </div>
  );
}

// ── Hourly Activity Chart ─────────────────────────────────────────────

function HourlyChart() {
  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-1">Hourly Activity</h3>
      <p className="text-[10px] text-dim mb-4">When you place your bets</p>

      <div className="h-40">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart
            data={hourlyBettingData}
            margin={{ top: 5, right: 0, left: -25, bottom: 0 }}
          >
            <XAxis
              dataKey="hour"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A4E5A', fontSize: 8 }}
              interval={2}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#4A4E5A', fontSize: 9 }}
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
            />
            <Bar dataKey="bets" radius={[3, 3, 0, 0]} maxBarSize={16}>
              {hourlyBettingData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.bets > 4 ? '#F5A623' : entry.bets > 2 ? '#6C5CE7' : '#2A2D38'}
                  fillOpacity={entry.bets > 0 ? 0.85 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Loss Chasing Alert ────────────────────────────────────────────────

function LossChasingAlert() {
  return (
    <div className="bg-loss/[0.08] border border-loss/20 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-loss/[0.15] flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle className="w-4 h-4 text-loss" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-loss mb-1">
            Loss Chasing Detected
          </h4>
          <p className="text-[11px] text-muted leading-relaxed">
            {lossChaseWarning.description}
          </p>
          <div className="flex items-center gap-3 mt-2.5">
            <span className="text-[10px] text-dim">
              Instances: <span className="text-loss font-semibold">{lossChaseWarning.instances}</span>
            </span>
            <span className="text-[10px] text-dim">
              Avg Increase: <span className="text-loss font-semibold">{lossChaseWarning.averageStakeIncrease}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
