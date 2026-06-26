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
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-white/[0.06] shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
      <div className="w-full max-w-[430px] md:max-w-xl mx-auto flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-2xl transition-all duration-300 tap-effect min-w-[62px] relative active:scale-90',
                isActive
                  ? 'text-gold'
                  : 'text-dim hover:text-muted',
              )}
            >
              {/* Subtle Glowing Background Capsule */}
              {isActive && (
                <div className="absolute inset-0 bg-gold/[0.03] border border-gold/10 rounded-xl animate-fade-in shadow-[inset_0_0_8px_rgba(245,166,35,0.02)]" />
              )}
              
              <div className="relative z-10 flex flex-col items-center">
                <Icon
                  className={clsx(
                    'w-5 h-5 transition-all duration-300 transform',
                    isActive 
                      ? 'drop-shadow-[0_0_10px_rgba(245,166,35,0.5)] scale-110' 
                      : 'scale-100'
                  )}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                
                <span
                  className={clsx(
                    'text-[9px] font-semibold tracking-wide mt-1 transition-all duration-300',
                    isActive ? 'text-gold' : 'text-dim'
                  )}
                >
                  {tab.label}
                </span>

                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#F5A623] mt-0.5 animate-pulse" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Safe area padding for modern devices */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
