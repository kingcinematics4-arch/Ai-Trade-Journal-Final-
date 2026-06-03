'use client';

import React from 'react';
import { Globe, AtSign, Camera, Briefcase, ExternalLink } from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';

interface SocialLinkRowProps {
  icon: React.ReactNode;
  label: string;
  href: string | null;
  display: string;
  color: string;
}

function SocialLinkRow({ icon, label, href, display, color }: SocialLinkRowProps) {
  if (!href) return null;
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all group`}
      aria-label={`${label}: ${display}`}
    >
      <span className={`${color} flex-shrink-0`}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="text-xs text-muted-foreground font-medium block">{label}</span>
        <span className="text-sm font-semibold text-foreground truncate block">{display}</span>
      </span>
      <ExternalLink
        size={13}
        className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0"
      />
    </a>
  );
}

export default function SocialLinks() {
  const { dbProfile } = useProfileContext();

  if (!dbProfile) return null;

  const { website, twitter, instagram, linkedin } = dbProfile;
  const hasAnySocial = website || twitter || instagram || linkedin;

  if (!hasAnySocial) {
    return (
      <div className="text-center py-6 text-muted-foreground/50 text-sm">
        No social links added yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      <SocialLinkRow
        icon={<Globe size={16} />}
        label="Website"
        href={website}
        display={website?.replace(/^https?:\/\//, '') ?? ''}
        color="text-sky-400"
      />
      <SocialLinkRow
        icon={<AtSign size={16} />}
        label="Twitter / X"
        href={twitter ? `https://twitter.com/${twitter.replace('@', '')}` : null}
        display={twitter ? (twitter.startsWith('@') ? twitter : `@${twitter}`) : ''}
        color="text-sky-500"
      />
      <SocialLinkRow
        icon={<Camera size={16} />}
        label="Instagram"
        href={instagram ? `https://instagram.com/${instagram.replace('@', '')}` : null}
        display={instagram ? (instagram.startsWith('@') ? instagram : `@${instagram}`) : ''}
        color="text-pink-400"
      />
      <SocialLinkRow
        icon={<Briefcase size={16} />}
        label="LinkedIn"
        href={linkedin}
        display={linkedin?.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '') ?? ''}
        color="text-blue-400"
      />
    </div>
  );
}
