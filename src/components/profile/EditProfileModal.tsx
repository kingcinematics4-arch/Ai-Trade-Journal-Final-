'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  X,
  Loader2,
  Globe,
  AtSign,
  Camera,
  User,
  FileText,
  Phone,
  MapPin,
  TrendingUp,
  BarChart3,
  Briefcase,
} from 'lucide-react';
import { useProfileContext } from '@/contexts/ProfileContext';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
}

const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Argentina',
  'Australia',
  'Austria',
  'Bangladesh',
  'Belgium',
  'Brazil',
  'Canada',
  'Chile',
  'China',
  'Colombia',
  'Croatia',
  'Czech Republic',
  'Denmark',
  'Egypt',
  'Finland',
  'France',
  'Germany',
  'Ghana',
  'Greece',
  'Hungary',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Japan',
  'Jordan',
  'Kenya',
  'Malaysia',
  'Mexico',
  'Morocco',
  'Netherlands',
  'New Zealand',
  'Nigeria',
  'Norway',
  'Pakistan',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Romania',
  'Russia',
  'Saudi Arabia',
  'Singapore',
  'South Africa',
  'South Korea',
  'Spain',
  'Sri Lanka',
  'Sweden',
  'Switzerland',
  'Thailand',
  'Turkey',
  'UAE',
  'Ukraine',
  'United Kingdom',
  'United States',
  'Venezuela',
  'Vietnam',
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

type FormState = {
  fullName: string;
  username: string;
  bio: string;
  phone: string;
  country: string;
  website: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  github: string;
  discord: string;
  telegram: string;
  tradingStyle: string;
  markets: string;
  experience: string;
};

