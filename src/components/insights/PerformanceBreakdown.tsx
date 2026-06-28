import { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useBetStore, selectTournamentPerformance, selectTeamPerformance, selectPlayerPerformance } from '../../store/betStore';
import { formatCurrency } from '../../utils/utils';
import clsx from 'clsx';

type BreakdownTab = 'tournament' | 'team' | 'player';

const tabs: { id: BreakdownTab; label: string }[] = [
  { id: 'tournament', label: 'Tournament' },
  { id: 'team', label: 'Team' },
  { id: 'player', label: 'Player' },
];

export default function PerformanceBreakdown() {
  const [activeTab, setActiveTab] = useState<BreakdownTab>('tournament');

  return (
    <div className="bg-surface card-border rounded-xl p-4">
      <h3 className="text-sm font-semibold mb-3">Performance Breakdown</h3>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-alt rounded-lg p-0.5 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-surface-light text-white'
                : 'text-dim hover:text-muted',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'tournament' && <TournamentTable />}
      {activeTab === 'team' && <TeamTable />}
      {activeTab === 'player' && <PlayerTable />}
    </div>
  );
}

function TournamentTable() {
  const data = useBetStore(selectTournamentPerformance);

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-dim">
        No settled tournament data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((t) => (
        <div
          key={t.tournament}
          className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-dark/50 hover:bg-dark transition-colors"
        >
          <div className="flex-1">
            <p className="text-xs font-semibold">{t.tournament}</p>
            <p className="text-[10px] text-dim mt-0.5">
              {t.totalBets} bets • {t.won}W / {t.lost}L
            </p>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <p
                className={`text-xs font-bold ${
                  t.profitLoss >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {t.profitLoss >= 0 ? '+' : ''}
                {formatCurrency(t.profitLoss)}
              </p>
              <p className="text-[10px] text-dim">
                {t.winRate}% win • ROI: {t.roi >= 0 ? '+' : ''}{t.roi.toFixed(1)}%
              </p>
            </div>
            {t.profitLoss >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-profit" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-loss" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamTable() {
  const data = useBetStore(selectTeamPerformance);

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-dim">
        No settled team data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((t) => (
        <div
          key={t.team}
          className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-dark/50 hover:bg-dark transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-muted">
              {t.team.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs font-semibold">{t.team}</p>
              <p className="text-[10px] text-dim">{t.betsOn} bets</p>
            </div>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <p
                className={`text-xs font-bold ${
                  t.profitLoss >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {t.profitLoss >= 0 ? '+' : ''}
                {formatCurrency(t.profitLoss)}
              </p>
              <p className="text-[10px] text-dim">{t.winRate}% win</p>
            </div>
            {t.profitLoss >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-profit" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-loss" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PlayerTable() {
  const data = useBetStore(selectPlayerPerformance);

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-dim">
        No settled player data yet
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((p) => (
        <div
          key={p.player}
          className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-dark/50 hover:bg-dark transition-colors"
        >
          <div>
            <p className="text-xs font-semibold">{p.player}</p>
            <p className="text-[10px] text-dim">
              {p.market} • {p.bets} bets
            </p>
          </div>
          <div className="text-right flex items-center gap-2">
            <div>
              <p
                className={`text-xs font-bold ${
                  p.profitLoss >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {p.profitLoss >= 0 ? '+' : ''}
                {formatCurrency(p.profitLoss)}
              </p>
              <p className="text-[10px] text-dim">{p.winRate}% win</p>
            </div>
            {p.profitLoss >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-profit" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-loss" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

