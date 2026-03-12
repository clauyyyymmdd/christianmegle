type SoundEffect = 'organ-swell' | 'sanctus-bells' | 'ambient-silence';

interface AudioConfig {
  src: string;
  volume: number;
  loop?: boolean;
}

const AUDIO_CONFIG: Record<SoundEffect, AudioConfig> = {
  'organ-swell': {
    src: '/assets/audio/organ-swell.mp3',
    volume: 0.6,
    loop: false,
  },
  'sanctus-bells': {
    src: '/assets/audio/sanctus-bells.mp3',
    volume: 0.7,
    loop: false,
  },
  'ambient-silence': {
    src: '/assets/audio/ambient-silence.mp3',
    volume: 0.3,
    loop: true,
  },
};

export class AudioManager {
  private audioCache: Map<SoundEffect, HTMLAudioElement> = new Map();
  private activeLoops: Map<SoundEffect, HTMLAudioElement> = new Map();
  private preloaded = false;

  /**
   * Preload all audio files for instant playback
   */
  async preload(): Promise<void> {
    if (this.preloaded) return;

    const loadPromises = Object.entries(AUDIO_CONFIG).map(([key, config]) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.src = config.src;
        audio.volume = config.volume;
        audio.loop = config.loop ?? false;
        audio.preload = 'auto';

        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', () => {
          console.warn(`[AudioManager] Failed to load: ${config.src}`);
          resolve();
        });

        this.audioCache.set(key as SoundEffect, audio);
      });
    });

    await Promise.all(loadPromises);
    this.preloaded = true;
  }

  /**
   * Play a one-shot sound effect
   */
  play(sound: SoundEffect): void {
    const cached = this.audioCache.get(sound);
    if (!cached) {
      console.warn(`[AudioManager] Sound not loaded: ${sound}`);
      return;
    }

    // Clone the audio element for overlapping playback
    const audio = cached.cloneNode(true) as HTMLAudioElement;
    audio.volume = AUDIO_CONFIG[sound].volume;

    audio.play().catch((e) => {
      // Autoplay may be blocked — that's okay
      console.warn('[AudioManager] Playback blocked:', e.message);
    });
  }

  /**
   * Start a looping sound
   */
  startLoop(sound: SoundEffect): void {
    if (this.activeLoops.has(sound)) return;

    const cached = this.audioCache.get(sound);
    if (!cached) {
      console.warn(`[AudioManager] Sound not loaded: ${sound}`);
      return;
    }

    const audio = cached.cloneNode(true) as HTMLAudioElement;
    audio.volume = AUDIO_CONFIG[sound].volume;
    audio.loop = true;

    audio.play().catch((e) => {
      console.warn('[AudioManager] Loop playback blocked:', e.message);
    });

    this.activeLoops.set(sound, audio);
  }

  /**
   * Stop a looping sound
   */
  stopLoop(sound: SoundEffect): void {
    const audio = this.activeLoops.get(sound);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      this.activeLoops.delete(sound);
    }
  }

  /**
   * Stop all currently playing loops
   */
  stopAllLoops(): void {
    this.activeLoops.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    this.activeLoops.clear();
  }

  /**
   * Clean up all audio resources
   */
  destroy(): void {
    this.stopAllLoops();
    this.audioCache.clear();
    this.preloaded = false;
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
