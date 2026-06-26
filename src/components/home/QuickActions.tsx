import { Plus, ArrowDownToLine, ArrowUpFromLine, ShieldCheck } from 'lucide-react';
import { useBetStore } from '../../store/betStore';

const actions = [
  {
    label: 'Add Bet',
    icon: Plus,
    modal: 'addBet' as const,
    gradient: 'from-gold/20 to-gold/[0.05]',
    iconColor: 'text-gold',
  },
  {
    label: 'Deposit',
    icon: ArrowDownToLine,
    modal: 'deposit' as const,
    gradient: 'from-profit/20 to-profit/[0.05]',
    iconColor: 'text-profit',
  },
  {
    label: 'Withdraw',
    icon: ArrowUpFromLine,
    modal: 'withdraw' as const,
    gradient: 'from-purple/20 to-purple/[0.05]',
    iconColor: 'text-purple',
  },
  {
    label: 'Set Limit',
    icon: ShieldCheck,
    modal: 'setLimit' as const,
    gradient: 'from-loss/20 to-loss/[0.05]',
    iconColor: 'text-loss',
  },
];

export default function QuickActions() {
  const openModal = useBetStore((s) => s.openModal);

  return (
    <div
      className="grid grid-cols-4 gap-2.5 animate-slide-up stagger-4"
      style={{ opacity: 0 }}
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={() => openModal(action.modal)}
            className="bg-surface card-border card-border-hover rounded-xl p-3 flex flex-col items-center gap-2 transition-all duration-200 tap-effect hover:bg-surface-light"
          >
            <div
              className={`w-10 h-10 rounded-full bg-gradient-to-b ${action.gradient} flex items-center justify-center`}
            >
              <Icon className={`w-4.5 h-4.5 ${action.iconColor}`} />
            </div>
            <span className="text-[10px] text-muted font-medium">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
