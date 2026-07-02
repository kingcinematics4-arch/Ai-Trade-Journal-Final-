import React from 'react';
import { Globe, Award } from 'lucide-react';
import type { Profile } from '@/types/profile';

interface TraderCardProps {
  trader: Profile;
}

export default function TraderCard({ trader }: TraderCardProps) {
  const displayName = trader.fullName || trader.username || 'Trader';

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 group flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center overflow-hidden flex-shrink-0">
            {trader.avatarUrl ? (
              <img src={trader.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-white uppercase">{displayName.charAt(0)}</span>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors">{displayName}</h3>
            {trader.username && <p className="text-xs text-muted-foreground">@{trader.username}</p>}
          </div>
        </div>
      </div>

      {trader.bio && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{trader.bio}</p>
      )}

      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm mt-auto border-t border-white/[0.05] pt-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Globe size={14} className="text-muted-foreground" />
          <span className="text-xs">{trader.country || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Award size={14} className="text-muted-foreground" />
          <span className="text-xs">Joined {new Date(trader.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
