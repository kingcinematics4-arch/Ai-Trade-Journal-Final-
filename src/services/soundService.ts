import { audioManager } from '@/lib/audio';

export type SoundType = 'notification' | 'success' | 'warning';

const recentlyPlayed = new Set<string>();

function logInfo(message: string, ...args: unknown[]): void {
  console.info(`[soundService] ${message}`, ...args);
}

function logWarn(message: string, ...args: unknown[]): void {
  console.warn(`[soundService] ${message}`, ...args);
}

function logError(message: string, ...args: unknown[]): void {
  console.error(`[soundService] ${message}`, ...args);
}

export function unlockNotificationAudio(): void {
  logInfo('unlockNotificationAudio called');
  audioManager.warmUp();
  audioManager.bindUnlock();
}

export const soundService = {
  play: (type: SoundType, volume: number = 0.5, dedupeKey?: string): void => {
    if (typeof window === 'undefined') {
      logWarn('play: window is undefined — skipped');
      return;
    }

    logInfo('Notification triggered', { type, volume, dedupeKey });

    if (dedupeKey) {
      if (recentlyPlayed.has(dedupeKey)) {
        logInfo(`play: dedupe — already played for key ${dedupeKey}`);
        return;
      }
      recentlyPlayed.add(dedupeKey);
      window.setTimeout(() => recentlyPlayed.delete(dedupeKey), 10_000);
      logInfo(`play: dedupe key registered ${dedupeKey}`);
    }

    audioManager
      .play(type, volume)
      .then((ok) => {
        if (!ok) {
          logWarn('Browser blocked autoplay — sound will play after next user gesture');
        }
      })
      .catch((err) => {
        logError('Notification sound failed:', err);
      });
  },

  triggerVibration: (): void => {
    if (typeof navigator === 'undefined' || !('vibrate' in navigator)) {
      logInfo('triggerVibration: navigator.vibrate unavailable');
      return;
    }
    try {
      navigator.vibrate([80, 40, 80]);
      logInfo('Vibration triggered');
    } catch (err) {
      logWarn('Vibration failed:', err);
    }
  },
};

export function getSoundState(): { contextState: string; warmedUp: boolean } {
  return audioManager.getState();
}
