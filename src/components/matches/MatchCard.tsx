import { Plus, MapPin } from 'lucide-react';
import type { Match } from '../../types/types';
import { formatTime, formatDate, getFormatColor } from '../../utils/utils';
import { useBetStore } from '../../store/betStore';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const openModal = useBetStore((s) => s.openModal);
  const setSelectedMatchId = useBetStore((s) => s.setSelectedMatchId);
  const setActiveTab = useBetStore((s) => s.setActiveTab);

  const handleAddBet = () => {
    setSelectedMatchId(match.id);
    openModal('addBet');
  };

  const formatColor = getFormatColor(match.format);

  return (
    <div className="bg-surface card-border rounded-xl overflow-hidden hover:bg-surface-light transition-all duration-200 card-border-hover">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
            style={{
              color: formatColor,
              backgroundColor: `${formatColor}18`,
            }}
          >
            {match.format}
          </span>
          <span className="text-[11px] text-muted">{match.tournament}</span>
        </div>
        {match.status === 'live' && (
          <div className="flex items-center gap-1.5">
            <span className="live-dot" />
            <span className="text-[10px] font-semibold text-loss uppercase tracking-wider">
              LIVE
            </span>
          </div>
        )}
        {match.status === 'upcoming' && (
          <span className="text-[10px] text-muted">
            {formatDate(match.startTime)} • {formatTime(match.startTime)}
          </span>
        )}
      </div>

      {/* Match content */}
      <div className="p-3.5">
        {/* Teams */}
        <div className="space-y-2.5">
          {/* Team 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-bold text-muted">
                {match.team1.shortName.slice(0, 2)}
              </div>
              <span className="text-sm font-semibold">{match.team1.shortName}</span>
            </div>
            {match.score?.team1Score && (
              <span className="text-sm font-bold text-white/90">
                {match.score.team1Score}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-xs font-bold text-muted">
                {match.team2.shortName.slice(0, 2)}
              </div>
              <span className="text-sm font-semibold">{match.team2.shortName}</span>
            </div>
            {match.score?.team2Score && (
              <span className="text-sm font-bold text-white/90">
                {match.score.team2Score}
              </span>
            )}
          </div>
        </div>

        {/* Result */}
        {match.score?.result && (
          <p className="text-[11px] text-profit font-medium mt-2.5 bg-profit/[0.06] rounded-lg px-2.5 py-1.5 text-center">
            {match.score.result}
          </p>
        )}

        {/* Venue + Add Bet */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/[0.04]">
          <div className="flex items-center gap-1 text-dim flex-1 min-w-0">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="text-[10px] truncate">{match.venue}</span>
          </div>
          {match.status !== 'finished' && (
            <button
              onClick={handleAddBet}
              className="flex items-center gap-1 bg-gold/[0.12] text-gold text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-gold/[0.2] transition-colors tap-effect ml-2 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
