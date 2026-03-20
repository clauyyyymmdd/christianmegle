type SoundEffect = 'organ-swell' | 'sanctus-bells' | 'ambient-silence' | 'chat-message';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private activeLoops: Map<SoundEffect, { oscillator: OscillatorNode; gain: GainNode }> = new Map();
  private initialized = false;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  async preload(): Promise<void> {
    if (this.initialized) return;

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      this.initialized = true;
    } catch (e) {
      console.warn('[AudioManager] Failed to initialize:', e);
    }
  }

  /**
   * Play a one-shot sound effect using Web Audio API
   */
  play(sound: SoundEffect): void {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      switch (sound) {
        case 'organ-swell':
          this.playOrganSwell(ctx);
          break;
        case 'sanctus-bells':
          this.playSanctusBells(ctx);
          break;
        case 'chat-message':
          this.playChatNotification(ctx);
          break;
      }
    } catch (e) {
      console.warn('[AudioManager] Playback failed:', e);
    }
  }

  private playOrganSwell(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const duration = 4;

    // Create multiple oscillators for rich organ sound
    const frequencies = [130.81, 261.63, 329.63, 392.0]; // C3, C4, E4, G4

    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 800;

      // Swell envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15 - i * 0.02, now + 1.5);
      gain.gain.linearRampToValueAtTime(0.1 - i * 0.015, now + 3);
      gain.gain.linearRampToValueAtTime(0, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  }

  private playSanctusBells(ctx: AudioContext): void {
    const now = ctx.currentTime;

    // Three bell strikes
    const bellFrequencies = [1200, 1500, 1800];
    const delays = [0, 0.15, 0.3];

    bellFrequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delays[i]);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + delays[i] + 1.5);

      // Bell decay envelope
      gain.gain.setValueAtTime(0, now + delays[i]);
      gain.gain.linearRampToValueAtTime(0.3, now + delays[i] + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delays[i] + 1.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[i]);
      osc.stop(now + delays[i] + 1.5);
    });
  }

  private playChatNotification(ctx: AudioContext): void {
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1000, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Start a looping ambient sound
   */
  startLoop(sound: SoundEffect): void {
    if (this.activeLoops.has(sound)) return;

    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (sound === 'ambient-silence') {
        this.startAmbientSilence(ctx, sound);
      }
    } catch (e) {
      console.warn('[AudioManager] Loop start failed:', e);
    }
  }

  private startAmbientSilence(ctx: AudioContext, sound: SoundEffect): void {
    // Very low drone for "silence" ambiance
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.value = 60; // Low hum

    filter.type = 'lowpass';
    filter.frequency.value = 100;

    gain.gain.value = 0.05; // Very quiet

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    this.activeLoops.set(sound, { oscillator: osc, gain });
  }

  /**
   * Stop a looping sound
   */
  stopLoop(sound: SoundEffect): void {
    const loop = this.activeLoops.get(sound);
    if (loop) {
      try {
        loop.gain.gain.linearRampToValueAtTime(0, this.getContext().currentTime + 0.5);
        setTimeout(() => {
          loop.oscillator.stop();
        }, 500);
      } catch (e) {
        // Oscillator may already be stopped
      }
      this.activeLoops.delete(sound);
    }
  }

  /**
   * Stop all currently playing loops
   */
  stopAllLoops(): void {
    this.activeLoops.forEach((_, sound) => {
      this.stopLoop(sound);
    });
  }

  /**
   * Clean up all audio resources
   */
  destroy(): void {
    this.stopAllLoops();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.initialized = false;
  }
}

// Singleton instance for easy access
let audioManagerInstance: AudioManager | null = null;

export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}
