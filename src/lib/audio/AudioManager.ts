import type { SoundType } from '@/services/soundService';

type SoundKey = SoundType;

interface SoundCtx {
  ctx: AudioContext;
  warmedUp: boolean;
}

const CACHE: Partial<Record<SoundKey, SoundCtx>> = {};

let sharedCtx: AudioContext | null = null;
let sharedCtxWarmedUp = false;

function getSharedContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (sharedCtx && sharedCtx.state !== 'closed') return sharedCtx;

  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
    sharedCtxWarmedUp = false;
    return sharedCtx;
  } catch (err) {
    console.error('[AudioManager] AudioContext creation failed:', err);
    return null;
  }
}

async function resumeContext(ctx: AudioContext): Promise<boolean> {
  if (ctx.state === 'running') return true;
  try {
    await ctx.resume();
    return ctx.state === 'running';
  } catch (err) {
    console.warn('[AudioManager] AudioContext resume failed:', err);
    return false;
  }
}

export class AudioManager {
  private _initialized = false;

  async init(): Promise<void> {
    if (this._initialized) return;
    this._initialized = true;

    const ctx = getSharedContext();
    if (!ctx) {
      console.error('[AudioManager] init: AudioContext unavailable — sounds disabled');
      return;
    }

    const warmed = await resumeContext(ctx);
    sharedCtxWarmedUp = warmed;
    const status = warmed ? '(resumed)' : '(still suspended — awaiting user gesture)';
    console.info(`[AudioManager] init: AudioContext ${ctx.state} ${status}`);
  }

  warmUp(): void {
    const ctx = getSharedContext();
    if (!ctx) return;
    if (sharedCtxWarmedUp) return;

    if (ctx.state === 'suspended') {
      void ctx.resume().then(
        () => {
          sharedCtxWarmedUp = true;
          console.info('[AudioManager] warmUp: AudioContext resumed via user gesture');
        },
        (err) => {
          console.warn('[AudioManager] warmUp: AudioContext resume rejected:', err);
        }
      );
    } else if (ctx.state === 'running') {
      sharedCtxWarmedUp = true;
      console.info('[AudioManager] warmUp: AudioContext already running');
    }
  }

  bindUnlock(): void {
    if (typeof window === 'undefined') return;
    const events: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart'];

    const onGesture = () => {
      console.info('[AudioManager] User gesture detected — unlocking audio');
      this.warmUp();
      events.forEach((evt) => window.removeEventListener(evt, onGesture));
    };

    events.forEach((evt) => window.addEventListener(evt, onGesture, { once: true, passive: true }));
    console.info('[AudioManager] Unlock listeners bound (waiting for user gesture)');
  }

  async play(type: SoundKey, volume: number = 0.5): Promise<boolean> {
    if (typeof window === 'undefined') {
      console.warn('[AudioManager] play: window undefined — skipped');
      return false;
    }

    console.info(`[AudioManager] play: type=${type} volume=${volume}`);

    const ctx = getSharedContext();
    if (!ctx) {
      console.error('[AudioManager] play: AudioContext unavailable');
      return false;
    }

    if (ctx.state === 'suspended') {
      console.info('[AudioManager] play: context suspended, attempting resume...');
      const resumed = await resumeContext(ctx);
      if (!resumed) {
        console.warn(
          '[AudioManager] play: browser blocked autoplay — audio will play after next user gesture'
        );
        this.bindUnlock();
        return false;
      }
      console.info('[AudioManager] play: AudioContext resumed successfully');
    }

    const cache = CACHE[type];
    const ctxForPlay = cache?.ctx ?? ctx;
    const warm = cache?.warmedUp ?? sharedCtxWarmedUp;

    if (!warm) {
      console.info(`[AudioManager] play: context not fully warmed for type=${type}, warming now`);
      this.warmUp();
    }

    return this._synthesize(ctxForPlay, type, volume);
  }

  private _synthesize(ctx: AudioContext, type: SoundKey, volume: number): boolean {
    try {
      const masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);

      const level = Math.max(0, Math.min(1, volume)) * 0.06;
      const now = ctx.currentTime;

      masterGain.gain.setValueAtTime(0, now);

      switch (type) {
        case 'notification': {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          const gain2 = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(523, now);
          osc1.connect(gain1).connect(masterGain);
          gain1.gain.setValueAtTime(0, now);
          gain1.gain.linearRampToValueAtTime(level, now + 0.004);
          gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
          osc1.start(now);
          osc1.stop(now + 0.12);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(659, now + 0.07);
          osc2.connect(gain2).connect(masterGain);
          gain2.gain.setValueAtTime(0, now);
          gain2.gain.linearRampToValueAtTime(level * 0.85, now + 0.074);
          gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
          osc2.start(now + 0.07);
          osc2.stop(now + 0.2);

          masterGain.gain.linearRampToValueAtTime(level, now + 0.004);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
          break;
        }

        case 'success': {
          const notes = [523, 659, 784];
          notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.connect(g).connect(masterGain);
            const start = now + i * 0.09;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(level * 0.7, start + 0.005);
            g.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
            osc.start(start);
            osc.stop(start + 0.14);
          });
          masterGain.gain.linearRampToValueAtTime(level, now + 0.005);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          break;
        }

        case 'warning': {
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.linearRampToValueAtTime(349, now + 0.18);
          osc.connect(g).connect(masterGain);
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(level, now + 0.005);
          g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
          osc.start(now);
          osc.stop(now + 0.24);
          masterGain.gain.linearRampToValueAtTime(level, now + 0.005);
          masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
          break;
        }

        default:
          console.warn(`[AudioManager] Unknown sound type: ${type}`);
          return false;
      }

      console.info(`[AudioManager] Playback success: type=${type}`);
      return true;
    } catch (err) {
      console.error(`[AudioManager] Playback failed: type=${type}`, err);
      return false;
    }
  }

  getState(): { contextState: string; warmedUp: boolean } {
    return {
      contextState: sharedCtx?.state ?? 'no-context',
      warmedUp: sharedCtxWarmedUp,
    };
  }

  destroy(): void {
    if (sharedCtx && sharedCtx.state !== 'closed') {
      try {
        sharedCtx.close();
      } catch {
        // ignore
      }
    }
    sharedCtx = null;
    sharedCtxWarmedUp = false;
    this._initialized = false;
    console.info('[AudioManager] Destroyed');
  }
}

export const audioManager = new AudioManager();
