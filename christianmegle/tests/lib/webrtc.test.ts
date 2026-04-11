import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebRTCManager } from '../../src/lib/webrtc';

// ── Mocks ──────────────────────────────────────────────────────────

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function mockMediaStream() {
  const track = { stop: vi.fn(), kind: 'video' };
  return {
    getTracks: () => [track],
    _tracks: [track],
  };
}

function mockPeerConnection() {
  return {
    addTrack: vi.fn(),
    createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'fake-offer' }),
    createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'fake-answer' }),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    setRemoteDescription: vi.fn().mockResolvedValue(undefined),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    close: vi.fn(),
    connectionState: 'new',
    ontrack: null as any,
    onicecandidate: null as any,
    onconnectionstatechange: null as any,
  };
}

let mockPc: any;

vi.stubGlobal('RTCPeerConnection', class {
  addTrack = vi.fn();
  createOffer = vi.fn().mockResolvedValue({ type: 'offer', sdp: 'fake-offer' });
  createAnswer = vi.fn().mockResolvedValue({ type: 'answer', sdp: 'fake-answer' });
  setLocalDescription = vi.fn().mockResolvedValue(undefined);
  setRemoteDescription = vi.fn().mockResolvedValue(undefined);
  addIceCandidate = vi.fn().mockResolvedValue(undefined);
  close = vi.fn();
  connectionState = 'new';
  ontrack: any = null;
  onicecandidate: any = null;
  onconnectionstatechange: any = null;
  constructor() { mockPc = this; }
});

vi.stubGlobal('RTCSessionDescription', class {
  type: string; sdp: string;
  constructor(init: any) { this.type = init.type; this.sdp = init.sdp; }
});
vi.stubGlobal('RTCIceCandidate', class {
  candidate: string;
  constructor(init: any) { this.candidate = init.candidate; }
});

vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue(mockMediaStream()),
  },
});

// ── Mock SignalingClient ───────────────────────────────────────────

