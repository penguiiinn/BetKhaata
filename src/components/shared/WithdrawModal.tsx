import { useState } from 'react';
import { useBetStore } from '../../store/betStore';
import Modal from './Modal';

export default function WithdrawModal() {
  const isOpen = useBetStore((s) => s.modals.withdraw);
  const closeModal = useBetStore((s) => s.closeModal);
  const bankrolls = useBetStore((s) => s.bankrolls);
  const withdraw = useBetStore((s) => s.withdraw);

  const [formData, setFormData] = useState({
    bankrollId: '',
    amount: '',
  });
  const [error, setError] = useState('');

  const selectedBankroll = bankrolls.find((b) => b.id === formData.bankrollId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankrollId || !formData.amount) return;

    const amountNum = parseFloat(formData.amount);

    if (selectedBankroll && amountNum > selectedBankroll.balance) {
      setError(`Insufficient balance. Available: ₹${selectedBankroll.balance.toLocaleString('en-IN')}`);
      return;
    }

    withdraw(formData.bankrollId, amountNum);

    // Reset and close
    setFormData({ bankrollId: '', amount: '' });
    setError('');
    closeModal('withdraw');
  };

  const handleBankrollChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((f) => ({ ...f, bankrollId: e.target.value }));
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal('withdraw')} title="Withdraw Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bankroll Select */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Select Bankroll
          </label>
          <select
            className="select-dark"
            value={formData.bankrollId}
            onChange={handleBankrollChange}
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

        {/* Amount */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Withdrawal Amount (₹)
          </label>
          <input
            type="number"
            className="input-dark"
            placeholder="e.g. 5000"
            value={formData.amount}
            onChange={(e) => {
              setFormData((f) => ({ ...f, amount: e.target.value }));
              setError('');
            }}
            min="100"
            required
          />
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
          className="w-full bg-gradient-to-r from-purple/80 to-purple text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity tap-effect mt-2"
        >
          Confirm Withdrawal
        </button>
      </form>
    </Modal>
  );
}
