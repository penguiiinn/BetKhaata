import { Bell, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-heavy">
      <div className="w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 h-14">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center glow-gold">
            <Zap className="w-4.5 h-4.5 text-dark" fill="#0A0B0F" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none">
              Bet<span className="text-gold">Khaata</span>
            </h1>
            <p className="text-[9px] text-dim font-medium tracking-widest uppercase leading-none mt-0.5">
              Cricket Tracker
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
