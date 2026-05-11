import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-md ${className}`}
    />
  );
}

export function KpiCardSkeleton() {
  return (
    <div className="card-elevated p-5">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-9 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 8 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`skel-col-${i}`} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="w-full animate-pulse bg-muted rounded-lg" style={{ height }} />
  );
}