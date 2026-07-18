const NOTIFICATION_SOUND_URL = '/sounds/notification.mp3';

let audio: HTMLAudioElement | null = null;
let isPreloaded = false;
let loadStarted = false;

function getAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined' || typeof Audio === 'undefined') return null;
  if (audio) return audio;

  console.log('[soundService] Loading notification.mp3');
  const el = new Audio(NOTIFICATION_SOUND_URL);
  el.preload = 'auto';
  el.volume = 1;
  el.addEventListener('canplaythrough', () => {
    isPreloaded = true;
    console.log('[soundService] notification.mp3 ready (canplaythrough)');
  });
  el.addEventListener('error', () => {
    console.error('[soundService] Failed to load notification.mp3');
  });

  audio = el;
  loadStarted = true;
  return el;
}

/** Preload the MP3 once so playback is instant on first notification. */
export function preloadNotificationSound(): void {
  if (loadStarted) return;
  getAudio();
}

/**
 * Unlock audio after the user's first interaction (autoplay policy).
 * Browsers block audio until a gesture occurs, so we attach one-shot
 * listeners for click / key / touch and trigger a silent load.
 */
export function unlockNotificationAudio(): void {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    const el = getAudio();
    if (el) {
      // Touch the audio element so the browser allows later playback.
      el.load();
      void el.play().then(() => {
        el.pause();
        el.currentTime = 0;
        console.log('[soundService] Audio unlocked after user interaction');
      }).catch(() => undefined);
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };

  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

export const soundService = {
  /**
   * Play the cached notification.mp3. The `id` arg (if provided) is used
   * only for caller-side de-duplication logging; playback always reuses the
   * single cached Audio object and resets currentTime before replay.
   */
  play: (type: 'notification' | 'success' | 'warning', volume = 1, id?: string) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    if (type !== 'notification') return;

    const el = getAudio();
    if (!el) return;

    console.log(`[soundService] Sound service called (${id ?? 'n/a'})`);

    el.volume = Math.max(0, Math.min(1, volume));

    try {
      el.currentTime = 0;
    } catch {
      // Some browsers throw if seeking before metadata is loaded; ignore.
    }

    console.log('[soundService] Playing notification sound');
    void el.play().then(() => {
      console.log('[soundService] Playback succeeded');
    }).catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[soundService] Playback failed:', msg);
    });
  },

  triggerVibration: (pattern: number[] = [100, 50, 100]) => {
    if (
      typeof window !== 'undefined' &&
      typeof navigator !== 'undefined' &&
      'vibrate' in navigator
    ) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.info('Vibration suppressed:', e);
      }
    }
  },
};
