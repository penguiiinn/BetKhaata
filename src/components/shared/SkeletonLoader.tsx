import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
}

export function SkeletonBase({ className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'bg-white/[0.04] rounded-lg animate-pulse-soft',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-surface card-border rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-center">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-4 w-12" />
      </div>
      <SkeletonBase className="h-5 w-3/4" />
      <div className="flex gap-2">
        <SkeletonBase className="h-3 w-16" />
        <SkeletonBase className="h-3 w-16" />
      </div>
      <div className="border-t border-white/[0.04] pt-2.5 flex justify-between">
        <SkeletonBase className="h-4 w-16" />
        <SkeletonBase className="h-4 w-20" />
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-surface card-border rounded-xl p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5">
          <SkeletonBase className="h-4 w-32" />
          <SkeletonBase className="h-3 w-20" />
        </div>
        <SkeletonBase className="h-5 w-16" />
      </div>
      <div className="h-40 flex items-end gap-2.5 pb-2">
        <SkeletonBase className="h-12 w-full" />
        <SkeletonBase className="h-24 w-full" />
        <SkeletonBase className="h-16 w-full" />
        <SkeletonBase className="h-32 w-full" />
        <SkeletonBase className="h-20 w-full" />
        <SkeletonBase className="h-28 w-full" />
        <SkeletonBase className="h-8 w-full" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
      <div className="space-y-1.5 flex-1">
        <SkeletonBase className="h-4 w-1/3" />
        <SkeletonBase className="h-3 w-1/4" />
      </div>
      <SkeletonBase className="h-5 w-16" />
    </div>
  );
}
