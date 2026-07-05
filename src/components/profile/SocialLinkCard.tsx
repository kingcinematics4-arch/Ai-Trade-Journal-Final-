'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface SocialLinkCardProps {
  platform: string;
  username: string;
  url: string;
  avatar?: string;
  icon?: React.ReactNode;
}

const PLATFORM_LOGOS: Record<string, string> = {
  Instagram:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Instagram_logo.svg/2048px-Instagram_logo.svg.png',
  Twitter:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/X_icon.svg/240px-X_icon.svg.png',
  LinkedIn:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/240px-LinkedIn_icon.svg.png',
  GitHub:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/240px-Octicons-mark-github.svg.png',
  YouTube:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full_color_icon_%282017%29.svg/240px-YouTube_full_color_icon_%282017%29.svg.png',
  Discord:
    'https://upload.wikimedia.org/wikipedia/en/thumb/5/58/Discord_logo.svg/240px-Discord_logo.svg.png',
  Telegram:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/240px-Telegram_logo.svg.png',
  Website:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Globe_icon.svg/240px-Globe_icon.svg.png',
};

export default function SocialLinkCard({
  platform,
  username,
  url,
  avatar,
  icon,
}: SocialLinkCardProps) {
  const [showLogo, setShowLogo] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const hasAvatar = Boolean(avatar);
  const platformLogo = PLATFORM_LOGOS[platform];

  return (
    <a
      href={url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div className="h-10 w-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.05]">
        {hasAvatar && !showLogo ? (
          <img
            src={avatar}
            alt={`${platform} profile`}
            className="h-full w-full object-cover"
            onError={() => setShowLogo(true)}
          />
        ) : icon ? (
          <div className="text-muted-foreground">{icon}</div>
        ) : platformLogo ? (
          <img
            src={platformLogo}
            alt={`${platform} logo`}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="text-xs font-bold text-muted-foreground uppercase">{platform[0]}</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{platform}</p>
        <p className="text-sm font-bold text-foreground truncate">{username}</p>
      </div>

      <ExternalLink size={16} className="text-muted-foreground/40 flex-shrink-0" />
    </a>
  );
}
