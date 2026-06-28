import { useMemo } from 'react';
import { useBetStore } from '../../store/betStore';
import Modal from './Modal';
import { formatCurrency } from '../../utils/utils';
import { Shield, Users, HelpCircle, AlertCircle } from 'lucide-react';
import type { MarketType } from '../../types/types';

export default function MatchCenterModal() {
  const isOpen = useBetStore((s) => s.modals.matchCenter);
  const closeModal = useBetStore((s) => s.closeModal);
  const openModal = useBetStore((s) => s.openModal);
  const selectedMatchId = useBetStore((s) => s.selectedMatchId);
  const setSelectedMatchId = useBetStore((s) => s.setSelectedMatchId);
  const setPrefilledBet = useBetStore((s) => s.setPrefilledBet);
  
  const matches = useBetStore((s) => s.matches);
  const bets = useBetStore((s) => s.bets);

  const match = useMemo(
    () => matches.find((m) => m.id === selectedMatchId),
    [matches, selectedMatchId],
  );

  const linkedBets = useMemo(
    () => bets.filter((b) => b.matchId === selectedMatchId),
    [bets, selectedMatchId],
  );

  const handleClose = () => {
    setSelectedMatchId(null);
    closeModal('matchCenter');
  };

  const handlePlaceSessionBet = (
    marketType: MarketType,
    selection: string,
    odds: number,
  ) => {
    if (!match) return;
    // Set prefilled data
    setPrefilledBet({
      marketType,
      selection,
      odds,
    });
    // Set match id for the addBet modal
    setSelectedMatchId(match.id);
    // Close match center modal
    closeModal('matchCenter');
    // Open place bet modal
    openModal('addBet');
  };

  if (!match) return null;

  const live = match.liveData;
  const isFinished = match.status === 'finished';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`${match.team1.shortName} vs ${match.team2.shortName} – Match Center`}>
      <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1 hide-scrollbar">
        {/* Match Header Info */}
        <div className="bg-dark-alt card-border rounded-xl p-3.5 text-center">
          <span className="text-[10px] uppercase font-bold tracking-widest text-purple bg-purple/10 px-2.5 py-0.5 rounded-full">
            {match.format} • {match.tournament}
          </span>
          <h3 className="text-base font-bold mt-2 text-white/95">
            {match.team1.name} vs {match.team2.name}
          </h3>
          <p className="text-[10px] text-muted mt-1">{match.venue}</p>
        </div>

        {/* Live Score Section */}
        <div className="bg-surface card-border rounded-xl p-4 flex flex-col items-center">
          {match.status === 'live' && (
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="live-dot" />
              <span className="text-[10px] font-bold text-loss uppercase tracking-wider">LIVE MATCH</span>
            </div>
          )}
          
          <div className="grid grid-cols-3 w-full items-center text-center">
            {/* Team 1 Score */}
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">{match.team1.shortName}</p>
              <p className="text-lg font-extrabold text-white mt-1">
                {match.score?.team1Score || '0/0'}
              </p>
            </div>

            {/* VS Status */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-dim font-bold">vs</span>
              {live && (
                <span className="text-[10px] text-gold font-extrabold bg-gold/10 px-2 py-0.5 rounded-md mt-1">
                  Innings {live.innings}
                </span>
              )}
            </div>

            {/* Team 2 Score */}
            <div>
              <p className="text-xs font-bold text-muted uppercase tracking-wider">{match.team2.shortName}</p>
              <p className="text-lg font-extrabold text-white mt-1">
                {match.score?.team2Score || '—'}
              </p>
            </div>
          </div>

          {/* Overs details */}
          {match.score?.overs && (
            <p className="text-[10px] text-dim mt-2 font-bold">
              Overs: {match.score.overs}
            </p>
          )}

          {/* Result or Live Status */}
          {match.score?.result ? (
            <div className="w-full mt-3 p-2 bg-profit/10 border border-profit/20 rounded-lg text-center">
              <p className="text-xs font-bold text-profit">{match.score.result}</p>
            </div>
          ) : live ? (
            <div className="w-full mt-3 p-2 bg-purple/10 border border-purple/20 rounded-lg text-center">
              <p className="text-[11px] font-medium text-white/95 leading-snug">{live.liveStatus}</p>
            </div>
          ) : null}

          {/* Run rates */}
          {live && (
            <div className="flex justify-center gap-4 w-full mt-3 pt-3 border-t border-white/[0.04] text-[10px] font-bold text-muted">
              <span>CRR: <span className="text-white">{live.crr.toFixed(2)}</span></span>
              {live.target && live.rrr && (
                <>
                  <span>Target: <span className="text-white">{live.target}</span></span>
                  <span>RRR: <span className="text-white">{live.rrr.toFixed(2)}</span></span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Scorecard Tab */}
        {live && (
          <div className="space-y-4">
            {/* Batsmen Scorecard */}
            <div className="bg-surface card-border rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.04]">
                <Users className="w-4 h-4 text-purple" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Batting: {live.battingTeam}</h4>
              </div>
              <div className="space-y-2">
                {/* Header row */}
                <div className="grid grid-cols-12 text-[9px] text-dim uppercase font-bold tracking-wider pb-1 border-b border-white/[0.02]">
                  <span className="col-span-6">Batsman</span>
                  <span className="col-span-2 text-center">R</span>
                  <span className="col-span-2 text-center">B</span>
                  <span className="col-span-2 text-center">SR</span>
                </div>
                {/* Active and dismissed batsmen */}
                {live.batsmen
                  .filter((b) => b.runs > 0 || b.balls > 0 || ldActiveBatsmen(b, live.batsmen, live.currentBatsmenIds))
                  .map((b, i) => {
                    const isActive = ldActiveBatsmen(b, live.batsmen, live.currentBatsmenIds);
                    const strike = isActive && live.currentBatsmenIds[0] === live.batsmen.indexOf(b);
                    const sr = b.runs > 0 && b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '0';
                    return (
                      <div
                        key={i}
                        className={`grid grid-cols-12 text-xs py-1 border-b border-white/[0.02] items-center ${
                          isActive ? 'text-white font-bold bg-white/[0.02] rounded-md px-1 -mx-1' : 'text-muted'
                        }`}
                      >
                        <span className="col-span-6 truncate flex items-center gap-1">
                          {b.name}
                          {strike && <span className="text-gold text-[10px]">★</span>}
                          {!isActive && b.isOut && (
                            <span className="text-[9px] text-dim block font-normal normal-case truncate">
                              {b.howOut}
                            </span>
                          )}
                        </span>
                        <span className="col-span-2 text-center">{b.runs}</span>
                        <span className="col-span-2 text-center">{b.balls}</span>
                        <span className="col-span-2 text-center text-[10px] text-muted">{sr}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Bowlers Scorecard */}
            <div className="bg-surface card-border rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/[0.04]">
                <Shield className="w-4 h-4 text-purple" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Bowling: {live.bowlingTeam}</h4>
              </div>
              <div className="space-y-2">
                <div className="grid grid-cols-12 text-[9px] text-dim uppercase font-bold tracking-wider pb-1 border-b border-white/[0.02]">
                  <span className="col-span-6">Bowler</span>
                  <span className="col-span-2 text-center">O</span>
                  <span className="col-span-2 text-center">R</span>
                  <span className="col-span-2 text-center">W</span>
                  <span className="col-span-2 text-center">Econ</span>
                </div>
                {live.bowlers
                  .filter((b) => (b.overs ?? 0) > 0 || live.bowlers.indexOf(b) === live.currentBowlerId)
                  .map((b, i) => {
                    const isActive = live.bowlers.indexOf(b) === live.currentBowlerId;
                    const overs = b.overs ?? 0;
                    const runs = b.runsConceded ?? 0;
                    const wickets = b.wickets ?? 0;
                    const econ = overs > 0 ? (runs / overs).toFixed(2) : '0.00';
                    return (
                      <div
                        key={i}
                        className={`grid grid-cols-12 text-xs py-1 border-b border-white/[0.02] items-center ${
                          isActive ? 'text-white font-bold bg-white/[0.02] rounded-md px-1 -mx-1' : 'text-muted'
                        }`}
                      >
                        <span className="col-span-6 truncate flex items-center gap-1">
                          {b.name}
                          {isActive && <span className="w-1.5 h-1.5 bg-profit rounded-full animate-pulse-soft" />}
                        </span>
                        <span className="col-span-2 text-center">{overs.toFixed(1)}</span>
                        <span className="col-span-2 text-center">{runs}</span>
                        <span className="col-span-2 text-center text-profit font-bold">{wickets}</span>
                        <span className="col-span-2 text-center text-[10px] text-muted">{econ}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Live Session Betting Markets */}
        {live && !isFinished && (
          <div className="bg-surface card-border rounded-xl p-3.5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.04]">
              <HelpCircle className="w-4 h-4 text-gold" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-gold">Live Session Markets</h4>
            </div>

            <div className="space-y-3">
              {live.sessionMarkets.map((m) => (
                <div key={m.id} className="p-3 rounded-lg bg-dark/50 border border-white/[0.03] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider">{m.title}</span>
                    <span className="text-[10px] text-dim bg-white/[0.04] px-2 py-0.5 rounded-md font-semibold">
                      Target: {m.target}
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium">{m.question}</p>
                  
                  {m.status === 'open' ? (
                    <div className="grid grid-cols-2 gap-2 pt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handlePlaceSessionBet(
                            m.type === 'over_runs' ? 'Session Betting' : m.type === 'wickets' ? 'Wickets' : 'Boundary Count',
                            `${m.title} - Over ${m.target}`,
                            m.oddsOver,
                          )
                        }
                        className="py-2 bg-surface-light border border-white/[0.06] hover:bg-white/[0.06] text-xs font-bold text-profit rounded-lg flex flex-col items-center gap-0.5 transition-colors tap-effect"
                      >
                        <span className="text-[9px] uppercase text-dim tracking-wider">OVER {m.target}</span>
                        <span className="text-sm font-extrabold">{m.oddsOver.toFixed(2)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handlePlaceSessionBet(
                            m.type === 'over_runs' ? 'Session Betting' : m.type === 'wickets' ? 'Wickets' : 'Boundary Count',
                            `${m.title} - Under ${m.target}`,
                            m.oddsUnder,
                          )
                        }
                        className="py-2 bg-surface-light border border-white/[0.06] hover:bg-white/[0.06] text-xs font-bold text-loss rounded-lg flex flex-col items-center gap-0.5 transition-colors tap-effect"
                      >
                        <span className="text-[9px] uppercase text-dim tracking-wider">UNDER {m.target}</span>
                        <span className="text-sm font-extrabold">{m.oddsUnder.toFixed(2)}</span>
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 bg-white/[0.03] rounded-lg text-center text-xs text-dim font-bold">
                      Settled: <span className="text-white uppercase font-extrabold">{m.result}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Bets on this match */}
        <div className="bg-surface card-border rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.04]">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Linked Bets ({linkedBets.length})</h4>
            </div>
          </div>

          {linkedBets.length > 0 ? (
            <div className="space-y-2.5">
              {linkedBets.map((b) => (
                <div key={b.id} className="p-2.5 rounded-lg bg-dark/30 border border-white/[0.03] flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white/95">{b.selection}</p>
                    <p className="text-[10px] text-dim mt-0.5">
                      {b.marketType} • ₹{b.stake.toLocaleString('en-IN')} @ {b.odds.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        b.status === 'won'
                          ? 'bg-profit/12 text-profit'
                          : b.status === 'lost'
                            ? 'bg-loss/12 text-loss'
                            : 'bg-gold/12 text-gold'
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.status !== 'running' && (
                      <p className={`text-[11px] font-bold mt-1 ${b.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {b.profitLoss >= 0 ? '+' : ''}{formatCurrency(b.profitLoss)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-dim">
              No bets linked to this match yet.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Helper to determine if player is active batting batsman
function ldActiveBatsmen(b: any, batsmen: any[], activeIds: number[]): boolean {
  const idx = batsmen.indexOf(b);
  return activeIds.includes(idx);
}
