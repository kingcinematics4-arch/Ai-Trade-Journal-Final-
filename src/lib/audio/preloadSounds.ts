import { audioManager } from '@/lib/audio';

export async function preloadNotificationSounds(): Promise<void> {
  console.info('[preloadSounds] Starting notification sound preload...');

  try {
    await audioManager.init();
    console.info('[preloadSounds] AudioContext initialized');
  } catch (err) {
    console.error('[preloadSounds] AudioContext init failed:', err);
    return;
  }

  audioManager.warmUp();

  const sounds: Array<{ type: 'notification' | 'success' | 'warning'; label: string }> = [
    { type: 'notification', label: 'notification' },
    { type: 'success', label: 'success' },
    { type: 'warning', label: 'warning' },
  ];

  for (const sound of sounds) {
    try {
      const ok = await audioManager.play(sound.type, 0.5);
      if (ok) {
        console.info(`[preloadSounds] Preloaded: ${sound.label}`);
      } else {
        console.info(`[preloadSounds] Deferred: ${sound.label} (will play after user gesture)`);
      }
    } catch (err) {
      console.warn(`[preloadSounds] Preload error for ${sound.label}:`, err);
    }
  }

  const state = audioManager.getState();
  console.info('[preloadSounds] Complete:', state);
}
