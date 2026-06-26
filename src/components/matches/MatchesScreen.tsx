import { useMemo } from 'react';
import { useBetStore } from '../../store/betStore';
import type { MatchStatus } from '../../types/types';
import MatchCard from './MatchCard';
import clsx from 'clsx';

const matchTabs: { id: MatchStatus; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'finished', label: 'Finished' },
];

export default function MatchesScreen() {
  const matchTab = useBetStore((s) => s.matchTab);
  const setMatchTab = useBetStore((s) => s.setMatchTab);
  const allMatches = useBetStore((s) => s.matches);
  const matches = useMemo(
    () => allMatches.filter((m) => m.status === matchTab),
    [allMatches, matchTab],
  );

  return (
    <div className="px-4 py-4 w-full max-w-[430px] md:max-w-3xl lg:max-w-6xl xl:max-w-7xl mx-auto">
      {/* Tab bar */}
      <div
        className="flex gap-1 bg-surface card-border rounded-xl p-1 mb-4 animate-slide-up"
        style={{ opacity: 0 }}
      >
        {matchTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMatchTab(tab.id)}
            className={clsx(
              'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 relative',
              matchTab === tab.id
                ? 'bg-surface-light text-white shadow-sm'
                : 'text-muted hover:text-white',
            )}
          >
            {tab.label}
            {tab.id === 'live' && matchTab !== 'live' && (
              <span className="absolute top-1.5 right-3 w-1.5 h-1.5 rounded-full bg-loss animate-pulse-soft" />
            )}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.length > 0 ? (
          matches.map((match, i) => (
            <div
              key={match.id}
              className="animate-slide-up"
              style={{ opacity: 0, animationDelay: `${0.05 * (i + 1)}s` }}
            >
              <MatchCard match={match} />
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <p className="text-muted text-sm">No {matchTab} matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
