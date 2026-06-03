'use client';

import React, { useState } from 'react';
import { Edit2, MapPin, Globe, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileContext } from '@/contexts/ProfileContext';
import { getProfileDisplayName } from '@/types/profile';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import ProfileStats from '@/components/profile/ProfileStats';
import EditProfileModal from '@/components/profile/EditProfileModal';

export default function ProfileHeader() {
  const { user } = useAuth();
  const { dbProfile, isLoading } = useProfileContext();
  const [editOpen, setEditOpen] = useState(false);

  const displayName = getProfileDisplayName(dbProfile, user?.email);
  const username = dbProfile?.username;
  const bio = dbProfile?.bio;
  const country = dbProfile?.country;
  const website = dbProfile?.website;

  return (
    <>
      <div className="rounded-2xl border border-white/[0.07] bg-card/30 backdrop-blur-md p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <ProfileAvatar editable size="xl" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                {/* Name */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight truncate">
                    {displayName}
                  </h1>
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                    <CheckCircle2 size={10} />
                    Active
                  </span>
                </div>

                {/* Username */}
                {username && (
                  <p className="text-sm text-muted-foreground mt-0.5">@{username}</p>
                )}

                {/* Meta row */}
                <div className="flex items-center flex-wrap gap-3 mt-2">
                  {country && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin size={12} className="text-muted-foreground/50" />
                      {country}
                    </span>
                  )}
                  {website && (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <Globe size={12} />
                      {website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {user?.email && (
                    <span className="text-xs text-muted-foreground/60 truncate">
                      {user.email}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {bio ? (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">
                    {bio}
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground/40 italic">
                    No bio added yet. Click "Edit Profile" to add one.
                  </p>
                )}
              </div>

              {/* Edit button */}
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-sm font-semibold text-foreground hover:bg-white/[0.08] hover:border-white/[0.15] transition-all"
                id="edit-profile-btn"
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            </div>

            {/* Stats */}
            <ProfileStats />
          </div>
        </div>
      </div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </>
  );
}
