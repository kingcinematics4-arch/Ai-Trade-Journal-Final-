'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Bell,
  Shield,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  Loader2,
  Check,
  Globe,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { sendPasswordReset, updateEmail } from '@/services/profileService';
import { NotificationSettings } from '@/services/notificationService';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { locales, localeNames, localeFlags } from '@/i18n/config';

// ─── Toggle Row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}

function ToggleRow({ id, label, description, checked, onChange, icon }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="mt-0.5 text-muted-foreground/60 flex-shrink-0">{icon}</span>}
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground/60 mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background ${
          checked ? 'bg-primary' : 'bg-white/[0.1]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-card/30 backdrop-blur-md overflow-hidden">
      <div className="px-6 py-4 border-b border-white/[0.05]">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <div className="px-6 divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

// ─── Theme selector ────────────────────────────────────────────────────────────

type Theme = 'dark' | 'light' | 'system';

const THEMES: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'dark', label: 'Dark', icon: <Moon size={14} /> },
  { value: 'light', label: 'Light', icon: <Sun size={14} /> },
  { value: 'system', label: 'System', icon: <Monitor size={14} /> },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (GMT+0)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
];

export default function AccountSettings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useNotifications();
  const { locale, setLocale } = useTranslation();

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handleEmailUpdate = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setEmailSaving(true);
    try {
      await updateEmail(newEmail);
      toast.success('Confirmation email sent! Check your inbox.');
      setShowEmailForm(false);
      setNewEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setResetLoading(true);
    try {
      await sendPasswordReset(user.email);
      setResetSent(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Account Security */}
      <Section title="Account & Security">
        {/* Email */}
        <div className="py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Mail size={16} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Email Address</p>
                <p className="text-xs text-muted-foreground/60 truncate mt-0.5">
                  {user?.email ?? '—'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowEmailForm(!showEmailForm)}
              className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Change{' '}
              <ChevronRight
                size={13}
                className={`transition-transform ${showEmailForm ? 'rotate-90' : ''}`}
              />
            </button>
          </div>

          {showEmailForm && (
            <div className="flex gap-2 pl-7">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="New email address"
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
              />
              <button
                type="button"
                onClick={handleEmailUpdate}
                disabled={emailSaving}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {emailSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save
              </button>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-start gap-3">
            <Lock size={16} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Password</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {resetSent ? 'Reset email sent — check your inbox' : 'Send a password reset email'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={resetLoading || resetSent}
            className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {resetLoading && <Loader2 size={12} className="animate-spin" />}
            {resetSent ? 'Email sent ✓' : 'Reset Password'}
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        <ToggleRow
          id="notif-enabled"
          label="Push Notifications"
          description="Toggle all app alerts"
          checked={settings?.notifications_enabled ?? true}
          onChange={(v) => handleToggle('notifications_enabled', v)}
          icon={<Bell size={14} />}
        />
        <ToggleRow
          id="notif-trade"
          label="Trade Alerts"
          description="Get notified on trade events"
          checked={settings?.trade_alerts ?? true}
          onChange={(v) => handleToggle('trade_alerts', v)}
        />
        <ToggleRow
          id="notif-pnl"
          label="Performance Alerts"
          description="Alerts for P&L milestones"
          checked={settings?.pnl_alerts ?? true}
          onChange={(v) => handleToggle('pnl_alerts', v)}
        />
        <ToggleRow
          id="notif-system"
          label="System Updates"
          description="Major app updates and news"
          checked={settings?.system_updates ?? true}
          onChange={(v) => handleToggle('system_updates', v)}
        />
        <ToggleRow
          id="notif-activity"
          label="Activity Alerts"
          description="Notifications for account activity"
          checked={settings?.activity_alerts ?? true}
          onChange={(v) => handleToggle('activity_alerts', v)}
        />
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <ToggleRow
          id="privacy-public"
          label="Public Profile"
          description="Allow others to view your profile"
          checked={settings?.profile_public ?? false}
          onChange={(v) => handleToggle('profile_public', v)}
          icon={<Shield size={14} />}
        />
        <ToggleRow
          id="privacy-stats"
          label="Show Trading Stats"
          description="Display your stats publicly"
          checked={settings?.show_stats ?? true}
          onChange={(v) => handleToggle('show_stats', v)}
        />
      </Section>

      {/* Theme */}
      <div className="rounded-2xl border border-white/[0.07] bg-card/30 backdrop-blur-md overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <h2 className="text-sm font-bold text-foreground">Appearance</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Globe size={13} /> Language
              </label>
              <select
                value={locale}
                onChange={async (e) => {
                  const newLocale = e.target.value as typeof locales[number];
                  await setLocale(newLocale);
                }}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all appearance-none"
              >
                {locales.map((loc) => (
                  <option key={loc} value={loc} className="bg-neutral-900">
                    {localeFlags[loc]} {localeNames[loc]}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Clock size={13} /> Timezone
              </label>
              <select
                value={settings?.timezone || 'UTC'}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all appearance-none"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value} className="bg-neutral-900">
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs font-semibold text-muted-foreground mb-3">Theme Preference</p>
          <div className="flex flex-wrap gap-2">
            {THEMES.map(({ value, label, icon }) => (
              <button
                key={value}
                type="button"
                id={`theme-${value}`}
                onClick={() => updateSettings({ theme: value })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  (settings?.theme || 'dark') === value
                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                    : 'bg-white/[0.03] text-muted-foreground border-white/[0.07] hover:bg-white/[0.06]'
                }`}
              >
                {icon}
                {label}
              </button>
            ))}
          </div>
          {(settings?.theme || 'dark') !== 'dark' && (
            <p className="text-xs text-amber-400/80 mt-3 flex items-center gap-1.5">
              <span>⚠</span> Light / system themes coming soon — app is currently dark-only.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
