import { useState, useMemo } from 'react';
import { useBetStore } from '../../store/betStore';
import {
  Trophy,
  Calendar,
  Users,
  User,
  Activity,
  Flame,
  Download,
  PlusCircle,
  TrendingUp,
  Percent,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';
import { formatCurrency, formatCurrencyWithSign } from '../../utils/utils';
import dayjs from 'dayjs';
import type { Bet } from '../../types/types';

export default function TournamentDashboard() {
  const bets = useBetStore((s) => s.bets || []);
  const matches = useBetStore((s) => s.matches || []);

  // Standard tournament presets + custom ones
  const [customTournaments, setCustomTournaments] = useState<string[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string>('IPL 2026');
  const [newTourneyName, setNewTourneyName] = useState('');
  const [showAddTourney, setShowAddTourney] = useState(false);

  // Derive unique tournaments from bets and presets
  const availableTournaments = useMemo(() => {
    const fromBets = bets.map(b => b.tournament).filter(Boolean);
    const set = new Set(['IPL 2026', 'T20 World Cup', 'Asia Cup', 'Champions Trophy', ...fromBets, ...customTournaments]);
    return Array.from(set);
  }, [bets, customTournaments]);

  // Filter bets for the selected tournament
  const tourneyBets = useMemo(() => {
    return bets.filter(b => b.tournament === selectedTournament);
  }, [bets, selectedTournament]);

  // Filter matches for the selected tournament
  const tourneyMatches = useMemo(() => {
    return matches.filter(m => m.tournament === selectedTournament);
  }, [matches, selectedTournament]);

  // 1. Season Summary Stats
  const stats = useMemo(() => {
    const total = tourneyBets.length;
    const settled = tourneyBets.filter(b => b.status === 'won' || b.status === 'lost');
    const wonCount = settled.filter(b => b.status === 'won').length;
    const winRate = settled.length > 0 ? Math.round((wonCount / settled.length) * 100) : 0;
    
    const totalStake = settled.reduce((sum, b) => sum + b.stake, 0);
    const totalPnL = settled.reduce((sum, b) => sum + b.profitLoss, 0);
    const roi = totalStake > 0 ? Math.round((totalPnL / totalStake) * 100) : 0;

    return {
      total,
      settled: settled.length,
      winRate,
      totalPnL,
      roi,
      totalStake
    };
  }, [tourneyBets]);

  // 2. Team-wise Performance
  const teamPerformance = useMemo(() => {
    const performance: Record<string, { total: number; won: number; lost: number; pnl: number }> = {};

    tourneyBets.forEach(b => {
      // Find matches to get teams, or infer from selection
      let team = '';
      if (b.marketType === 'Match Winner') {
        team = b.selection;
      } else {
        // try to find matching team in title (e.g. "CSK vs MI" -> check CSK / MI)
        const match = matches.find(m => m.id === b.matchId);
        if (match) {
          // default to team1 for batter/bowler bets if we don't know, or selection name
          team = match.team1.shortName;
        }
      }

      if (!team) return;

      if (!performance[team]) {
        performance[team] = { total: 0, won: 0, lost: 0, pnl: 0 };
      }

      performance[team].total++;
      if (b.status === 'won') {
        performance[team].won++;
        performance[team].pnl += b.profitLoss;
      } else if (b.status === 'lost') {
        performance[team].lost++;
        performance[team].pnl += b.profitLoss;
      }
    });

    return Object.entries(performance)
      .map(([teamName, data]) => {
        const winrate = data.total > 0 ? Math.round((data.won / data.total) * 100) : 0;
        return {
          teamName,
          ...data,
          winrate
        };
      })
      .sort((a, b) => b.pnl - a.pnl);
  }, [tourneyBets, matches]);

  // 3. Top Profitable Teams
  const topProfitableTeams = useMemo(() => {
    return teamPerformance.filter(t => t.pnl > 0).slice(0, 3);
  }, [teamPerformance]);

  // 4. Player-based profit tracking (Batsman vs Bowler)
  const playerPerformance = useMemo(() => {
    const players: Record<string, { role: 'batsman' | 'bowler'; total: number; pnl: number }> = {};

    tourneyBets.forEach(b => {
      if (b.marketType === 'Top Batter' || b.marketType === 'Top Bowler' || b.marketType === 'Player Runs') {
        const role = b.marketType === 'Top Bowler' ? 'bowler' : 'batsman';
        if (!players[b.selection]) {
          players[b.selection] = { role, total: 0, pnl: 0 };
        }
        players[b.selection].total++;
        players[b.selection].pnl += b.profitLoss;
      }
    });

    const list = Object.entries(players).map(([playerName, data]) => ({
      playerName,
      ...data
    }));

    const batsman = list.filter(p => p.role === 'batsman').sort((a, b) => b.pnl - a.pnl).slice(0, 3);
    const bowler = list.filter(p => p.role === 'bowler').sort((a, b) => b.pnl - a.pnl).slice(0, 3);

    return { batsman, bowler };
  }, [tourneyBets]);

  // 5. Stage-wise Analytics (League vs Playoffs vs Finals)
  const stageAnalytics = useMemo(() => {
    const stages = {
      league: { total: 0, pnl: 0, stake: 0 },
      playoffs: { total: 0, pnl: 0, stake: 0 },
      finals: { total: 0, pnl: 0, stake: 0 }
    };

    tourneyBets.forEach(b => {
      const stage = b.stage || 'league';
      if (stages[stage]) {
        stages[stage].total++;
        if (b.status === 'won' || b.status === 'lost') {
          stages[stage].pnl += b.profitLoss;
          stages[stage].stake += b.stake;
        }
      }
    });

    return Object.entries(stages).map(([stageName, data]) => {
      const roi = data.stake > 0 ? Math.round((data.pnl / data.stake) * 100) : 0;
      return {
        stageName: stageName.charAt(0).toUpperCase() + stageName.slice(1),
        ...data,
        roi
      };
    });
  }, [tourneyBets]);

  // 6. Tournament streak tracker
  const streaks = useMemo(() => {
    const settled = tourneyBets.filter(b => b.status === 'won' || b.status === 'lost');
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    settled.forEach(b => {
      if (b.status === 'won') {
        currentWinStreak++;
        currentLossStreak = 0;
        if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
      } else if (b.status === 'lost') {
        currentLossStreak++;
        currentWinStreak = 0;
        if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
      }
    });

    return {
      currentStreak: currentWinStreak > 0 ? `${currentWinStreak}W` : currentLossStreak > 0 ? `${currentLossStreak}L` : '0',
      bestWinStreak: maxWinStreak,
      worstLossStreak: maxLossStreak
    };
  }, [tourneyBets]);

  // 7. Trophy Room milestone rewards
  const trophies = useMemo(() => {
    const achieved: { title: string; desc: string; iconColor: string }[] = [];
    
    // Calculate metrics across all tournaments to find records
    if (stats.roi > 50 && stats.settled >= 5) {
      achieved.push({
        title: 'ROI Master',
        desc: `${selectedTournament} finished with a stellar ROI of ${stats.roi}%`,
        iconColor: 'text-gold'
      });
    }

    if (stats.winRate >= 70 && stats.settled >= 5) {
      achieved.push({
        title: 'Sharpshooter',
        desc: `High accuracy in ${selectedTournament} with ${stats.winRate}% win rate`,
        iconColor: 'text-profit'
      });
    }

    if (stats.totalPnL > 25000) {
      achieved.push({
        title: 'Profit Legend',
        desc: `Accumulated ₹${stats.totalPnL.toLocaleString('en-IN')} total earnings in a single tournament`,
        iconColor: 'text-purple'
      });
    }

    if (streaks.bestWinStreak >= 5) {
      achieved.push({
        title: 'Undefeated Streak',
        desc: `Secured a streak of 5+ consecutive wins during the season`,
        iconColor: 'text-orange-500'
      });
    }

    // Default trophy for participating
    if (achieved.length === 0 && stats.total > 0) {
      achieved.push({
        title: 'Season Competitor',
        desc: `Successfully logged bets for the ${selectedTournament} season`,
        iconColor: 'text-dim'
      });
    }

    return achieved;
  }, [stats, selectedTournament, streaks]);

  // 8. Custom tournament form handler
  const handleAddTourney = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourneyName.trim()) return;
    setCustomTournaments(c => [...c, newTourneyName.trim()]);
    setSelectedTournament(newTourneyName.trim());
    setNewTourneyName('');
    setShowAddTourney(false);
  };

  // 9. Export summary report as CSV
  const handleExportCSV = () => {
    if (tourneyBets.length === 0) {
      alert('No bets recorded for this tournament.');
      return;
    }

    const headers = 'ID,Match,Tournament,Stage,Format,Market,Selection,Stake,Odds,Status,PnL,Date\n';
    const rows = tourneyBets.map(b => {
      return `${b.id},"${b.matchTitle}","${b.tournament}",${b.stage || 'league'},${b.format},"${b.marketType}","${b.selection}",${b.stake},${b.odds},${b.status},${b.profitLoss},"${b.timePlaced}"`;
    }).join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${selectedTournament.replace(/\s+/g, '-').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      
      {/* Tournament Selector & Create Panel */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="w-full md:w-2/3">
            <label className="text-[10px] text-dim uppercase block mb-1 font-bold">Select Tournament</label>
            <select
              className="select-dark text-xs"
              value={selectedTournament}
              onChange={(e) => setSelectedTournament(e.target.value)}
            >
              {availableTournaments.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddTourney(!showAddTourney)}
            className="w-full md:w-auto bg-purple/10 hover:bg-purple/20 border border-purple/20 text-purple font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors tap-effect"
          >
            <PlusCircle className="w-4 h-4" />
            Add Custom
          </button>
        </div>

        {showAddTourney && (
          <form onSubmit={handleAddTourney} className="flex gap-2 pt-2 border-t border-white/[0.04] animate-slide-up">
            <input
              type="text"
              className="input-dark flex-1 text-xs"
              placeholder="e.g. BBL 2026"
              value={newTourneyName}
              onChange={(e) => setNewTourneyName(e.target.value)}
              required
            />
            <button
              type="submit"
              className="bg-gold text-dark px-4 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              Create
            </button>
          </form>
        )}
      </div>

      {/* Season Dashboard Scoreboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface card-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4 text-gold" />
          </div>
          <div>
            <span className="text-[9px] text-dim block uppercase font-bold">ROI</span>
            <span className={`text-sm font-extrabold ${stats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
              {stats.roi}%
            </span>
          </div>
        </div>

        <div className="bg-surface card-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center shrink-0">
            <Percent className="w-4 h-4 text-purple" />
          </div>
          <div>
            <span className="text-[9px] text-dim block uppercase font-bold">Win Rate</span>
            <span className="text-sm font-extrabold text-white">
              {stats.winRate}%
            </span>
          </div>
        </div>

        <div className="bg-surface card-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-muted" />
          </div>
          <div>
            <span className="text-[9px] text-dim block uppercase font-bold">Total Bets</span>
            <span className="text-sm font-extrabold text-white">
              {stats.total}
            </span>
          </div>
        </div>

        <div className="bg-surface card-border rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-profit" />
          </div>
          <div>
            <span className="text-[9px] text-dim block uppercase font-bold">Profit/Loss</span>
            <span className={`text-sm font-black ${stats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
              {formatCurrencyWithSign(stats.totalPnL)}
            </span>
          </div>
        </div>
      </div>

      {/* Top Profitable Teams Podium & Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Podium */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-gold" />
            Top Profitable Teams
          </h3>
          {topProfitableTeams.length > 0 ? (
            <div className="flex justify-around items-end pt-5 h-28 relative">
              {/* 2nd place */}
              {topProfitableTeams[1] && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-white/80">{topProfitableTeams[1].teamName}</span>
                  <span className="text-[9px] text-profit font-semibold">+{formatCurrency(topProfitableTeams[1].pnl, true)}</span>
                  <div className="w-14 bg-white/5 border-t-2 border-white/20 h-10 mt-1 flex items-center justify-center text-xs font-black text-muted">2</div>
                </div>
              )}
              {/* 1st place */}
              {topProfitableTeams[0] && (
                <div className="flex flex-col items-center z-10">
                  <span className="text-xs font-extrabold text-gold">{topProfitableTeams[0].teamName}</span>
                  <span className="text-[10px] text-profit font-bold">+{formatCurrency(topProfitableTeams[0].pnl, true)}</span>
                  <div className="w-16 bg-gold/10 border-t-2 border-gold h-14 mt-1 flex items-center justify-center text-sm font-black text-gold">1</div>
                </div>
              )}
              {/* 3rd place */}
              {topProfitableTeams[2] && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold text-white/60">{topProfitableTeams[2].teamName}</span>
                  <span className="text-[9px] text-profit font-semibold">+{formatCurrency(topProfitableTeams[2].pnl, true)}</span>
                  <div className="w-14 bg-white/5 border-t-2 border-white/10 h-8 mt-1 flex items-center justify-center text-xs font-black text-muted">3</div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-dim">No team profits recorded yet.</div>
          )}
        </div>

        {/* Streaks & Details */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/95 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-purple" />
            Tournament Streak Tracker
          </h3>
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="bg-dark/30 border border-white/[0.02] rounded-lg p-2">
              <span className="text-[8px] text-dim block uppercase font-bold">Current</span>
              <span className="text-xs font-bold text-white mt-1 block">{streaks.currentStreak}</span>
            </div>
            <div className="bg-dark/30 border border-white/[0.02] rounded-lg p-2">
              <span className="text-[8px] text-dim block uppercase font-bold">Best Win Streak</span>
              <span className="text-xs font-bold text-profit mt-1 block">{streaks.bestWinStreak} wins</span>
            </div>
            <div className="bg-dark/30 border border-white/[0.02] rounded-lg p-2">
              <span className="text-[8px] text-dim block uppercase font-bold">Worst Loss Streak</span>
              <span className="text-xs font-bold text-loss mt-1 block">{streaks.worstLossStreak} losses</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage-wise breakdown */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Stage-wise Tournament Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {stageAnalytics.map((stage) => {
            return (
              <div key={stage.stageName} className="p-3 bg-dark/40 border border-white/[0.03] rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="font-extrabold text-white">{stage.stageName} Stage</span>
                  <span className="text-[9px] text-dim block mt-0.5">{stage.total} bets placed</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold block ${stage.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {stage.pnl >= 0 ? '+' : ''}₹{stage.pnl.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] text-dim mt-0.5 block">ROI: {stage.roi}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Player-based stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Batsmen */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
            <User className="w-4 h-4 text-gold" />
            Top Batter Performance
          </h3>
          {playerPerformance.batsman.length > 0 ? (
            <div className="space-y-2">
              {playerPerformance.batsman.map((p, idx) => (
                <div key={p.playerName} className="flex items-center justify-between text-xs border-b border-white/[0.02] pb-1.5">
                  <span className="text-white/80 font-medium">{idx + 1}. {p.playerName}</span>
                  <span className={`font-bold ${p.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {p.pnl >= 0 ? '+' : ''}₹{p.pnl.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-dim">No batter bets recorded.</div>
          )}
        </div>

        {/* Bowlers */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
            <User className="w-4 h-4 text-purple" />
            Top Bowler Performance
          </h3>
          {playerPerformance.bowler.length > 0 ? (
            <div className="space-y-2">
              {playerPerformance.bowler.map((p, idx) => (
                <div key={p.playerName} className="flex items-center justify-between text-xs border-b border-white/[0.02] pb-1.5">
                  <span className="text-white/80 font-medium">{idx + 1}. {p.playerName}</span>
                  <span className={`font-bold ${p.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {p.pnl >= 0 ? '+' : ''}₹{p.pnl.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-dim">No bowler bets recorded.</div>
          )}
        </div>
      </div>

      {/* Team-wise breakdown list */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/95">Full Team Performance Rankings</h3>
        {teamPerformance.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/[0.04] text-[9px] text-dim uppercase font-bold tracking-wider">
                  <th className="py-2">Team</th>
                  <th className="py-2 text-right">Bets</th>
                  <th className="py-2 text-right">Winrate</th>
                  <th className="py-2 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody>
                {teamPerformance.map((team) => (
                  <tr key={team.teamName} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                    <td className="py-2.5 font-semibold text-white/90">{team.teamName}</td>
                    <td className="py-2.5 text-right text-white/60">{team.total}</td>
                    <td className="py-2.5 text-right text-white/70">{team.winrate}%</td>
                    <td className={`py-2.5 text-right font-bold ${team.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {team.pnl >= 0 ? '+' : ''}₹{team.pnl.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-dim">No ranking performance recorded yet.</div>
        )}
      </div>

      {/* Match Calendar Timeline */}
      <div className="bg-surface card-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-gold" />
          Season Match Timeline
        </h3>
        
        {tourneyMatches.length > 0 ? (
          <div className="relative border-l border-white/[0.06] ml-3 pl-4.5 space-y-4 pt-1">
            {tourneyMatches.map((m) => (
              <div key={m.id} className="relative text-xs">
                {/* indicator dot */}
                <div className={`absolute -left-[23.5px] top-1 w-3.5 h-3.5 rounded-full border-2 bg-dark ${
                  m.status === 'live' ? 'border-loss animate-pulse' : m.status === 'finished' ? 'border-profit' : 'border-dim'
                }`} />
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-white/95">{m.team1.shortName} vs {m.team2.shortName}</h4>
                    <p className="text-[10px] text-dim mt-0.5">Venue: {m.venue}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      m.status === 'live' ? 'bg-loss/12 text-loss' : m.status === 'finished' ? 'bg-profit/12 text-profit' : 'bg-white/5 text-muted'
                    }`}>
                      {m.status}
                    </span>
                    <p className="text-[9px] text-dim mt-1">{dayjs(m.startTime).format('DD MMM, hh:mm A')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-dim">No matches listed for this tournament yet.</div>
        )}
      </div>

      {/* Trophy Room & Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Trophy Room */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-gold" />
              Trophy Room
            </h3>
            <p className="text-[9px] text-dim mt-0.5">Your achievements in {selectedTournament}</p>
          </div>

          <div className="space-y-2.5 mt-3">
            {trophies.map((trophy) => (
              <div key={trophy.title} className="p-3 bg-dark/30 border border-white/[0.02] rounded-lg flex items-center gap-3">
                <Trophy className={`w-6 h-6 shrink-0 ${trophy.iconColor}`} />
                <div className="text-xs">
                  <h4 className="font-bold text-white/90">{trophy.title}</h4>
                  <p className="text-[10px] text-dim leading-snug mt-0.5">{trophy.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Report Card */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple flex items-center gap-1.5">
              <Download className="w-4 h-4 text-purple" />
              Export Tournament Report
            </h3>
            <p className="text-xs text-muted leading-relaxed mt-1">
              Download the entire betting log, P&L metrics, and team performance stats for {selectedTournament} in CSV format for advanced analysis.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-3 bg-purple text-white font-extrabold text-xs rounded-xl hover:opacity-90 transition-opacity tap-effect flex items-center justify-center gap-1.5"
          >
            <Download className="w-4.5 h-4.5" />
            Download CSV Report
          </button>
        </div>
      </div>
    </div>
  );
}
