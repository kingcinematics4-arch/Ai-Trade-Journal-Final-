'use client';

import React from 'react';
import { FaInstagram, FaLinkedin, FaYoutube, FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { Globe, ExternalLink } from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import type { Profile } from '@/types/profile';
import type { PublicTraderProfile } from '@/types/community';

interface SocialLinkRowProps {
  icon: React.ReactNode;
  label: string;
  href: string | null;
  display: string;
  color: string;
}

interface SocialLinksProps {
  profile?: Profile | PublicTraderProfile | null;
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

function formatLinkedInDisplayName(linkedinValue: string): string {
  if (!linkedinValue) return '';

  let cleaned = linkedinValue.trim();

  cleaned = cleaned.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '');

  cleaned = cleaned.replace(/\/$/, '');

  const parts = cleaned.split('-');

  if (parts.length > 1 && /\d/.test(parts[parts.length - 1])) {
    parts.pop();
  }

  return parts
    .join(' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatWebsiteDisplay(websiteValue: string): string {
  if (!websiteValue) return '';

  let cleaned = websiteValue.trim();

  cleaned = cleaned.replace(/^https?:\/\//, '');

  cleaned = cleaned.replace(/^www\./, '');

  cleaned = cleaned.replace(/\/$/, '');

  const domain = cleaned.toLowerCase();

  if (
    domain === 'aitradejournal.com' ||
    domain === 'www.aitradejournal.com' ||
    domain.includes('ai-trade-journal') ||
    domain.includes('aitradejournal')
  ) {
    return 'AI Trade Journal';
  }

  return cleaned;
}

function formatTwitterDisplay(twitterValue: string): string {
  if (!twitterValue) return '';

  let cleaned = twitterValue.trim();

  cleaned = cleaned.replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//, '');

  cleaned = cleaned.replace(/\/$/, '');

  cleaned = cleaned.replace(/^@/, '');

  return `@${cleaned}`;
}

function formatYouTubeDisplay(youtubeValue: string): string {
  if (!youtubeValue) return '';

  let cleaned = youtubeValue.trim();

  cleaned = cleaned.replace(/^https?:\/\/(www\.)?youtube\.com\//, '');

  cleaned = cleaned.replace(/\/$/, '');

  if (cleaned.startsWith('@')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

function formatGitHubDisplay(githubValue: string): string {
  if (!githubValue) return '';

  let cleaned = githubValue.trim();

  cleaned = cleaned.replace(/^https?:\/\/(www\.)?github\.com\//, '');

  cleaned = cleaned.replace(/\/$/, '');

  cleaned = cleaned.replace(/^@/, '');

  return `@${cleaned}`;
}

export default function SocialLinks({ profile: propProfile }: SocialLinksProps) {
  const { dbProfile } = useProfileContext();
  const { t } = useTranslation();

  const profile = propProfile ?? dbProfile;

  if (!profile) return null;

  const { website, twitter, instagram, linkedin, youtube, github } = profile;
  const hasAnySocial = website || twitter || instagram || linkedin || youtube || github;

  if (!hasAnySocial) {
    return (
      <div className="text-center py-6 text-muted-foreground/50 text-sm">
        {t('profile.noSocialLinks')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      <SocialLinkRow
        icon={<Globe size={20} />}
        label={t('profile.website')}
        href={website}
        display={formatWebsiteDisplay(website || '')}
        color="text-[#38BDF8]"
      />
      <SocialLinkRow
        icon={<FaXTwitter size={20} />}
        label={t('profile.twitter')}
        href={twitter ? (twitter.startsWith('http') ? twitter : `https://twitter.com/${twitter.replace('@', '')}`) : null}
        display={formatTwitterDisplay(twitter || '')}
        color="text-white"
      />
      <SocialLinkRow
        icon={<FaInstagram size={20} />}
        label={t('profile.instagram')}
        href={instagram ? `https://instagram.com/${instagram.replace('@', '')}` : null}
        display={instagram ? (instagram.startsWith('@') ? instagram : `@${instagram}`) : ''}
        color="text-[#E1306C]"
      />
      <SocialLinkRow
        icon={<FaLinkedin size={20} />}
        label={t('profile.linkedin')}
        href={linkedin}
        display={formatLinkedInDisplayName(linkedin || '')}
        color="text-[#0A66C2]"
      />
      <SocialLinkRow
        icon={<FaYoutube size={20} />}
        label={t('profile.youtube')}
        href={youtube ? (youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube.replace('@', '')}`) : null}
        display={formatYouTubeDisplay(youtube || '')}
        color="text-[#FF0000]"
      />
      <SocialLinkRow
        icon={<FaGithub size={20} />}
        label={t('profile.github')}
        href={github ? (github.startsWith('http') ? github : `https://github.com/${github.replace('@', '')}`) : null}
        display={formatGitHubDisplay(github || '')}
        color="text-white"
      />
    </div>
  );
}
