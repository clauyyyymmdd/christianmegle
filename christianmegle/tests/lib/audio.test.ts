import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager, getAudioManager } from '../../src/lib/audio';

// ── Mock Web Audio API ─────────────────────────────────────────────

function mockGainNode() {
  return {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

function mockOscillatorNode() {
  return {
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function mockBiquadFilterNode() {
  return {
    type: 'lowpass',
    frequency: { value: 350 },
    connect: vi.fn(),
  };
}

class MockAudioContext {
  currentTime = 0;
  state = 'running';
  resume = vi.fn();
  close = vi.fn();
  destination = {};

  createOscillator = vi.fn(() => mockOscillatorNode());
  createGain = vi.fn(() => mockGainNode());
  createBiquadFilter = vi.fn(() => mockBiquadFilterNode());
}

vi.stubGlobal('AudioContext', MockAudioContext);

// ── Tests ──────────────────────────────────────────────────────────

describe('AudioManager', () => {
  let manager: AudioManager;

  beforeEach(() => {
    manager = new AudioManager();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('preload', () => {
    it('is a no-op that resolves immediately', async () => {
      await expect(manager.preload()).resolves.toBeUndefined();
    });
  });

  describe('play', () => {
    it('creates oscillators for organ-swell', () => {
      manager.play('organ-swell');
      // Organ swell uses 4 oscillators (C3, C4, E4, G4)
      // Each needs an oscillator + gain + filter
      const ctx = (manager as any).audioContext as MockAudioContext;
      expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
      expect(ctx.createGain).toHaveBeenCalledTimes(4);
      expect(ctx.createBiquadFilter).toHaveBeenCalledTimes(4);
    });

    it('creates oscillators for sanctus-bells', () => {
      manager.play('sanctus-bells');
      // 3 bell strikes
      const ctx = (manager as any).audioContext as MockAudioContext;
      expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
      expect(ctx.createGain).toHaveBeenCalledTimes(3);
    });

    it('creates oscillator for chat-message', () => {
      manager.play('chat-message');
      const ctx = (manager as any).audioContext as MockAudioContext;
      expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
      expect(ctx.createGain).toHaveBeenCalledTimes(1);
    });

    it('does not crash when AudioContext is unavailable', () => {
      const orig = globalThis.AudioContext;
      vi.stubGlobal('AudioContext', class { constructor() { throw new Error('not supported'); } });

      const m = new AudioManager();
      expect(() => m.play('organ-swell')).not.toThrow();

      vi.stubGlobal('AudioContext', orig);
    });
  });

  describe('startLoop / stopLoop', () => {
    it('starts ambient-silence loop', () => {
      manager.startLoop('ambient-silence');
      const ctx = (manager as any).audioContext as MockAudioContext;
      expect(ctx.createOscillator).toHaveBeenCalled();
    });

    it('does not start duplicate loops', () => {
      manager.startLoop('ambient-silence');
      const ctx = (manager as any).audioContext as MockAudioContext;
      const callCount = ctx.createOscillator.mock.calls.length;

      manager.startLoop('ambient-silence');
      expect(ctx.createOscillator).toHaveBeenCalledTimes(callCount);
    });

    it('stopLoop removes the loop entry', () => {
      manager.startLoop('ambient-silence');
      manager.stopLoop('ambient-silence');

      // Starting again should succeed (not deduplicated)
      const ctx = (manager as any).audioContext as MockAudioContext;
      const before = ctx.createOscillator.mock.calls.length;
      manager.startLoop('ambient-silence');
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThan(before);
    });

    it('stopLoop is safe on non-existent loop', () => {
      expect(() => manager.stopLoop('sanctus-bells')).not.toThrow();
    });
  });

  describe('stopAllLoops', () => {
    it('clears all active loops', () => {
      manager.startLoop('ambient-silence');
      manager.stopAllLoops();

      // Loop map should be empty — starting again creates new oscillator
      const ctx = (manager as any).audioContext as MockAudioContext;
      const before = ctx.createOscillator.mock.calls.length;
      manager.startLoop('ambient-silence');
      expect(ctx.createOscillator.mock.calls.length).toBeGreaterThan(before);
    });
  });

  describe('destroy', () => {
    it('closes the audio context', () => {
      // Trigger context creation
      manager.play('chat-message');
      const ctx = (manager as any).audioContext as MockAudioContext;

      manager.destroy();

      expect(ctx.close).toHaveBeenCalled();
      expect((manager as any).audioContext).toBeNull();
    });

    it('is safe to call multiple times', () => {
      manager.destroy();
      expect(() => manager.destroy()).not.toThrow();
    });
  });

  describe('context resume', () => {
    it('resumes suspended context', () => {
      // First call creates context
      manager.play('chat-message');
      const ctx = (manager as any).audioContext as MockAudioContext;
      ctx.state = 'suspended';

      // Second call should resume
      manager.play('chat-message');
      expect(ctx.resume).toHaveBeenCalled();
    });
  });
});

describe('getAudioManager', () => {
  it('returns a singleton', () => {
    const a = getAudioManager();
    const b = getAudioManager();
    expect(a).toBe(b);
  });
});
