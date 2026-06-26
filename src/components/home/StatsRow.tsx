import { Eye, Crosshair, ShieldAlert } from 'lucide-react';
import {
  useBetStore,
  selectTotalExposure,
  selectActiveBetsCount,
  selectTotalBalance,
} from '../../store/betStore';
import { formatCurrency, getRiskLevel, getRiskColor } from '../../utils/utils';

export default function StatsRow() {
  const exposure = useBetStore(selectTotalExposure);
  const activeBets = useBetStore(selectActiveBetsCount);
  const totalBalance = useBetStore(selectTotalBalance);
  const risk = getRiskLevel(exposure, totalBalance);
  const riskColor = getRiskColor(risk);

  return (
    <div
      className="grid grid-cols-3 gap-2.5 animate-slide-up stagger-3"
      style={{ opacity: 0 }}
    >
      {/* Live Exposure */}
      <div className="bg-surface card-border rounded-xl p-3 text-center">
        <div className="flex justify-center mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-loss/[0.1] flex items-center justify-center">
            <Eye className="w-3.5 h-3.5 text-loss" />
          </div>
        </div>
        <p className="text-muted text-[10px] font-medium tracking-wide uppercase mb-0.5">
          Exposure
        </p>
        <p className="text-sm font-bold">{formatCurrency(exposure, true)}</p>
      </div>

      {/* Active Bets */}
      <div className="bg-surface card-border rounded-xl p-3 text-center">
        <div className="flex justify-center mb-1.5">
          <div className="w-7 h-7 rounded-lg bg-gold/[0.1] flex items-center justify-center">
            <Crosshair className="w-3.5 h-3.5 text-gold" />
          </div>
        </div>
        <p className="text-muted text-[10px] font-medium tracking-wide uppercase mb-0.5">
          Active Bets
        </p>
        <p className="text-sm font-bold text-gold">{activeBets}</p>
      </div>

      {/* Risk Level */}
      <div className="bg-surface card-border rounded-xl p-3 text-center">
        <div className="flex justify-center mb-1.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${riskColor}15` }}
          >
            <ShieldAlert className="w-3.5 h-3.5" style={{ color: riskColor }} />
          </div>
        </div>
        <p className="text-muted text-[10px] font-medium tracking-wide uppercase mb-0.5">
          Risk Level
        </p>
        <p className="text-sm font-bold" style={{ color: riskColor }}>
          {risk}
        </p>
      </div>
    </div>
  );
}
