import { useState, useMemo } from 'react';
import { useBetStore } from '../../store/betStore';
import {
  Users,
  Plus,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Percent,
  TrendingDown,
  CircleDot,
  FileText,
  UserCheck,
  History,
  Info,
  Copy,
  PlusCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { formatCurrency, formatCurrencyWithSign } from '../../utils/utils';
import type { CircleBet, CircleTransaction } from '../../types/types';

export default function BettingCirclesDashboard() {
  const circles = useBetStore((s) => s.circles || []);
  const createCircle = useBetStore((s) => s.createCircle);
  const joinCircle = useBetStore((s) => s.joinCircle);
  const circleDeposit = useBetStore((s) => s.circleDeposit);
  const circleWithdraw = useBetStore((s) => s.circleWithdraw);
  const placeCircleBet = useBetStore((s) => s.placeCircleBet);
  const settleCircleBet = useBetStore((s) => s.settleCircleBet);
  const settleCircleBalances = useBetStore((s) => s.settleCircleBalances);
  const matches = useBetStore((s) => s.matches);
  const activeMatches = useMemo(() => (matches || []).filter((m) => m.status !== 'finished'), [matches]);

  // Active Circle selection
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null);

  // Search & Navigation tab states
  const [activeCircleTab, setActiveCircleTab] = useState<'analytics' | 'leaderboard' | 'bets' | 'transactions' | 'settlement'>('analytics');
  const [circleSearch, setCircleSearch] = useState('');
  
  // Create / Join Forms
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [isPrivate, setIsPrivate] = useState(true);

  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState(false);

  // In-circle Action Forms
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  const [groupBetForm, setGroupBetForm] = useState({
    matchId: '',
    selection: '',
    marketType: 'Match Winner',
    stake: '',
    odds: '',
  });
  const [groupBetError, setGroupBetError] = useState('');

  // Simulator State
  const [simName, setSimName] = useState('');

  // active circle derived object
  const activeCircle = useMemo(() => {
    return circles.find((c) => c.id === selectedCircleId);
  }, [circles, selectedCircleId]);

  // Filter circles
  const filteredCircles = useMemo(() => {
    return circles.filter((c) => c.name.toLowerCase().includes(circleSearch.toLowerCase()));
  }, [circles, circleSearch]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;
    createCircle(newCircleName.trim(), isPrivate);
    setNewCircleName('');
    setShowCreateForm(false);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess(false);
    if (!joinCode.trim()) return;

    const success = joinCircle(joinCode.trim());
    if (success) {
      setJoinSuccess(true);
      setJoinCode('');
      setTimeout(() => setJoinSuccess(false), 2000);
    } else {
      setJoinError('Invalid invite code. Try WHALES-99 or IPL-HR-2026.');
    }
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !depositAmount) return;
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    
    circleDeposit(activeCircle.id, 'Rahul (You)', amt);
    setDepositAmount('');
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !withdrawAmount) return;
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0 || activeCircle.pooledBalance < amt) {
      alert('Invalid withdrawal amount or insufficient circle pooled balance.');
      return;
    }
    
    circleWithdraw(activeCircle.id, 'Rahul (You)', amt);
    setWithdrawAmount('');
  };

  const handlePlaceGroupBetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGroupBetError('');
    if (!activeCircle) return;
    
    const stakeNum = parseFloat(groupBetForm.stake);
    const oddsNum = parseFloat(groupBetForm.odds);
    const match = matches.find(m => m.id === groupBetForm.matchId);
    
    if (!match) {
      setGroupBetError('Please select a valid match.');
      return;
    }
    if (isNaN(stakeNum) || stakeNum <= 0 || activeCircle.pooledBalance < stakeNum) {
      setGroupBetError('Invalid stake or insufficient pooled funds.');
      return;
    }
    if (isNaN(oddsNum) || oddsNum < 1.01) {
      setGroupBetError('Invalid odds.');
      return;
    }
    if (!groupBetForm.selection.trim()) {
      setGroupBetError('Please enter a selection.');
      return;
    }

    placeCircleBet(
      activeCircle.id,
      {
        matchId: groupBetForm.matchId,
        matchTitle: `${match.team1.shortName} vs ${match.team2.shortName}`,
        selection: groupBetForm.selection.trim(),
        marketType: groupBetForm.marketType,
        stake: stakeNum,
        odds: oddsNum,
      },
      'Rahul (You)',
    );

    setGroupBetForm({
      matchId: '',
      selection: '',
      marketType: 'Match Winner',
      stake: '',
      odds: '',
    });
  };

  const simulateMemberJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCircle || !simName.trim()) return;
    
    // Seed new member join via store
    useBetStore.setState((s) => ({
      circles: s.circles.map(c => {
        if (c.id === activeCircle.id) {
          const memberExists = c.members.some(m => m.name.toLowerCase() === simName.trim().toLowerCase());
          if (memberExists) return c;
          
          return {
            ...c,
            members: [
              ...c.members,
              {
                id: `m-${Date.now()}`,
                name: simName.trim(),
                contribution: 0,
                role: 'member' as const,
                joinedAt: new Date().toISOString()
              }
            ],
            transactions: [
              {
                id: `ctx-sim-${Date.now()}`,
                type: 'deposit',
                amount: 0,
                memberName: simName.trim(),
                timestamp: new Date().toISOString(),
                details: 'Joined circle'
              } as any,
              ...c.transactions
            ]
          };
        }
        return c;
      })
    }));

    setSimName('');
  };

  // derived metrics for active circle
  const stats = useMemo(() => {
    if (!activeCircle) return null;
    const settled = activeCircle.bets.filter(b => b.status === 'won' || b.status === 'lost');
    const totalBets = activeCircle.bets.length;
    const wonCount = settled.filter(b => b.status === 'won').length;
    const winRate = settled.length > 0 ? Math.round((wonCount / settled.length) * 100) : 0;
    
    const totalStake = settled.reduce((sum, b) => sum + b.stake, 0);
    const totalPnL = settled.reduce((sum, b) => sum + b.profitLoss, 0);
    const roi = totalStake > 0 ? Math.round((totalPnL / totalStake) * 100) : 0;

    return {
      winRate,
      roi,
      totalBets,
      totalPnL,
      runningCount: activeCircle.bets.filter(b => b.status === 'running').length
    };
  }, [activeCircle]);

  // Settlement Tracker math: who has deposited how much vs current share value
  const settlements = useMemo(() => {
    if (!activeCircle) return [];
    const totalContribution = activeCircle.members.reduce((sum, m) => sum + m.contribution, 0);
    return activeCircle.members.map(m => {
      // ratio of deposit
      const ratio = totalContribution > 0 ? m.contribution / totalContribution : 1 / activeCircle.members.length;
      const currentShare = activeCircle.pooledBalance * ratio;
      const netGain = currentShare - m.contribution;
      return {
        ...m,
        ratio,
        currentShare,
        netGain
      };
    });
  }, [activeCircle]);

  return (
    <div className="space-y-4">
      {!activeCircle ? (
        // CIRCLE DIRECTORY SCREEN
        <div className="space-y-4 animate-fade-in">
          {/* Create & Join Buttons Row */}
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setJoinError('');
              }}
              className="flex-1 bg-gold/[0.12] hover:bg-gold/[0.2] border border-gold/20 text-gold font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors tap-effect"
            >
              <Plus className="w-4 h-4" />
              Create Circle
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setJoinCode('');
              }}
              className="flex-1 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white/90 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors tap-effect"
            >
              <Users className="w-4 h-4 text-purple" />
              Join Circle
            </button>
          </div>

          {/* Join Circle Panel */}
          <div className="bg-surface card-border rounded-xl p-3.5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple">Join Private Circle</h3>
            <form onSubmit={handleJoin} className="flex gap-2">
              <input
                type="text"
                className="input-dark flex-1 text-xs"
                placeholder="Enter Invite Code (e.g. WHALES-99)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-purple text-white px-4 text-xs font-bold rounded-lg hover:opacity-90 transition-opacity tap-effect"
              >
                Join
              </button>
            </form>
            {joinError && <p className="text-[10px] text-loss font-semibold">{joinError}</p>}
            {joinSuccess && <p className="text-[10px] text-profit font-semibold flex items-center gap-1">✔ Successfully joined circle!</p>}
          </div>

          {/* Create Circle Form */}
          {showCreateForm && (
            <form onSubmit={handleCreate} className="bg-surface card-border rounded-xl p-4 space-y-3 animate-slide-up">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gold">Create New Circle</h3>
              <div>
                <label className="text-[10px] text-dim uppercase block mb-1">Circle Name</label>
                <input
                  type="text"
                  className="input-dark w-full text-xs"
                  placeholder="e.g. IPL Whales"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  required
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="circle-privacy"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded bg-dark border-white/10 text-gold focus:ring-0"
                />
                <label htmlFor="circle-privacy" className="text-xs text-muted font-medium cursor-pointer">
                  Private circle (require invite code to join)
                </label>
              </div>
              <button
                type="submit"
                className="w-full gradient-gold text-dark font-extrabold text-xs py-2.5 rounded-lg hover:opacity-95 tap-effect"
              >
                Launch Circle
              </button>
            </form>
          )}

          {/* Search Circles */}
          <div className="relative">
            <input
              type="text"
              className="input-dark w-full pr-3 py-2 text-xs"
              placeholder="Search circles..."
              value={circleSearch}
              onChange={(e) => setCircleSearch(e.target.value)}
            />
          </div>

          {/* Circles list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCircles.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCircleId(c.id)}
                className="bg-surface card-border rounded-xl p-4 hover:bg-surface-light cursor-pointer transition-colors space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white/95 truncate">{c.name}</h3>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      c.isPrivate ? 'bg-purple/12 text-purple' : 'bg-profit/12 text-profit'
                    }`}>
                      {c.isPrivate ? 'PRIVATE' : 'PUBLIC'}
                    </span>
                  </div>
                  <p className="text-[10px] text-dim mt-0.5 font-bold">Code: {c.inviteCode}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] mt-2">
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-muted" />
                    {c.members.length} members
                  </span>
                  <span className="text-xs font-extrabold text-gold">
                    ₹{c.pooledBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // INDIVIDUAL CIRCLE DASHBOARD VIEW
        <div className="space-y-4 animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.04]">
            <button
              onClick={() => setSelectedCircleId(null)}
              className="w-8 h-8 rounded-xl bg-surface card-border flex items-center justify-center hover:bg-surface-light transition-colors tap-effect"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <div className="text-center flex-1 pr-8">
              <h2 className="text-sm font-bold text-white/90">{activeCircle.name}</h2>
              <p className="text-[10px] text-dim uppercase tracking-wider font-bold">Pooled Betting Circle</p>
            </div>
          </div>

          {/* Quick Circle info strip */}
          <div className="bg-surface card-border rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-[10px] text-dim block uppercase font-bold">Invite Code</span>
              <span className="font-mono font-bold text-white flex items-center gap-1 mt-0.5">
                {activeCircle.inviteCode}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeCircle.inviteCode);
                    alert('Invite code copied!');
                  }}
                  className="hover:text-gold"
                  title="Copy Code"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-dim block uppercase font-bold">Pooled Balance</span>
              <span className="text-sm font-black text-gold">₹{activeCircle.pooledBalance.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Tab switches */}
          <div className="flex gap-1 bg-surface card-border rounded-xl p-1 overflow-x-auto hide-scrollbar">
            {(['analytics', 'leaderboard', 'bets', 'transactions', 'settlement'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCircleTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase transition-all duration-200 shrink-0 ${
                  activeCircleTab === tab
                    ? 'bg-surface-light text-white shadow-sm border border-white/[0.03]'
                    : 'text-dim hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* TAB 1: ANALYTICS */}
          {activeCircleTab === 'analytics' && stats && (
            <div className="space-y-4 animate-slide-up">
              {/* Analytics stats boxes */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface card-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <span className="text-[9px] text-dim block uppercase font-bold">Circle ROI</span>
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
                    <CircleDot className="w-4 h-4 text-muted" />
                  </div>
                  <div>
                    <span className="text-[9px] text-dim block uppercase font-bold">Total Bets</span>
                    <span className="text-sm font-extrabold text-white/90">
                      {stats.totalBets} <span className="text-[10px] text-dim">({stats.runningCount} run)</span>
                    </span>
                  </div>
                </div>

                <div className="bg-surface card-border rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center shrink-0">
                    <DollarSign className="w-4 h-4 text-profit" />
                  </div>
                  <div>
                    <span className="text-[9px] text-dim block uppercase font-bold">Circle PnL</span>
                    <span className={`text-sm font-bold ${stats.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {formatCurrencyWithSign(stats.totalPnL)}
                    </span>
                  </div>
                </div>
              </div>

              {/* In-circle Deposit & Withdraw buttons */}
              <div className="bg-surface card-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Deposit form */}
                <form onSubmit={handleDepositSubmit} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-profit">Contribute Funds (Deposit)</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input-dark flex-1 text-xs"
                      placeholder="Amount (₹)"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="bg-profit/15 text-profit border border-profit/20 px-3.5 text-xs font-bold rounded-lg hover:bg-profit/25 transition-colors tap-effect"
                    >
                      Deposit
                    </button>
                  </div>
                </form>

                {/* Withdraw form */}
                <form onSubmit={handleWithdrawSubmit} className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-loss">Withdraw Contribution</h4>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      className="input-dark flex-1 text-xs"
                      placeholder="Amount (₹)"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      required
                    />
                    <button
                      type="submit"
                      className="bg-loss/15 text-loss border border-loss/20 px-3.5 text-xs font-bold rounded-lg hover:bg-loss/25 transition-colors tap-effect"
                    >
                      Withdraw
                    </button>
                  </div>
                </form>
              </div>

              {/* Invite simulated member */}
              <div className="bg-surface card-border rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Simulate New Member Joining
                </h4>
                <form onSubmit={simulateMemberJoin} className="flex gap-2">
                  <input
                    type="text"
                    className="input-dark flex-1 text-xs"
                    placeholder="Enter Friend's Name (e.g. Suresh, Vikram)"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gold text-dark px-4 text-xs font-extrabold rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Invite
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: LEADERBOARD */}
          {activeCircleTab === 'leaderboard' && (
            <div className="bg-surface card-border rounded-xl p-4 space-y-3 animate-slide-up">
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple">Member Stats & Leaderboard</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[9px] text-dim uppercase font-bold tracking-wider">
                      <th className="py-2">Member</th>
                      <th className="py-2 text-right">Contribution</th>
                      <th className="py-2 text-right">Pooled Share</th>
                      <th className="py-2 text-right">Net Gain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((member) => (
                      <tr key={member.id} className="border-b border-white/[0.02] hover:bg-white/[0.01]">
                        <td className="py-3 font-semibold text-white/90">
                          {member.name}
                          {member.role === 'admin' && (
                            <span className="text-[9px] text-gold bg-gold/10 px-1.5 py-0.5 rounded-md ml-1.5 font-bold uppercase">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right text-white/70">₹{member.contribution.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right text-white font-bold">₹{Math.round(member.currentShare).toLocaleString('en-IN')}</td>
                        <td className={`py-3 text-right font-bold ${member.netGain >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {member.netGain >= 0 ? '+' : ''}₹{Math.round(member.netGain).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: GROUP BET LOGS */}
          {activeCircleTab === 'bets' && (
            <div className="space-y-4 animate-slide-up">
              {/* Place Group Bet Form */}
              <form onSubmit={handlePlaceGroupBetSubmit} className="bg-surface card-border rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gold flex items-center gap-1">
                  <PlusCircle className="w-4 h-4" />
                  Place Bet using Pooled Balance
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-dim uppercase block mb-1">Match</label>
                    <select
                      className="select-dark text-xs"
                      value={groupBetForm.matchId}
                      onChange={(e) => setGroupBetForm({ ...groupBetForm, matchId: e.target.value })}
                      required
                    >
                      <option value="">Select Match</option>
                      {activeMatches.map(m => (
                        <option key={m.id} value={m.id}>{m.team1.shortName} vs {m.team2.shortName}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-dim uppercase block mb-1">Market Type</label>
                    <select
                      className="select-dark text-xs"
                      value={groupBetForm.marketType}
                      onChange={(e) => setGroupBetForm({ ...groupBetForm, marketType: e.target.value })}
                    >
                      <option value="Match Winner">Match Winner</option>
                      <option value="Session Betting">Session Betting</option>
                      <option value="Top Batter">Top Batter</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] text-dim uppercase block mb-1">Selection</label>
                  <input
                    type="text"
                    className="input-dark w-full text-xs"
                    placeholder="e.g. Mumbai Indians, Virat Kohli"
                    value={groupBetForm.selection}
                    onChange={(e) => setGroupBetForm({ ...groupBetForm, selection: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-dim uppercase block mb-1">Stake (₹)</label>
                    <input
                      type="number"
                      className="input-dark text-xs"
                      placeholder="Stake"
                      value={groupBetForm.stake}
                      onChange={(e) => setGroupBetForm({ ...groupBetForm, stake: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-dim uppercase block mb-1">Odds</label>
                    <input
                      type="number"
                      className="input-dark text-xs"
                      step="0.01"
                      placeholder="Odds"
                      value={groupBetForm.odds}
                      onChange={(e) => setGroupBetForm({ ...groupBetForm, odds: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {groupBetError && <p className="text-xs text-loss font-semibold">{groupBetError}</p>}
                
                <button
                  type="submit"
                  className="w-full gradient-gold text-dark font-extrabold text-xs py-2.5 rounded-lg hover:opacity-90 transition-opacity"
                >
                  Place Group Bet
                </button>
              </form>

              {/* Group Bets History List */}
              <div className="bg-surface card-border rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Group Betting Log ({activeCircle.bets.length})</h3>

                {activeCircle.bets.length > 0 ? (
                  <div className="space-y-3">
                    {activeCircle.bets.map((bet) => (
                      <div key={bet.id} className="p-3 bg-dark/40 border border-white/[0.03] rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-white">{bet.matchTitle}</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded uppercase tracking-wider ${
                            bet.status === 'won'
                              ? 'bg-profit/12 text-profit'
                              : bet.status === 'lost'
                                ? 'bg-loss/12 text-loss'
                                : 'bg-gold/12 text-gold'
                          }`}>
                            {bet.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted">
                          <span>{bet.marketType}: <strong className="text-white/90">{bet.selection}</strong></span>
                          <span>Stake: <strong className="text-white/90">₹{bet.stake.toLocaleString('en-IN')}</strong> @ {bet.odds.toFixed(2)}</span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[10px] text-dim border-t border-white/[0.02] pt-2">
                          <span>Placed by: <strong className="text-gold">{bet.placedBy}</strong></span>
                          {bet.status !== 'running' && (
                            <span className={`font-bold ${bet.profitLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {bet.profitLoss >= 0 ? '+' : ''}₹{bet.profitLoss.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>

                        {/* Quick Settle Actions for admin testing */}
                        {bet.status === 'running' && (
                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => settleCircleBet(activeCircle.id, bet.id, 'won')}
                              className="px-2 py-0.5 rounded bg-profit/10 text-profit border border-profit/20 text-[9px] font-bold"
                            >
                              Settle Won
                            </button>
                            <button
                              onClick={() => settleCircleBet(activeCircle.id, bet.id, 'lost')}
                              className="px-2 py-0.5 rounded bg-loss/10 text-loss border border-loss/20 text-[9px] font-bold"
                            >
                              Settle Lost
                            </button>
                            <button
                              onClick={() => settleCircleBet(activeCircle.id, bet.id, 'void')}
                              className="px-2 py-0.5 rounded bg-white/5 text-muted border border-white/10 text-[9px] font-bold"
                            >
                              Void
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-xs text-dim">No group bets placed yet.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: GROUP TRANSACTIONS */}
          {activeCircleTab === 'transactions' && (
            <div className="bg-surface card-border rounded-xl p-4 space-y-3 animate-slide-up">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/90">Group Transaction History</h3>
              {activeCircle.transactions.length > 0 ? (
                <div className="space-y-2.5">
                  {activeCircle.transactions.map((tx: any) => (
                    <div key={tx.id} className="p-2.5 bg-dark/30 border border-white/[0.02] rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white/90">{tx.memberName}</p>
                        <p className="text-[9px] text-dim mt-0.5">{tx.details || 'Pooled transaction'}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold uppercase ${
                          tx.type === 'deposit' ? 'text-profit' : tx.type === 'withdrawal' ? 'text-loss' : 'text-purple'
                        }`}>
                          {tx.type}
                        </span>
                        <p className="font-mono font-bold text-white/90 mt-0.5">
                          {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-xs text-dim">No transactions logged yet.</div>
              )}
            </div>
          )}

          {/* TAB 5: SETTLEMENT TRACKER */}
          {activeCircleTab === 'settlement' && (
            <div className="bg-surface card-border rounded-xl p-4 space-y-4 animate-slide-up">
              <div className="flex items-start gap-2.5 bg-purple/10 border border-purple/20 rounded-lg p-3">
                <Info className="w-5 h-5 text-purple shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white">Settlement & Cash-out Calculations</p>
                  <p className="text-dim leading-snug mt-1">
                    Calculates payout values proportionally based on contributions to settle balances when circle is closed.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {settlements.map((m) => {
                  return (
                    <div key={m.id} className="p-3 bg-dark/40 border border-white/[0.03] rounded-lg space-y-1 text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">{m.name}</span>
                        <span className={`font-mono ${m.netGain >= 0 ? 'text-profit' : 'text-loss'}`}>
                          {m.netGain >= 0 ? 'Gets Payout: ' : 'Owes: '}
                          ₹{Math.abs(Math.round(m.currentShare)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-dim font-semibold">
                        <span>Deposited: ₹{m.contribution.toLocaleString('en-IN')}</span>
                        <span>Pool Ratio: {(m.ratio * 100).toFixed(0)}%</span>
                        <span>Net ROI: {m.contribution > 0 ? ((m.netGain / m.contribution) * 100).toFixed(0) : '0'}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Settlement distribution button */}
              {activeCircle.pooledBalance > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('Distribute all pool balances and settle the circle balances? This will withdraw shares to members.')) {
                      settleCircleBalances(activeCircle.id);
                      alert('Balances distributed and contributions reset!');
                    }
                  }}
                  className="w-full py-3 bg-purple text-white font-extrabold text-xs rounded-xl hover:opacity-90 transition-opacity tap-effect flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Distribute Circle Payouts (Settle Up)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
