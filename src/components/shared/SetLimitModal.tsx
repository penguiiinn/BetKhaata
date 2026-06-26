import { useState } from 'react';
import { useBetStore } from '../../store/betStore';
import Modal from './Modal';

export default function SetLimitModal() {
  const isOpen = useBetStore((s) => s.modals.setLimit);
  const closeModal = useBetStore((s) => s.closeModal);
  const bankrolls = useBetStore((s) => s.bankrolls);
  const setLimit = useBetStore((s) => s.setLimit);

  const [formData, setFormData] = useState({
    bankrollId: '',
    limit: '',
  });

  const selectedBankroll = bankrolls.find((b) => b.id === formData.bankrollId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankrollId || !formData.limit) return;

    setLimit(formData.bankrollId, parseFloat(formData.limit));

    // Reset and close
    setFormData({ bankrollId: '', limit: '' });
    closeModal('setLimit');
  };

  return (
    <Modal isOpen={isOpen} onClose={() => closeModal('setLimit')} title="Set Betting Limit">
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
                {b.name} – Current Daily Limit: ₹{b.limits.daily.toLocaleString('en-IN')}
              </option>
            ))}
          </select>
        </div>

        {/* Limit */}
        <div>
          <label className="text-[11px] text-muted font-medium uppercase tracking-wider block mb-1.5">
            New Daily Limit (₹)
          </label>
          <input
            type="number"
            className="input-dark"
            placeholder="e.g. 25000"
            value={formData.limit}
            onChange={(e) => setFormData((f) => ({ ...f, limit: e.target.value }))}
            min="1000"
            required
          />
          <p className="text-[10px] text-dim mt-1.5">
            Setting a limit helps track your daily usage indicator on the bankroll card.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full gradient-gold text-dark font-bold text-sm py-3.5 rounded-xl hover:opacity-90 transition-opacity tap-effect glow-gold mt-2"
        >
          Update Limit
        </button>
      </form>
    </Modal>
  );
}
