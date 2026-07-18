export type SoundType = 'notification' | 'success' | 'warning';

function playSynthesizedTone(type: SoundType, volume: number): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const level = Math.max(0, Math.min(1, volume)) * 0.08;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, now);
    masterGain.connect(ctx.destination);

    if (type === 'notification') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
      masterGain.gain.setValueAtTime(level, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    } else if (type === 'success') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523, now);
      osc.frequency.setValueAtTime(659, now + 0.1);
      osc.frequency.setValueAtTime(784, now + 0.2);
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.35);
      masterGain.gain.setValueAtTime(level, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    } else if (type === 'warning') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(349, now + 0.18);
      gain.gain.setValueAtTime(level, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.24);
      masterGain.gain.setValueAtTime(level, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    }
  } catch (error) {
    console.warn('[soundService] Audio playback failed:', error);
  }
}

export function unlockNotificationAudio(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];
  const onGesture = () => {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    events.forEach((evt) => window.removeEventListener(evt, onGesture));
  };
  events.forEach((evt) => window.addEventListener(evt, onGesture, { once: true, passive: true }));
}

export const soundService = {
  play: (type: SoundType, volume: number = 0.5) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined' || !window.Audio) return;

    try {
      playSynthesizedTone(type, volume);
    } catch (err) {
      console.error('Audio service playback error:', err);
    }
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
