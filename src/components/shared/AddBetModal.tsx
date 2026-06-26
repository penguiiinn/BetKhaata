import { useState, useMemo } from 'react';
import { useBetStore } from '../../store/betStore';
import { MARKET_TYPES } from '../../types/types';
import type { MarketType, MatchFormat } from '../../types/types';
import { validateBetInput } from '../../utils/utils';
import Modal from './Modal';

export default function AddBetModal() {
  const isOpen = useBetStore((s) => s.modals.addBet);
  const closeModal = useBetStore((s) => s.closeModal);
  const addBet = useBetStore((s) => s.addBet);
  const matches = useBetStore((s) => s.matches);
  const bankrolls = useBetStore((s) => s.bankrolls);
  const selectedMatchId = useBetStore((s) => s.selectedMatchId);
  const setSelectedMatchId = useBetStore((s) => s.setSelectedMatchId);

  const activeMatches = useMemo(
    () => matches.filter((m) => m.status !== 'finished'),
    [matches],
  );

  const [formData, setFormData] = useState({
    matchId: '',
    marketType: 'Match Winner' as MarketType,
    selection: '',
    stake: '',
    odds: '',
    bankrollId: '',
  });
  const [error, setError] = useState('');

  // Pre-fill match if selected from match card
  const effectiveMatchId = formData.matchId || selectedMatchId || '';

  const selectedMatch = matches.find((m) => m.id === effectiveMatchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchId = effectiveMatchId;
    const match = matches.find((m) => m.id === matchId);
    if (!match || !formData.bankrollId) {
      setError('Please select a match and bankroll.');
      return;
    }

    const stakeNum = parseFloat(formData.stake);
    const oddsNum = parseFloat(formData.odds);
    const bankroll = bankrolls.find((b) => b.id === formData.bankrollId);

    // Use centralized validation
    const validationError = validateBetInput(
      stakeNum,
      oddsNum,
      formData.selection,
      bankroll?.balance ?? 0,
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    addBet({
      matchId,
      matchTitle: `${match.team1.shortName} vs ${match.team2.shortName}`,
      tournament: match.tournament,
      format: match.format as MatchFormat,
      marketType: formData.marketType,
      selection: formData.selection.trim(),
      stake: stakeNum,
      odds: oddsNum,
      timePlaced: new Date().toISOString(),
      status: 'running',
      profitLoss: 0,
      bankrollId: formData.bankrollId,
    });

    // Reset & close
    setFormData({
      matchId: '',
      marketType: 'Match Winner',
      selection: '',
      stake: '',
      odds: '',
      bankrollId: '',
    });
    setError('');
    setSelectedMatchId(null);
    closeModal('addBet');
  };

  const handleClose = () => {
    setError('');
    setSelectedMatchId(null);
    closeModal('addBet');
  };

  const potentialReturn =
    formData.stake && formData.odds
      ? (parseFloat(formData.stake) * parseFloat(formData.odds)).toFixed(0)
      : '0';

  const potentialProfit =
    formData.stake && formData.odds
      ? (parseFloat(formData.stake) * (parseFloat(formData.odds) - 1)).toFixed(0)
      : '0';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Bet">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Match Select */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Match
          </label>
          <select
            className="select-dark"
            value={effectiveMatchId}
            onChange={(e) => {
              setFormData((f) => ({ ...f, matchId: e.target.value }));
              setError('');
            }}
            required
          >
            <option value="">Select match</option>
            {activeMatches.map((m) => (
              <option key={m.id} value={m.id}>
                {m.team1.shortName} vs {m.team2.shortName} – {m.tournament}
                {m.status === 'live' ? ' 🔴' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Market Type */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Market Type
          </label>
          <select
            className="select-dark"
            value={formData.marketType}
            onChange={(e) => {
              setFormData((f) => ({ ...f, marketType: e.target.value as MarketType }));
              setError('');
            }}
          >
            {MARKET_TYPES.map((mt) => (
              <option key={mt} value={mt}>
                {mt}
              </option>
            ))}
          </select>
        </div>

        {/* Selection */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Selection
          </label>
          <input
            type="text"
            className="input-dark"
            placeholder="e.g. Chennai Super Kings, Virat Kohli"
            value={formData.selection}
            onChange={(e) => {
              setFormData((f) => ({ ...f, selection: e.target.value }));
              setError('');
            }}
            required
          />
        </div>

        {/* Stake & Odds */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
              Stake (₹)
            </label>
            <input
              type="number"
              className="input-dark"
              placeholder="5000"
              value={formData.stake}
              onChange={(e) => {
                setFormData((f) => ({ ...f, stake: e.target.value }));
                setError('');
              }}
              min="1"
              required
            />
          </div>
          <div>
            <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
              Odds
            </label>
            <input
              type="number"
              className="input-dark"
              placeholder="1.85"
              value={formData.odds}
              onChange={(e) => {
                setFormData((f) => ({ ...f, odds: e.target.value }));
                setError('');
              }}
              min="1.01"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Potential return preview */}
        {formData.stake && formData.odds && (
          <div className="bg-profit/[0.08] border border-profit/20 rounded-xl px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-muted">Potential Return</span>
              <span className="text-sm font-bold text-profit">
                ₹{parseInt(potentialReturn).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[11px] text-muted">Potential Profit</span>
              <span className="text-xs font-semibold text-profit">
                +₹{parseInt(potentialProfit).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}

        {/* Bankroll */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Bankroll
          </label>
          <select
            className="select-dark"
            value={formData.bankrollId}
            onChange={(e) => {
              setFormData((f) => ({ ...f, bankrollId: e.target.value }));
              setError('');
            }}
            required
          >
            <option value="">Select bankroll</option>
            {bankrolls.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} – ₹{b.balance.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        {/* Error message */}
        {error && (
          <p className="text-xs text-loss font-medium bg-loss/[0.08] border border-loss/20 rounded-xl px-4.5 py-3">
            {error}
          </p>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full gradient-gold text-dark font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity tap-effect glow-gold"
        >
          Place Bet
        </button>
      </form>
    </Modal>
  );
}
