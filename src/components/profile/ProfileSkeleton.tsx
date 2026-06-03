'use client';

import React from 'react';

// ─── Page-level skeleton ───────────────────────────────────────────────────────

function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`}
      aria-hidden
    />
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-white/[0.07] bg-card/30 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <Bone className="h-24 w-24 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <Bone className="h-7 w-48" />
            <Bone className="h-4 w-32" />
            <Bone className="h-4 w-full max-w-sm" />
            <Bone className="h-4 w-2/3 max-w-xs" />
          </div>
          <Bone className="h-10 w-28 rounded-xl flex-shrink-0" />
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02] p-4 space-y-2">
              <Bone className="h-6 w-16" />
              <Bone className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Social links card */}
      <div className="rounded-2xl border border-white/[0.07] bg-card/30 p-6 space-y-4">
        <Bone className="h-5 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Bone key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Settings card */}
      <div className="rounded-2xl border border-white/[0.07] bg-card/30 p-6 space-y-4">
        <Bone className="h-5 w-40" />
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Avatar-only skeleton ──────────────────────────────────────────────────────

export function AvatarSkeleton({ size = 24 }: { size?: number }) {
  return (
    <div
      className="animate-pulse rounded-full bg-white/[0.07] flex-shrink-0"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