function mockSignaling() {
  const handlers = new Set<Function>();
  return {
    send: vi.fn(),
    onMessage: vi.fn((handler: Function) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    }),
    _handlers: handlers,
    _emit(msg: any) {
      handlers.forEach((h) => h(msg));
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────

describe('WebRTCManager', () => {
  let signaling: ReturnType<typeof mockSignaling>;
  let callbacks: {
    onRemoteStream: ReturnType<typeof vi.fn>;
    onConnectionStateChange: ReturnType<typeof vi.fn>;
    onPartnerLeft: ReturnType<typeof vi.fn>;
    onError: ReturnType<typeof vi.fn>;
  };
  let manager: WebRTCManager;

  beforeEach(() => {
    vi.clearAllMocks();
    signaling = mockSignaling();
    callbacks = {
      onRemoteStream: vi.fn(),
      onConnectionStateChange: vi.fn(),
      onPartnerLeft: vi.fn(),
      onError: vi.fn(),
    };
    manager = new WebRTCManager(signaling as any, callbacks, 'http://localhost:8787');

    // Default: ICE config fetch succeeds
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ iceServers: [{ urls: 'stun:stun.example.com' }] }),
    });
  });

  describe('getLocalStream', () => {
    it('calls getUserMedia with correct constraints', async () => {
      const stream = await manager.getLocalStream();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      expect(stream.getTracks()).toHaveLength(1);
    });

    it('returns same stream on subsequent calls', async () => {
      const s1 = await manager.getLocalStream();
      const s2 = await manager.getLocalStream();
      expect(s1).toBe(s2);
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });

    it('calls onError when getUserMedia fails', async () => {
      (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(new Error('Permission denied'));

      await expect(manager.getLocalStream()).rejects.toThrow('Permission denied');
      expect(callbacks.onError).toHaveBeenCalledWith('Permission denied');
    });
  });

  describe('initialize', () => {
    it('fetches ICE config from the API', async () => {
      await manager.initialize(false);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8787/api/ice-config');
    });

    it('falls back to defaults when ICE fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network'));

      await expect(manager.initialize(false)).resolves.toBeUndefined();
      // Should still create a peer connection (mockPc is set by constructor)
      expect(mockPc).toBeTruthy();
      expect(mockPc.addTrack).toHaveBeenCalled();
    });

    it('creates RTCPeerConnection and adds local tracks', async () => {
      await manager.initialize(false);

      expect(mockPc).toBeTruthy();
      expect(mockPc.addTrack).toHaveBeenCalled();
    });

    it('registers signaling message listener', async () => {
      await manager.initialize(false);

      expect(signaling.onMessage).toHaveBeenCalled();
    });

    it('creates and sends offer when initiator', async () => {
      await manager.initialize(true);

      expect(mockPc.createOffer).toHaveBeenCalled();
      expect(mockPc.setLocalDescription).toHaveBeenCalled();
      expect(signaling.send).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'offer' }),
      );
    });

    it('does not create offer when not initiator', async () => {
      await manager.initialize(false);

      expect(mockPc.createOffer).not.toHaveBeenCalled();
    });
  });

  describe('signaling message handling', () => {
    it('handles incoming offer by creating answer', async () => {
      await manager.initialize(false);

      signaling._emit({ type: 'offer', sdp: { type: 'offer', sdp: 'remote-offer' } });

      // Wait for async handling
      await vi.waitFor(() => {
        expect(mockPc.setRemoteDescription).toHaveBeenCalled();
        expect(mockPc.createAnswer).toHaveBeenCalled();
        expect(signaling.send).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'answer' }),
        );
      });
    });

    it('handles incoming answer', async () => {
      await manager.initialize(true);

      signaling._emit({ type: 'answer', sdp: { type: 'answer', sdp: 'remote-answer' } });

      await vi.waitFor(() => {
        expect(mockPc.setRemoteDescription).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'answer' }),
        );
      });
    });

    it('handles incoming ICE candidate', async () => {
      await manager.initialize(false);

      signaling._emit({ type: 'ice-candidate', candidate: { candidate: 'c1' } });

      await vi.waitFor(() => {
        expect(mockPc.addIceCandidate).toHaveBeenCalled();
      });
    });

    it('calls onPartnerLeft on partner-left message', async () => {
      await manager.initialize(false);

      signaling._emit({ type: 'partner-left' });

      await vi.waitFor(() => {
        expect(callbacks.onPartnerLeft).toHaveBeenCalled();
      });
    });
  });

  describe('ICE candidate sending', () => {
    it('sends ICE candidates via signaling', async () => {
      await manager.initialize(false);

      // Trigger the onicecandidate callback
      const candidate = { candidate: 'test-candidate', toJSON: () => ({ candidate: 'test-candidate' }) };
      mockPc.onicecandidate?.({ candidate });

      expect(signaling.send).toHaveBeenCalledWith({
        type: 'ice-candidate',
        candidate: { candidate: 'test-candidate' },
      });
    });
  });

  describe('connection state monitoring', () => {
    it('forwards connection state changes', async () => {
      await manager.initialize(false);

      mockPc.connectionState = 'connected';
      mockPc.onconnectionstatechange?.();

      expect(callbacks.onConnectionStateChange).toHaveBeenCalledWith('connected');
    });

    it('reports error on connection failure', async () => {
      await manager.initialize(false);

      mockPc.connectionState = 'failed';
      mockPc.onconnectionstatechange?.();

      expect(callbacks.onError).toHaveBeenCalledWith(
        'Connection failed. The other person may have left.',
      );
    });
  });

  describe('endSession', () => {
    it('sends end-session and cleans up peer connection', async () => {
      await manager.initialize(false);

      manager.endSession();

      expect(signaling.send).toHaveBeenCalledWith({ type: 'end-session' });
      expect(mockPc.close).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('closes peer connection but keeps local stream', async () => {
      const stream = await manager.getLocalStream();
      await manager.initialize(false);

      manager.cleanup();

      expect(mockPc.close).toHaveBeenCalled();
      // Stream tracks should NOT be stopped
      expect(stream.getTracks()[0].stop).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('stops all tracks and closes peer connection', async () => {
      const stream = await manager.getLocalStream();
      await manager.initialize(false);

      manager.destroy();

      expect(mockPc.close).toHaveBeenCalled();
      expect(stream.getTracks()[0].stop).toHaveBeenCalled();
    });
  });
});
