export type SoundType = 'notification' | 'success' | 'warning';

export const soundService = {
  play: (type: SoundType, volume: number = 0.5) => {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.volume = Math.max(0, Math.min(1, volume));

      // Handle potential browser autoplay blocks
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.debug('Playback blocked by browser settings:', error);
        });
      }
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  },

  triggerVibration: () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },
};
