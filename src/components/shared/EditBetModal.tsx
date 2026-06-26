import { useState, useEffect } from 'react';
import { useBetStore } from '../../store/betStore';
import type { MarketType } from '../../types/types';
import { MARKET_TYPES } from '../../types/types';
import { validateBetInput } from '../../utils/utils';
import Modal from './Modal';

export default function EditBetModal() {
  const editBetId = useBetStore((s) => s.editBetId);
  const setEditBetId = useBetStore((s) => s.setEditBetId);
  const editBet = useBetStore((s) => s.editBet);
  const bets = useBetStore((s) => s.bets);
  const bankrolls = useBetStore((s) => s.bankrolls);

  const bet = bets.find((b) => b.id === editBetId);

  const [formData, setFormData] = useState({
    selection: '',
    stake: '',
    odds: '',
    marketType: 'Match Winner' as MarketType,
  });
  const [error, setError] = useState('');

  // Sync form when bet changes
  useEffect(() => {
    if (bet) {
      setFormData({
        selection: bet.selection,
        stake: bet.stake.toString(),
        odds: bet.odds.toString(),
        marketType: bet.marketType,
      });
      setError('');
    }
  }, [bet]);

  if (!editBetId || !bet) return null;

  const bankroll = bankrolls.find((b) => b.id === bet.bankrollId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newStake = parseFloat(formData.stake);
    const newOdds = parseFloat(formData.odds);

    // Using centralized validation. Since the bet is already running,
    // the available balance is the current bankroll balance plus the bet's original stake.
    const availableBalance = (bankroll?.balance ?? 0) + bet.stake;
    const validationError = validateBetInput(
      newStake,
      newOdds,
      formData.selection,
      availableBalance,
    );

    if (validationError) {
      setError(validationError);
      return;
    }

    editBet(bet.id, {
      selection: formData.selection.trim(),
      stake: newStake,
      odds: newOdds,
      marketType: formData.marketType,
    });

    setEditBetId(null);
  };

  const handleClose = () => {
    setError('');
    setEditBetId(null);
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
    <Modal isOpen={!!editBetId} onClose={handleClose} title="Edit Bet">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Match (read-only) */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Match
          </label>
          <div className="input-dark opacity-60 cursor-not-allowed">
            {bet.matchTitle}
          </div>
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
          Save Changes
        </button>
      </form>
    </Modal>
  );
}
