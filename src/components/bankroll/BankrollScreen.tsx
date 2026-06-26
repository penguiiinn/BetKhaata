import { useState, useMemo, useRef } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck,
  Search,
  Download,
  Upload,
  RotateCcw,
  History,
  TrendingUp,
  TrendingDown,
  Flame,
  X,
  AlertTriangle,
  Wallet,
} from 'lucide-react';
import { useBetStore, selectTotalBalance, selectTotalExposure, selectAnalytics } from '../../store/betStore';
import { formatCurrency, formatCurrencyWithSign } from '../../utils/utils';
import BankrollDetailCard from './BankrollDetailCard';
import dayjs from 'dayjs';

export default function BankrollScreen() {
  const bankrolls = useBetStore((s) => s.bankrolls || []);
  const totalBalance = useBetStore(selectTotalBalance);
  const totalExposure = useBetStore(selectTotalExposure);
  const transactions = useBetStore((s) => s.transactions || []);
  const openModal = useBetStore((s) => s.openModal);
  const resetAllData = useBetStore((s) => s.resetAllData);
  const importBackup = useBetStore((s) => s.importBackup);
  const analytics = useBetStore(selectAnalytics);

  const totalDeposits = bankrolls.reduce((sum, b) => sum + (b.totalDeposits || 0), 0);
  const totalWithdrawals = bankrolls.reduce((sum, b) => sum + (b.totalWithdrawals || 0), 0);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week'>('all');

  // Backup / Reset State
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map bankroll name by ID
  const getBankrollName = (bankrollId: string) => {
    return bankrolls.find((b) => b.id === bankrollId)?.name || 'Main Wallet';
  };

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      if (!tx) return false;
      const bName = getBankrollName(tx.bankrollId).toLowerCase();
      const amountStr = tx.amount.toString();
      const note = (tx.note || '').toLowerCase();
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        bName.includes(search) ||
        amountStr.includes(search) ||
        note.includes(search) ||
        tx.type.toLowerCase().includes(search);

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;

      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = dayjs(tx.timestamp).isSame(dayjs(), 'day');
      } else if (dateFilter === 'week') {
        matchesDate = dayjs(tx.timestamp).isAfter(dayjs().subtract(7, 'day'));
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [transactions, searchTerm, typeFilter, dateFilter, bankrolls]);

  const handleBackup = () => {
    try {
      const state = useBetStore.getState();
      const backupData = {
        bets: state.bets,
        matches: state.matches,
        bankrolls: state.bankrolls,
        transactions: state.transactions,
        bankrollHistory: state.bankrollHistory,
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `betkhaata-backup-${dayjs().format('YYYY-MM-DD-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to generate backup.');
    }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const success = importBackup(parsed);
        if (success) {
          alert('Backup restored successfully!');
        } else {
          alert('Failed to restore backup. Please ensure the file schema is correct.');
        }
      } catch (err) {
        alert('Invalid JSON file. Failed to parse.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Reset file input
  };

  const handleResetConfirm = () => {
    if (resetConfirm === 'RESET') {
      resetAllData();
      setShowResetModal(false);
      setResetConfirm('');
      alert('All data has been reset to default mock values.');
    } else {
      alert('Please type "RESET" exactly to confirm.');
    }
  };

  return (
    <div className="px-4 py-4 w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      
      {/* LEFT COLUMN: Overview & Quick Actions & Data Settings */}
      <div className="space-y-4 lg:col-span-1">
        <div>
          <h2 className="text-lg font-bold">Bankroll Center</h2>
          <p className="text-xs text-muted mt-0.5">Manage funds, view history, and secure data</p>
        </div>

        {/* Premium Revamped Summary Card */}
        <div className="gradient-hero card-border rounded-2xl p-5 relative overflow-hidden shadow-lg border-white/[0.08]">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-gold/[0.05] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple/[0.05] rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] text-dim uppercase tracking-wider font-semibold">Total Balance</p>
                <p className="text-2xl font-black mt-0.5 text-white tracking-tight">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-dim uppercase tracking-wider font-semibold">Total Net P&L</span>
                <div className={`flex items-center gap-1 mt-1 text-xs font-bold ${analytics.totalPnL >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {analytics.totalPnL >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>{formatCurrencyWithSign(analytics.totalPnL)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-white/[0.04]">
              <div>
                <p className="text-[9px] text-dim uppercase tracking-wider">Exposure</p>
                <p className="text-xs font-bold text-gold mt-0.5">
                  {formatCurrency(totalExposure, true)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-dim uppercase tracking-wider">Deposits</p>
                <p className="text-xs font-semibold text-profit mt-0.5">
                  {formatCurrency(totalDeposits, true)}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-dim uppercase tracking-wider">Withdraws</p>
                <p className="text-xs font-semibold text-muted mt-0.5">
                  {formatCurrency(totalWithdrawals, true)}
                </p>
              </div>
            </div>

            {/* Streak Indicator */}
            {analytics.currentStreakLength > 0 && (
              <div className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                analytics.currentStreakType === 'win'
                  ? 'bg-profit/[0.04] border-profit/10 text-profit'
                  : 'bg-loss/[0.04] border-loss/10 text-loss'
              }`}>
                <Flame className={`w-4 h-4 ${analytics.currentStreakType === 'win' ? 'animate-pulse' : ''}`} />
                <span className="text-[11px] font-bold">
                  On a {analytics.currentStreakLength}-bet {analytics.currentStreakType === 'win' ? 'winning' : 'losing'} streak!
                  {analytics.currentStreakType === 'win' ? ' Keep it up! 🔥' : ' Stay disciplined! ❄️'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={() => openModal('deposit')}
            className="bg-surface card-border rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-surface-light hover:border-white/[0.12] transition-all duration-200 tap-effect"
          >
            <div className="w-8 h-8 rounded-lg bg-profit/10 flex items-center justify-center">
              <ArrowDownToLine className="w-4.5 h-4.5 text-profit" />
            </div>
            <span className="text-[10px] text-muted font-bold">Deposit</span>
          </button>
          <button
            onClick={() => openModal('withdraw')}
            className="bg-surface card-border rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-surface-light hover:border-white/[0.12] transition-all duration-200 tap-effect"
          >
            <div className="w-8 h-8 rounded-lg bg-purple/10 flex items-center justify-center">
              <ArrowUpFromLine className="w-4.5 h-4.5 text-purple" />
            </div>
            <span className="text-[10px] text-muted font-bold">Withdraw</span>
          </button>
          <button
            onClick={() => openModal('setLimit')}
            className="bg-surface card-border rounded-xl py-3 flex flex-col items-center gap-1.5 hover:bg-surface-light hover:border-white/[0.12] transition-all duration-200 tap-effect"
          >
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
              <ShieldCheck className="w-4.5 h-4.5 text-gold" />
            </div>
            <span className="text-[10px] text-muted font-bold">Set Limit</span>
          </button>
        </div>

        {/* Data Safety (Backup/Restore/Reset) Section */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-dim">Data Safety</h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleBackup}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] text-muted hover:text-white hover:bg-white/[0.08] transition-colors border border-white/[0.06] text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Export Backup
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-white/[0.04] text-muted hover:text-white hover:bg-white/[0.08] transition-colors border border-white/[0.06] text-xs font-semibold"
            >
              <Upload className="w-3.5 h-3.5" />
              Import Restore
            </button>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleRestore}
              className="hidden"
            />
          </div>

          <button
            onClick={() => setShowResetModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-loss/[0.06] text-loss border border-loss/20 hover:bg-loss/[0.1] transition-colors text-xs font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Factory Reset Data
          </button>
        </div>
      </div>

      {/* MIDDLE & RIGHT COLUMNS (Responsive Grid) */}
      <div className="space-y-6 lg:col-span-2">
        {/* Your Bankrolls list */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Your Bankrolls ({bankrolls.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankrolls.map((bankroll) => (
              <BankrollDetailCard key={bankroll.id} bankroll={bankroll} />
            ))}
          </div>
        </div>

        {/* Transaction History panel */}
        <div className="bg-surface card-border rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gold" />
            <h3 className="text-sm font-semibold">Transaction History</h3>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative sm:col-span-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-dim" />
              <input
                type="text"
                placeholder="Search note or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-dark w-full pl-8 pr-2.5 py-2 text-xs"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="input-dark text-xs py-2 px-2"
            >
              <option value="all">All Transaction Types</option>
              <option value="deposit">Deposits Only</option>
              <option value="withdrawal">Withdrawals Only</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e: any) => setDateFilter(e.target.value)}
              className="input-dark text-xs py-2 px-2"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
            </select>
          </div>

          {/* Transactions List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-dark/40 border border-white/[0.02]"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                        tx.type === 'deposit'
                          ? 'bg-profit/10 text-profit'
                          : 'bg-purple/10 text-purple'
                      }`}>
                        {tx.type}
                      </span>
                      <span className="text-xs font-bold">{getBankrollName(tx.bankrollId)}</span>
                    </div>
                    {tx.note && <p className="text-[10px] text-muted">{tx.note}</p>}
                    <p className="text-[9px] text-dim">{dayjs(tx.timestamp).format('DD MMM YYYY, hh:mm A')}</p>
                  </div>
                  <span className={`text-xs font-extrabold ${tx.type === 'deposit' ? 'text-profit' : 'text-purple'}`}>
                    {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Wallet className="w-10 h-10 text-dim mx-auto mb-2" />
                {transactions.length === 0 ? (
                  <>
                    <p className="text-xs text-muted">No transactions recorded yet</p>
                    <p className="text-[10px] text-dim mt-0.5">Use deposit or withdraw to start logging movements</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-muted">No matching transactions</p>
                    <p className="text-[10px] text-dim mt-0.5">Try widening search query or filters</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Safety Factory Reset Dialog / Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark/80 backdrop-blur-md animate-fade-in">
          <div className="bg-surface card-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border-loss/20 animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-loss">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="font-bold text-sm">Destructive Action</h4>
              </div>
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirm('');
                }}
                className="w-7 h-7 rounded-lg bg-white/[0.04] flex items-center justify-center hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4 text-muted" />
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              This will permanently delete all custom bets, bankrolls, limits, and transactions, resetting the store back to initial mock datasets.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] text-dim uppercase font-bold">
                Type "RESET" to confirm:
              </label>
              <input
                type="text"
                placeholder="RESET"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                className="input-dark w-full text-center tracking-widest font-mono py-2 text-xs"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setResetConfirm('');
                }}
                className="flex-1 py-2 rounded-lg bg-white/[0.04] text-muted hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetConfirm}
                className="flex-1 py-2 rounded-lg bg-loss text-white hover:bg-loss-dim transition-colors text-xs font-bold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
