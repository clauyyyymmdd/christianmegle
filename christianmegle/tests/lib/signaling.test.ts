import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SignalingClient } from '../../src/lib/signaling';

// ── Mock WebSocket ─────────────────────────────────────────────────

let instances: MockWebSocket[] = [];

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  url: string;
  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  sent: string[] = [];

  constructor(url: string) {
    this.url = url;
    instances.push(this);
    // Auto-open on next tick, set readyState to OPEN
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);

beforeEach(() => {
  instances = [];
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ──────────────────────────────────────────────────────────

describe('SignalingClient', () => {
  describe('constructor', () => {
    it('converts http to ws', () => {
      const client = new SignalingClient('http://localhost:8787');
      client.connect('sinner');
      expect(instances[0].url).toBe('ws://localhost:8787/ws');
      client.disconnect();
    });

    it('converts https to wss', () => {
      const client = new SignalingClient('https://example.com');
      client.connect('priest');
      expect(instances[0].url).toBe('wss://example.com/ws');
      client.disconnect();
    });
  });

  describe('connect', () => {
    it('resolves on open and sends join message', async () => {
      const client = new SignalingClient('http://localhost:8787');
      await client.connect('sinner');

      const ws = instances[0];
      expect(ws.sent).toHaveLength(1);
      expect(JSON.parse(ws.sent[0])).toEqual({ type: 'join', role: 'sinner', priestId: undefined });

      client.disconnect();
    });

    it('includes priestId when provided', async () => {
      const client = new SignalingClient('http://localhost:8787');
      await client.connect('priest', 'priest-123');

      const join = JSON.parse(instances[0].sent[0]);
      expect(join.priestId).toBe('priest-123');

      client.disconnect();
    });

    it('rejects on error', async () => {
      // Override to trigger error instead of open
      vi.stubGlobal('WebSocket', class {
        static OPEN = 1;
        static CLOSED = 3;
        readyState = 0;
        onopen: any = null;
        onmessage: any = null;
        onclose: any = null;
        onerror: any = null;
        sent: string[] = [];
        constructor(public url: string) {
          instances.push(this as any);
          // Fire error only — no onopen
          setTimeout(() => this.onerror?.(new Event('error')), 0);
        }
        send(data: string) { this.sent.push(data); }
        close() { this.readyState = 3; }
      });

      const client = new SignalingClient('http://localhost:8787');
      await expect(client.connect('sinner')).rejects.toBeTruthy();

      client.disconnect();
      vi.stubGlobal('WebSocket', MockWebSocket);
    });
  });

  describe('message handling', () => {
    it('dispatches parsed messages to registered handlers', async () => {
      const client = new SignalingClient('http://localhost:8787');
      const handler = vi.fn();
      client.onMessage(handler);

      await client.connect('sinner');

      const ws = instances[0];
      ws.onmessage?.({ data: JSON.stringify({ type: 'waiting', position: 3 }) });

      expect(handler).toHaveBeenCalledWith({ type: 'waiting', position: 3 });

      client.disconnect();
    });

    it('supports multiple handlers', async () => {
      const client = new SignalingClient('http://localhost:8787');
      const h1 = vi.fn();
      const h2 = vi.fn();
      client.onMessage(h1);
      client.onMessage(h2);

      await client.connect('sinner');
      instances[0].onmessage?.({ data: JSON.stringify({ type: 'waiting', position: 1 }) });

      expect(h1).toHaveBeenCalledTimes(1);
      expect(h2).toHaveBeenCalledTimes(1);

      client.disconnect();
    });

    it('unsubscribe removes handler', async () => {
      const client = new SignalingClient('http://localhost:8787');
      const handler = vi.fn();
      const unsub = client.onMessage(handler);

      await client.connect('sinner');
      unsub();

      instances[0].onmessage?.({ data: JSON.stringify({ type: 'waiting', position: 1 }) });
      expect(handler).not.toHaveBeenCalled();

      client.disconnect();
    });

    it('stops reconnecting after matched message', async () => {
      const client = new SignalingClient('http://localhost:8787');
      await client.connect('sinner');

      const ws = instances[0];
      ws.onmessage?.({ data: JSON.stringify({ type: 'matched', partnerId: 'abc', initiator: true }) });

      // After matched, shouldReconnect is false — closing won't trigger reconnect
      // (We can't directly test the private field, but we verify no new WS is created)
      ws.onclose?.({ code: 1000, reason: '' });

      // Give time for any reconnect attempt
      await new Promise((r) => setTimeout(r, 50));
      expect(instances).toHaveLength(1); // No new connection

      client.disconnect();
    });
  });

  describe('send', () => {
    it('sends JSON when socket is open', async () => {
      const client = new SignalingClient('http://localhost:8787');
      await client.connect('sinner');

      client.send({ type: 'end-session' });

      const ws = instances[0];
      // First message is join, second is end-session
      expect(JSON.parse(ws.sent[1])).toEqual({ type: 'end-session' });

      client.disconnect();
    });

    it('does not send when socket is closed', async () => {
      const client = new SignalingClient('http://localhost:8787');
      await client.connect('sinner');

      const ws = instances[0];
      const sentBefore = ws.sent.length;
      ws.readyState = MockWebSocket.CLOSED;

      client.send({ type: 'end-session' });
      expect(ws.sent).toHaveLength(sentBefore);

      client.disconnect();
    });
  });

  describe('disconnect', () => {
    it('closes socket and clears handlers', async () => {
      const client = new SignalingClient('http://localhost:8787');
      const handler = vi.fn();
      client.onMessage(handler);

      await client.connect('sinner');
      client.disconnect();

      expect(instances[0].readyState).toBe(MockWebSocket.CLOSED);
      expect(client.connected).toBe(false);
    });
  });

  describe('connected getter', () => {
    it('returns true when socket is open', async () => {
      const client = new SignalingClient('http://localhost:8787');
      await client.connect('sinner');

      expect(client.connected).toBe(true);

      client.disconnect();
    });

    it('returns false when disconnected', () => {
      const client = new SignalingClient('http://localhost:8787');
      expect(client.connected).toBe(false);
    });
  });
});
