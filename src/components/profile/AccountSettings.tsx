'use client';

import React, { useState, useEffect } from 'react';
import { Mail, Lock, Bell, Shield, ChevronRight, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import {
  sendPasswordReset,
  updateEmail,
  getProfile,
  updatePublicProfile,
} from '@/services/profileService';
import { NotificationSettings } from '@/services/notificationService';
import { useTranslation } from '@/i18n/hooks/useTranslation';
import { locales, localeNames, localeFlags } from '@/i18n/config';
import SimpleSelect from '@/components/ui/SimpleSelect';

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
    <div className="rounded-2xl border border-white/[0.07] bg-card/30 backdrop-blur-md overflow-visible">
      <div className="px-6 py-4 border-b border-white/[0.05]">
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      <div className="px-6 divide-y divide-white/[0.04]">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AccountSettings() {
  const { user } = useAuth();
  const { settings, updateSettings } = useNotifications();
  const { locale, setLocale, t } = useTranslation();

  // Public profile state (stored in profiles table, not notification_settings)
  const [publicProfile, setPublicProfile] = useState(false);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  // Password reset
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Load public profile from profiles table
  useEffect(() => {
    if (!user?.id) return;
    getProfile(user.id)
      .then((profile) => {
        if (profile) {
          setPublicProfile(profile.publicProfile);
        }
      })
      .catch(() => {
        // Silently fail — default to false
      });
  }, [user?.id]);

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  const handlePublicProfileToggle = async (value: boolean) => {
    if (!user?.id) return;
    setPublicProfileLoading(true);
    // Optimistic update
    setPublicProfile(value);
    try {
      await updatePublicProfile(user.id, value);
    } catch (err) {
      // Revert on failure
      setPublicProfile(!value);
      toast.error(err instanceof Error ? err.message : t('settings.error'));
    } finally {
      setPublicProfileLoading(false);
    }
  };

  const handleEmailUpdate = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast.error(t('settings.emailAddress'));
      return;
    }
    setEmailSaving(true);
    try {
      await updateEmail(newEmail);
      toast.success(t('settings.emailSent'));
      setShowEmailForm(false);
      setNewEmail('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.error'));
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
      toast.success(t('settings.emailSent'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('settings.error'));
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Account Security */}
      <Section title={t('settings.accountSecurity')}>
        {/* Email */}
        <div className="py-3.5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <Mail size={16} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t('settings.emailAddress')}</p>
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
              {t('settings.change')}{' '}
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
                placeholder={t('settings.newEmailAddress')}
                className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
              />
              <button
                type="button"
                onClick={handleEmailUpdate}
                disabled={emailSaving}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-60"
              >
                {emailSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                {t('settings.save')}
              </button>
            </div>
          )}
        </div>

        {/* Password */}
        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-start gap-3">
            <Lock size={16} className="mt-0.5 text-muted-foreground/60 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{t('settings.password')}</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {resetSent ? t('settings.resetEmailSent') : t('settings.sendPasswordReset')}
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
            {resetSent ? t('settings.emailSent') : t('settings.resetPassword')}
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section title={t('settings.notifications')}>
        <ToggleRow
          id="notif-enabled"
          label={t('settings.pushNotifications')}
          description={t('settings.pushNotificationsDesc')}
          checked={settings?.notifications_enabled ?? true}
          onChange={(v) => handleToggle('notifications_enabled', v)}
          icon={<Bell size={14} />}
        />
        <ToggleRow
          id="notif-trade"
          label={t('settings.tradeAlerts')}
          description={t('settings.tradeAlertsDesc')}
          checked={settings?.trade_alerts ?? true}
          onChange={(v) => handleToggle('trade_alerts', v)}
        />
        <ToggleRow
          id="notif-pnl"
          label={t('settings.performanceAlerts')}
          description={t('settings.performanceAlertsDesc')}
          checked={settings?.pnl_alerts ?? true}
          onChange={(v) => handleToggle('pnl_alerts', v)}
        />
        <ToggleRow
          id="notif-system"
          label={t('settings.systemUpdates')}
          description={t('settings.systemUpdatesDesc')}
          checked={settings?.system_updates ?? true}
          onChange={(v) => handleToggle('system_updates', v)}
        />
        <ToggleRow
          id="notif-activity"
          label={t('settings.activityAlerts')}
          description={t('settings.activityAlertsDesc')}
          checked={settings?.activity_alerts ?? true}
          onChange={(v) => handleToggle('activity_alerts', v)}
        />
      </Section>

      {/* Privacy */}
      <Section title={t('settings.privacy')}>
        <ToggleRow
          id="privacy-public"
          label={t('settings.publicProfile')}
          description={t('settings.publicProfileDesc')}
          checked={publicProfile}
          onChange={handlePublicProfileToggle}
          icon={<Shield size={14} />}
        />
        <ToggleRow
          id="privacy-stats"
          label={t('settings.showTradingStats')}
          description={t('settings.showTradingStatsDesc')}
          checked={settings?.show_stats ?? true}
          onChange={(v) => handleToggle('show_stats', v)}
        />
      </Section>

      {/* Preferences */}
      <Section title={t('settings.appearance')}>
        <div className="py-4">
          {/* Language Selection */}
          <SimpleSelect
            label={t('settings.language')}
            items={locales.map((loc) => ({
              id: loc,
              label: `${localeFlags[loc]} ${localeNames[loc]}`,
              value: loc,
            }))}
            value={locale}
            onSelect={async (value) => {
              const newLocale = value as (typeof locales)[number];
              await setLocale(newLocale);
            }}
            placeholder={t('settings.language')}
          />
        </div>
      </Section>
    </div>
  );
}
