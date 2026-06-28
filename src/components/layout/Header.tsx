import { Bell, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-heavy">
      <div className="w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface card-border flex items-center justify-center shadow-lg relative overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-6 h-6">
              <circle cx="50" cy="50" r="45" fill="url(#headerBallGrad)" />
              {/* Gold Seams */}
              <path d="M 25 25 C 40 40, 40 60, 25 75" fill="none" stroke="#FFE17D" strokeWidth="2" strokeDasharray="2 1.5" opacity="0.7" />
              <path d="M 75 25 C 60 40, 60 60, 75 75" fill="none" stroke="#FFE17D" strokeWidth="2" strokeDasharray="2 1.5" opacity="0.7" />
              {/* Rupee symbol */}
              <text x="50" y="59" textAnchor="middle" fill="#FFE17D" fontSize="25" fontWeight="900" fontFamily="sans-serif">₹</text>
              <defs>
                <radialGradient id="headerBallGrad" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#FF4B62"/>
                  <stop offset="100%" stopColor="#8A0B1A"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none text-white/95">
              Bet<span className="text-gold">Khaata</span>
            </h1>
            <p className="text-[9px] text-dim font-bold tracking-widest uppercase leading-none mt-1">
              Betting Intelligence
            </p>
          </div>
        </div>

        {/* Actions */}
        <button className="relative w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.1] transition-colors tap-effect">
          <Bell className="w-4.5 h-4.5 text-muted" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-loss animate-pulse-soft" />
        </button>
      </div>
    </header>
  );
}
