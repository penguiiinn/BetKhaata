import {
  Home,
  Trophy,
  ClipboardList,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { useBetStore } from '../../store/betStore';
import type { TabId } from '../../types/types';
import clsx from 'clsx';

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'matches', label: 'Matches', icon: Trophy },
  { id: 'bets', label: 'My Bets', icon: ClipboardList },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'bankroll', label: 'Bankroll', icon: Wallet },
];

export default function BottomNav() {
  const activeTab = useBetStore((s) => s.activeTab);
  const setActiveTab = useBetStore((s) => s.setActiveTab);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-white/[0.06]">
      <div className="w-full max-w-[430px] md:max-w-xl mx-auto flex justify-around items-center h-16 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 tap-effect min-w-[56px]',
                isActive
                  ? 'text-gold'
                  : 'text-dim hover:text-muted',
              )}
            >
              <div className="relative">
                <Icon
                  className={clsx(
                    'w-5 h-5 transition-all duration-200',
                    isActive && 'drop-shadow-[0_0_8px_rgba(245,166,35,0.6)]',
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold" />
                )}
              </div>
              <span
                className={clsx(
                  'text-[10px] font-medium transition-all duration-200',
                  isActive ? 'text-gold' : 'text-dim',
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Safe area padding for devices with home bars */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
