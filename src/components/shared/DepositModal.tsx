import { useState } from 'react';
import { useBetStore } from '../../store/betStore';
import Modal from './Modal';

export default function DepositModal() {
  const isOpen = useBetStore((s) => s.modals.deposit);
  const closeModal = useBetStore((s) => s.closeModal);
  const bankrolls = useBetStore((s) => s.bankrolls);
  const deposit = useBetStore((s) => s.deposit);

  const [formData, setFormData] = useState({
    bankrollId: '',
    amount: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankrollId || !formData.amount) return;

    deposit(formData.bankrollId, parseFloat(formData.amount));

    // Reset and close
    setFormData({ bankrollId: '', amount: '' });
    closeModal('deposit');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal('deposit')} title="Deposit Funds">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Bankroll Select */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            Select Bankroll
          </label>
          <select
            className="select-dark"
            value={formData.bankrollId}
            onChange={(e) => setFormData((f) => ({ ...f, bankrollId: e.target.value }))}
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
            Deposit Amount (₹)
          </label>
          <input
            type="number"
            className="input-dark"
            placeholder="e.g. 10000"
            value={formData.amount}
            onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
            min="100"
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full gradient-profit text-white font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity tap-effect glow-profit mt-2"
        >
          Confirm Deposit
        </button>
      </form>
    </Modal>
  );
}
