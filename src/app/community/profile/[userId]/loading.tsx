import React from 'react';

function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 rounded bg-white/[0.06]" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 rounded bg-white/[0.06]" />
          <div className="h-5 w-16 rounded bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export default function CommunityProfileLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1750px] mx-auto px-6 lg:px-14 pt-6">
        <div className="mb-8">
          <div className="h-8 w-48 rounded bg-white/[0.06] animate-pulse" />
        </div>
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 lg:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 lg:gap-8">
            <div className="h-32 w-32 md:h-36 md:w-36 rounded-full bg-white/[0.06] animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-10 w-64 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-32 rounded bg-white/[0.06] animate-pulse" />
              <div className="h-4 w-48 rounded bg-white/[0.06] animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 pt-10 border-t border-[#262626]">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="mt-8 space-y-3">
            <div className="h-5 w-32 rounded bg-white/[0.06] animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
