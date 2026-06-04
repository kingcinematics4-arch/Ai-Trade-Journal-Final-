export type SoundType = 'notification' | 'success' | 'warning';

export const soundService = {
  play: (type: SoundType, volume: number = 0.5) => {
    if (typeof window === 'undefined' || typeof Audio === 'undefined' || !window.Audio) return;
    
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      // Default to 1.0 (Full) if volume is undefined
      audio.volume = Math.max(0, Math.min(1, typeof volume === 'number' ? volume : 1.0));
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Autoplay policy might block sound until user interacts with the page
          console.debug(`Sound playback blocked for ${type}:`, error);
        });
      }
    } catch (err) {
      console.error('Audio service playback error:', err);
    }
  },
  
  triggerVibration: (pattern: number[] = [100, 50, 100]) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        console.debug('Vibration suppressed:', e);
      }
    }
  }
};