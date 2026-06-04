'use client';
import { useNotifications } from '@/hooks/useNotifications';

export function useNotificationSettings() {
  const { settings, updateSettings, requestBrowserPermission } = useNotifications();
  return {
    settings,
    updateSettings,
    requestBrowserPermission
  };
}