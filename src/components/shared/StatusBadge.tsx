import type { BetStatus } from '../../types/types';
import { getStatusColor, getStatusBgColor } from '../../utils/utils';

interface StatusBadgeProps {
  status: BetStatus;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const color = getStatusColor(status);
  const bg = getStatusBgColor(status);
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
      style={{ color, backgroundColor: bg }}
    >
      {status === 'running' && (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-soft"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </span>
  );
}
