import { ArrowDownToLine, ArrowUpFromLine, ShieldCheck } from 'lucide-react';
import { useBetStore, selectTotalBalance, selectTotalExposure } from '../../store/betStore';
import { formatCurrency } from '../../utils/utils';
import BankrollDetailCard from './BankrollDetailCard';

export default function BankrollScreen() {
  const bankrolls = useBetStore((s) => s.bankrolls);
  const totalBalance = useBetStore(selectTotalBalance);
  const totalExposure = useBetStore(selectTotalExposure);
  const totalDeposits = bankrolls.reduce((s, b) => s + b.totalDeposits, 0);
  const totalWithdrawals = bankrolls.reduce((s, b) => s + b.totalWithdrawals, 0);
  const openModal = useBetStore((s) => s.openModal);

  return (
    <div className="px-4 py-4 w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 lg:gap-8">
      <div className="space-y-4">
        {/* Header */}
        <div
          className="animate-slide-up"
          style={{ opacity: 0 }}
        >
          <h2 className="text-lg font-bold">Bankroll</h2>
          <p className="text-xs text-muted mt-0.5">Manage your funds</p>
        </div>

        {/* Overview card */}
        <div
          className="gradient-hero card-border rounded-xl p-4 relative overflow-hidden animate-slide-up stagger-1"
          style={{ opacity: 0 }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-gold/[0.04] rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <div>
              <p className="text-[10px] text-dim uppercase tracking-wider">Total Balance</p>
              <p className="text-xl font-bold mt-0.5">{formatCurrency(totalBalance)}</p>
            </div>
            <div>
              <p className="text-[10px] text-dim uppercase tracking-wider">Active Exposure</p>
              <p className="text-xl font-bold text-gold mt-0.5">
                {formatCurrency(totalExposure)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-dim uppercase tracking-wider">Total Deposits</p>
              <p className="text-sm font-semibold text-profit mt-0.5">
                {formatCurrency(totalDeposits)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-dim uppercase tracking-wider">Total Withdrawals</p>
              <p className="text-sm font-semibold text-muted mt-0.5">
                {formatCurrency(totalWithdrawals)}
              </p>
            </div>
          </div>
        </div>

        {/* Quick action buttons */}
        <div
          className="grid grid-cols-3 gap-2.5 animate-slide-up stagger-2"
          style={{ opacity: 0 }}
        >
          <button
            onClick={() => openModal('deposit')}
            className="bg-surface card-border rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-surface-light transition-all tap-effect"
          >
            <ArrowDownToLine className="w-4.5 h-4.5 text-profit" />
            <span className="text-[10px] text-muted font-medium">Deposit</span>
          </button>
          <button
            onClick={() => openModal('withdraw')}
            className="bg-surface card-border rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-surface-light transition-all tap-effect"
          >
            <ArrowUpFromLine className="w-4.5 h-4.5 text-purple" />
            <span className="text-[10px] text-muted font-medium">Withdraw</span>
          </button>
          <button
            onClick={() => openModal('setLimit')}
            className="bg-surface card-border rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-surface-light transition-all tap-effect"
          >
            <ShieldCheck className="w-4.5 h-4.5 text-gold" />
            <span className="text-[10px] text-muted font-medium">Set Limit</span>
          </button>
        </div>
      </div>

      {/* Individual bankrolls */}
      <div className="space-y-3">
        <h3
          className="text-sm font-semibold animate-slide-up stagger-3"
          style={{ opacity: 0 }}
        >
          Your Bankrolls ({bankrolls.length})
        </h3>
        <div className="space-y-3">
          {bankrolls.map((bankroll, i) => (
            <div
              key={bankroll.id}
              className="animate-slide-up"
              style={{ opacity: 0, animationDelay: `${0.15 + i * 0.08}s` }}
            >
              <BankrollDetailCard bankroll={bankroll} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
