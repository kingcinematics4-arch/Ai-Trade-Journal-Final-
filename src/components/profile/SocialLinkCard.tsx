'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface SocialLinkCardProps {
  platform: string;
  username: string;
  url: string;
  avatar?: string;
  fallbackIcon?: React.ReactNode;
}

const INSTAGRAM_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Instagram_logo.svg/2048px-Instagram_logo.svg.png';
const TWITTER_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/X_icon.svg/240px-X_icon.svg.png';
const LINKEDIN_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/LinkedIn_icon.svg/240px-LinkedIn_icon.svg.png';
const GITHUB_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Octicons-mark-github.svg/240px-Octicons-mark-github.svg.png';
const YOUTUBE_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/YouTube_full_color_icon_%282017%29.svg/240px-YouTube_full_color_icon_%282017%29.svg.png';
const DISCORD_LOGO =
  'https://upload.wikimedia.org/wikipedia/en/thumb/5/58/Discord_logo.svg/240px-Discord_logo.svg.png';
const TELEGRAM_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/Telegram_logo.svg/240px-Telegram_logo.svg.png';

const PLATFORM_LOGOS: Record<string, string> = {
  Instagram: INSTAGRAM_LOGO,
  Twitter: TWITTER_LOGO,
  'Twitter/X': TWITTER_LOGO,
  LinkedIn: LINKEDIN_LOGO,
  GitHub: GITHUB_LOGO,
  YouTube: YOUTUBE_LOGO,
  Discord: DISCORD_LOGO,
  Telegram: TELEGRAM_LOGO,
  Website:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Globe_icon.svg/240px-Globe_icon.svg.png',
};

export default function SocialLinkCard({
  platform,
  username,
  url,
  avatar,
  fallbackIcon,
}: SocialLinkCardProps) {
  const [useFallback, setUseFallback] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const showInstagramLogo = platform.includes('Instagram') && (!avatar || useFallback);
  const platformLogo = PLATFORM_LOGOS[platform];

  return (
    <a
      href={url}
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-[#262626] hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      <div
        className="h-11 w-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white/[0.05]"
        style={{ border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {avatar && !useFallback ? (
          <img
            src={avatar}
            alt={`${platform} profile`}
            className="h-full w-full object-cover"
            onError={() => setUseFallback(true)}
          />
        ) : showInstagramLogo ? (
          <img
            src={INSTAGRAM_LOGO}
            alt="Instagram logo"
            className="h-6 w-6 object-contain"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
            }}
          />
        ) : fallbackIcon ? (
          <div className="text-muted-foreground">{fallbackIcon}</div>
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