export default function EditProfileModal({ open, onClose }: EditProfileModalProps) {
  const { dbProfile } = useProfileContext();
  const { updateProfile, isSaving } = useUpdateProfile();
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<FormState>({
    fullName: '',
    username: '',
    bio: '',
    phone: '',
    country: '',
    website: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    github: '',
    discord: '',
    telegram: '',
    tradingStyle: '',
    markets: '',
    experience: '',
  });

  const handleInputChange = useCallback((field: keyof FormState, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  }, []);

  // Load current profile when modal opens
  useEffect(() => {
    if (!open || !dbProfile) return;

    setFormData({
      fullName: dbProfile.fullName ?? '',
      username: dbProfile.username ?? '',
      bio: dbProfile.bio ?? '',
      phone: dbProfile.phone ?? '',
      country: dbProfile.country ?? '',
      website: dbProfile.website ?? '',
      twitter: dbProfile.twitter ?? '',
      instagram: dbProfile.instagram ?? '',
      linkedin: dbProfile.linkedin ?? '',
      youtube: dbProfile.youtube ?? '',
      github: dbProfile.github ?? '',
      discord: dbProfile.discord ?? '',
      telegram: dbProfile.telegram ?? '',
      tradingStyle: dbProfile.tradingStyle ?? '',
      // markets is string[] in Profile but the form uses a plain text input → join to string
      markets: Array.isArray(dbProfile?.markets) ? (dbProfile.markets as string[]).join(', ') : '',
      experience: dbProfile.experience ?? '',
    });
    setHasChanges(false);
  }, [open, dbProfile]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('===== FORM DATA =====');
    console.log(formData);

    try {
      await updateProfile(
        {
          fullName: formData.fullName,
          username: formData.username,
          bio: formData.bio,
          phone: formData.phone,
          country: formData.country,
          website: formData.website,
          twitter: formData.twitter,
          instagram: formData.instagram,
          linkedin: formData.linkedin,
          youtube: formData.youtube,
          github: formData.github,
          discord: formData.discord,
          telegram: formData.telegram,
          tradingStyle: formData.tradingStyle,
          markets: formData.markets,
          experience: formData.experience,
        },
        { successMessage: 'Profile saved!' }
      );
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
    setFormData({
      fullName: '',
      username: '',
      bio: '',
      phone: '',
      country: '',
      website: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
      github: '',
      discord: '',
      telegram: '',
      tradingStyle: '',
      markets: '',
      experience: '',
    });
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
        <div className="relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-slate-950 border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] sticky top-0 bg-slate-950 z-10">
            <div>
              <h2 className="text-lg font-bold text-foreground">Edit Profile</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your personal information
              </p>
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
          <form onSubmit={onSubmit} className="flex flex-col flex-1">
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
                  <Field label="Full Name" icon={<User size={12} />}>
                    <input
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      placeholder="Your full name"
                      maxLength={80}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Username" icon={<span className="text-xs font-bold">@</span>}>
                    <input
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="your_handle"
                      maxLength={30}
                      pattern="[a-z0-9_]*"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Bio" icon={<FileText size={12} />}>
                    <div className="relative">
                      <textarea
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell traders a bit about yourself…"
                        maxLength={100}
                        rows={3}
                        className={`${inputClass} resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
                      />
                      <span className="absolute bottom-2 right-2.5 text-[11px] text-slate-400 pointer-events-none">
                        {formData.bio.length}/100
                      </span>
                    </div>
                  </Field>
                  <div className="space-y-4">
                    <Field label="Phone" icon={<Phone size={12} />}>
                      <input
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        type="tel"
                        placeholder="+1 555 000 0000"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Country" icon={<MapPin size={12} />}>
                      <select
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
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
                      value={formData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      type="url"
                      placeholder="https://yoursite.com"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Twitter / X" icon={<AtSign size={12} />}>
                    <input
                      value={formData.twitter}
                      onChange={(e) => handleInputChange('twitter', e.target.value)}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Instagram" icon={<Camera size={12} />}>
                    <input
                      value={formData.instagram}
                      onChange={(e) => handleInputChange('instagram', e.target.value)}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="LinkedIn" icon={<Briefcase size={12} />}>
                    <input
                      value={formData.linkedin}
                      onChange={(e) => handleInputChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/you"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="YouTube">
                    <input
                      value={formData.youtube}
                      onChange={(e) => handleInputChange('youtube', e.target.value)}
                      placeholder="@channel or URL"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="GitHub">
                    <input
                      value={formData.github}
                      onChange={(e) => handleInputChange('github', e.target.value)}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Discord">
                    <input
                      value={formData.discord}
                      onChange={(e) => handleInputChange('discord', e.target.value)}
                      placeholder="@username or user ID"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Telegram">
                    <input
                      value={formData.telegram}
                      onChange={(e) => handleInputChange('telegram', e.target.value)}
                      placeholder="@username"
                      className={inputClass}
                    />
                  </Field>
                </div>
              </div>

              {/* Trading Profile */}
              <div>
                <p className="text-xs font-bold text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
                  Trading Profile
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Trading Style" icon={<TrendingUp size={12} />}>
                    <select
                      value={formData.tradingStyle}
                      onChange={(e) => handleInputChange('tradingStyle', e.target.value)}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">Select style</option>
                      <option value="day_trading">Day Trading</option>
                      <option value="swing_trading">Swing Trading</option>
                      <option value="scalping">Scalping</option>
                      <option value="position_trading">Position Trading</option>
                      <option value="investing">Investing</option>
                    </select>
                  </Field>
                  <Field label="Markets" icon={<BarChart3 size={12} />}>
                    <input
                      value={formData.markets}
                      onChange={(e) => handleInputChange('markets', e.target.value)}
                      placeholder="e.g. Crypto, Forex, Stocks"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Experience" icon={<Briefcase size={12} />}>
                    <select
                      value={formData.experience}
                      onChange={(e) => handleInputChange('experience', e.target.value)}
                      className={`${inputClass} appearance-none`}
                    >
                      <option value="">Select experience</option>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
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
