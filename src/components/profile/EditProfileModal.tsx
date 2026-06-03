'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, Loader2, Globe, Twitter, Instagram, Linkedin, User, FileText, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import type { ProfileFormData } from '@/types/profile';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Bangladesh','Belgium',
  'Brazil','Canada','Chile','China','Colombia','Croatia','Czech Republic','Denmark',
  'Egypt','Finland','France','Germany','Ghana','Greece','Hungary','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Japan','Jordan','Kenya','Malaysia','Mexico',
  'Morocco','Netherlands','New Zealand','Nigeria','Norway','Pakistan','Peru','Philippines',
  'Poland','Portugal','Romania','Russia','Saudi Arabia','Singapore','South Africa',
  'South Korea','Spain','Sri Lanka','Sweden','Switzerland','Thailand','Turkey','UAE',
  'Ukraine','United Kingdom','United States','Venezuela','Vietnam',
];

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

function Field({ label, error, children, icon }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        {icon && <span className="opacity-60">{icon}</span>}
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

const inputClass =
  'w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/60 transition-all';

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { dbProfile } = useProfileContext();
  const { updateProfile, isSaving } = useUpdateProfile();
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
    watch,
  } = useForm<ProfileFormData>({
    defaultValues: {
      fullName: dbProfile?.fullName ?? '',
      username: dbProfile?.username ?? '',
      bio: dbProfile?.bio ?? '',
      phone: dbProfile?.phone ?? '',
      country: dbProfile?.country ?? '',
      website: dbProfile?.website ?? '',
      twitter: dbProfile?.twitter ?? '',
      instagram: dbProfile?.instagram ?? '',
      linkedin: dbProfile?.linkedin ?? '',
    },
  });

  // Sync form when profile loads/changes
  useEffect(() => {
    if (dbProfile) {
      reset({
        fullName: dbProfile.fullName ?? '',
        username: dbProfile.username ?? '',
        bio: dbProfile.bio ?? '',
        phone: dbProfile.phone ?? '',
        country: dbProfile.country ?? '',
        website: dbProfile.website ?? '',
        twitter: dbProfile.twitter ?? '',
        instagram: dbProfile.instagram ?? '',
        linkedin: dbProfile.linkedin ?? '',
      });
    }
  }, [dbProfile, reset]);

  useEffect(() => {
    setHasChanges(isDirty);
  }, [isDirty]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data, { successMessage: 'Profile saved!' });
      setHasChanges(false);
      onClose();
    } catch {
      // toast already shown by hook
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Discard them?')) return;
    }
    reset();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Edit Profile"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-slate-950 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-slate-950 z-10">
            <div>
              <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Update your personal information</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white/[0.06] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1">
            <div className="px-6 py-6 space-y-6">
              {/* Avatar */}
              <div className="flex justify-center">
                <ProfileAvatar editable size="lg" />
              </div>

              {/* Basic Info */}
              <div>
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
                  Basic Info
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" error={errors.fullName?.message} icon={<User size={12} />}>
                    <input
                      {...register('fullName', { maxLength: { value: 80, message: 'Max 80 characters' } })}
                      placeholder="Your full name"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Username" error={errors.username?.message} icon={<span className="text-xs font-bold">@</span>}>
                    <input
                      {...register('username', {
                        maxLength: { value: 30, message: 'Max 30 characters' },
                        pattern: { value: /^[a-z0-9_]*$/i, message: 'Letters, numbers and underscores only' },
                      })}
                      placeholder="your_handle"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Bio" error={errors.bio?.message} icon={<FileText size={12} />}>
                    <textarea
                      {...register('bio', { maxLength: { value: 200, message: 'Max 200 characters' } })}
                      placeholder="Tell traders a bit about yourself…"
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </Field>
                  <div className="space-y-4">
                    <Field label="Phone" error={errors.phone?.message} icon={<Phone size={12} />}>
                      <input
                        {...register('phone')}
                        type="tel"
                        placeholder="+1 555 000 0000"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Country" error={errors.country?.message} icon={<MapPin size={12} />}>
                      <select {...register('country')} className={`${inputClass} appearance-none`}>
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              <div>
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
                  Social Links
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Website" icon={<Globe size={12} />}>
                    <input
                      {...register('website')}
                      type="url"
                      placeholder="https://yoursite.com"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Twitter / X" icon={<Twitter size={12} />}>
                    <input
                      {...register('twitter')}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Instagram" icon={<Instagram size={12} />}>
                    <input
                      {...register('instagram')}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="LinkedIn" icon={<Linkedin size={12} />}>
                    <input
                      {...register('linkedin')}
                      placeholder="https://linkedin.com/in/you"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06] sticky bottom-0 bg-slate-950">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60 shadow-lg shadow-primary/20"
              >
                {isSaving && <Loader2 size={14} className="animate-spin" />}
                {isSaving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
