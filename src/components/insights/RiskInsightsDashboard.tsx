import { useMemo } from 'react';
import { useBetStore, selectRiskAnalysis, selectHeatmapData, selectWeeklyRiskReport } from '../../store/betStore';
import {
  Flame,
  AlertTriangle,
  Heart,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/utils';

export default function RiskInsightsDashboard() {
  const riskAnalysis = useBetStore(selectRiskAnalysis);
  const heatmapData = useBetStore(selectHeatmapData);
  const weeklyReport = useBetStore(selectWeeklyRiskReport);

  const {
    riskScore,
    disciplineScore,
    alerts,
    nudges,
    recoverySuggestions,
    hasEmotionalTilt,
    hasMartingale,
    hasFrenzy,
    hasHighExposure,
  } = riskAnalysis;

  // Color mapping based on risk rating
  const riskColor = useMemo(() => {
    switch (riskScore) {
      case 'Low':
        return { text: 'text-profit', bg: 'bg-profit/12', border: 'border-profit/20', colorCode: '#00c896' };
      case 'Medium':
        return { text: 'text-gold', bg: 'bg-gold/12', border: 'border-gold/20', colorCode: '#f5a623' };
      case 'High':
        return { text: 'text-orange-500', bg: 'bg-orange-500/12', border: 'border-orange-500/20', colorCode: '#ff7a00' };
      case 'Dangerous':
        return { text: 'text-loss', bg: 'bg-loss/12', border: 'border-loss/20', colorCode: '#ff5c72' };
    }
  }, [riskScore]);

  // Color mapping for weekly discipline rating
  const ratingColor = useMemo(() => {
    switch (weeklyReport.rating) {
      case 'Safe':
        return 'text-profit bg-profit/10 border-profit/20';
      case 'Guarded':
        return 'text-gold bg-gold/10 border-gold/20';
      case 'Risky':
        return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'Critical':
        return 'text-loss bg-loss/10 border-loss/20';
    }
  }, [weeklyReport.rating]);

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* 1. Daily Discipline Score & Risk Meter */}
      <div className="bg-surface card-border rounded-xl p-4 flex flex-col md:flex-row items-center gap-6">
        {/* Radial Progress Score */}
        <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="56"
              cy="56"
              r="48"
              stroke={riskColor.colorCode}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 48}
              strokeDashoffset={2 * Math.PI * 48 * (1 - disciplineScore / 100)}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-2xl font-black text-white">{disciplineScore}</span>
            <span className="text-[9px] text-dim block font-bold uppercase tracking-wider">Discipline</span>
          </div>
        </div>

        {/* Risk Level Card */}
        <div className="flex-1 space-y-2 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-2">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${riskColor.bg} ${riskColor.text} border ${riskColor.border}`}>
              Risk Score: {riskScore}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white/90">Loss-Chasing Behavior Rating</h3>
          <p className="text-xs text-muted leading-relaxed">
            {disciplineScore >= 85
              ? 'Excellent discipline! Your staking sizes are consistent, and you are not placing rash bets after losses.'
              : disciplineScore >= 65
                ? 'Moderate concern. You are displaying slight indicators of loss chasing or high exposures. Keep guard.'
                : 'Warning. Your betting pace has jumped, and stakes are increasing significantly after recent losses.'}
          </p>
        </div>
      </div>

      {/* 2. Emotional Tilt Tracker Warnings */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-gold" />
          Emotional Tilt & Panic Indicators
        </h3>

        {alerts.length > 0 ? (
          <div className="space-y-2.5">
            {nudges.map((nudge, index) => (
              <div
                key={index}
                className="p-3 bg-loss/[0.04] border border-loss/10 rounded-lg flex items-start gap-2.5 animate-slide-up"
              >
                <AlertTriangle className="w-4 h-4 text-loss shrink-0 mt-0.5" />
                <p className="text-xs text-white/90 leading-snug font-medium">{nudge}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 border border-profit/10 bg-profit/[0.02] rounded-lg text-center space-y-1.5 flex flex-col items-center">
            <CheckCircle2 className="w-6 h-6 text-profit" />
            <h4 className="text-xs font-bold text-profit uppercase tracking-wider">Discipline Clean</h4>
            <p className="text-xs text-dim">No tilt patterns or aggressive loss-chasing stakes detected.</p>
          </div>
        )}
      </div>

      {/* 3. Session Heatmap: Hourly aggressive windows */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-purple" />
            Aggressive Session Heatmap
          </h3>
          <p className="text-[10px] text-dim mt-0.5">Track time windows where your betting stakes are heaviest</p>
        </div>

        {/* Heatmap timeline scroll */}
        <div className="overflow-x-auto pb-1 select-none">
          <div className="flex gap-1.5 min-w-[550px] justify-between pt-2">
            {heatmapData.map((h) => {
              // Calculate styling based on normalized intensity
              const intensityStyle =
                h.betCount === 0
                  ? 'bg-white/[0.02] border-white/[0.04]'
                  : h.intensity > 0.7
                    ? 'bg-loss/80 border-loss shadow-[0_0_8px_rgba(255,92,114,0.3)] text-white'
                    : h.intensity > 0.4
                      ? 'bg-gold/80 border-gold shadow-[0_0_8px_rgba(245,166,35,0.2)] text-dark font-bold'
                      : 'bg-purple/60 border-purple text-white';
              
              const hrLabel = h.hour === 0 ? '12a' : h.hour === 12 ? '12p' : h.hour > 12 ? `${h.hour - 12}p` : `${h.hour}a`;

              return (
                <div
                  key={h.hour}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={`${h.betCount} bets placed, total ₹${h.totalStake.toLocaleString('en-IN')} stake`}
                >
                  <div
                    className={`w-full aspect-square rounded-lg border flex items-center justify-center text-[10px] transition-all ${intensityStyle}`}
                  >
                    {h.betCount > 0 ? h.betCount : ''}
                  </div>
                  <span className="text-[8px] text-dim font-bold uppercase">{hrLabel}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex gap-4 justify-end text-[9px] font-bold text-dim pt-1.5">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-white/[0.02] border border-white/[0.04]" /> Idle</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple/60 border border-purple" /> Active</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gold/80 border border-gold" /> Heavy</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-loss/80 border border-loss" /> Dangerous</span>
        </div>
      </div>

      {/* 4. Weekly Risk Report */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Weekly Performance Report</h3>
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-dark/40 border border-white/[0.03] rounded-lg p-2.5">
            <span className="text-[9px] text-dim block uppercase font-bold">Risk Rating</span>
            <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full mt-1.5 border uppercase ${ratingColor}`}>
              {weeklyReport.rating}
            </span>
          </div>

          <div className="bg-dark/40 border border-white/[0.03] rounded-lg p-2.5">
            <span className="text-[9px] text-dim block uppercase font-bold">Trend</span>
            <div className="flex items-center justify-center gap-1 mt-1 text-xs font-bold text-white/90">
              {weeklyReport.weeklyTrend === 'Improving' && (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-profit" />
                  <span className="text-profit">Improving</span>
                </>
              )}
              {weeklyReport.weeklyTrend === 'Stable' && (
                <>
                  <span className="text-muted">Stable</span>
                </>
              )}
              {weeklyReport.weeklyTrend === 'Declining' && (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-loss" />
                  <span className="text-loss">Declining</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-dark/40 border border-white/[0.03] rounded-lg p-2.5">
            <span className="text-[9px] text-dim block uppercase font-bold">Weekly Alerts</span>
            <span className="text-base font-black text-white/95 mt-1 block">
              {weeklyReport.weeklyAlertsCount}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Dynamic Recovery Suggestions */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-purple" />
          Recovery & Safeguard Actions
        </h3>
        
        <div className="space-y-2">
          {recoverySuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-purple/[0.04] border border-purple/10 rounded-lg flex gap-3 text-xs"
            >
              <span className="w-5 h-5 rounded-full bg-purple/10 flex items-center justify-center font-bold text-purple shrink-0">
                {index + 1}
              </span>
              <p className="text-white/80 leading-relaxed font-medium">{suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
