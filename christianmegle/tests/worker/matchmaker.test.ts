import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Test the matchmaker's queue logic by extracting and exercising
 * handleJoin / handleDisconnect / relay directly. Since the Matchmaker
 * class is tightly coupled to Cloudflare Durable Objects and WebSocketPair,
 * we simulate it with mock WebSockets and call the logic through the
 * public message handler path.
 */

// --- Mock WebSocket ---

class MockWebSocket {
  readyState = 1; // OPEN
  sent: string[] = [];
  closed = false;

  send(data: string) {
    if (this.readyState !== 1) throw new Error('Socket not open');
    this.sent.push(data);
  }

  close() {
    this.readyState = 3;
    this.closed = true;
  }

  get messages() {
    return this.sent.map((s) => JSON.parse(s));
  }

  lastMessage() {
    return this.messages[this.messages.length - 1];
  }
}

// --- Matchmaker test harness ---
// Replicates the core queue/session logic from matchmaker.ts
// without Durable Object / WebSocketPair dependencies.

type UserRole = 'priest' | 'sinner';

interface WaitingUser {
  ws: MockWebSocket;
  role: UserRole;
  priestId?: string;
}

interface SessionInfo {
  priest: string;
  sinner: string;
}

class TestMatchmaker {
  waitingPriests = new Map<string, WaitingUser>();
  waitingSinners = new Map<string, WaitingUser>();
  sessions = new Map<string, SessionInfo>();
  userToSession = new Map<string, string>();
  userConnections = new Map<string, MockWebSocket>();
  userRoles = new Map<string, UserRole>();
  private nextId = 0;

  join(role: UserRole, ws: MockWebSocket, priestId?: string): string {
    const userId = `user-${this.nextId++}`;
    this.userConnections.set(userId, ws);
    this.userRoles.set(userId, role);

    const user: WaitingUser = { ws, role, priestId };

    if (role === 'priest') {
      const partner = this.findLivePartner(this.waitingSinners);
      if (partner) {
        const [sinnerId, sinner] = partner;
        this.waitingSinners.delete(sinnerId);
        this.createSession(userId, ws, sinnerId, sinner.ws);
      } else {
        this.waitingPriests.set(userId, user);
        this.sendTo(ws, { type: 'waiting', position: this.waitingPriests.size });
      }
    } else {
      const partner = this.findLivePartner(this.waitingPriests);
      if (partner) {
        const [pId, priest] = partner;
        this.waitingPriests.delete(pId);
        this.createSession(pId, priest.ws, userId, ws);
      } else {
        this.waitingSinners.set(userId, user);
        this.sendTo(ws, { type: 'waiting', position: this.waitingSinners.size });
      }
    }

    return userId;
  }

  disconnect(userId: string) {
    this.waitingPriests.delete(userId);
    this.waitingSinners.delete(userId);

    const sessionId = this.userToSession.get(userId);
    if (sessionId) {
      const session = this.sessions.get(sessionId)!;
      const partnerId = session.priest === userId ? session.sinner : session.priest;
      const partnerWs = this.userConnections.get(partnerId);
      if (partnerWs) this.sendTo(partnerWs, { type: 'partner-left' });
      this.sessions.delete(sessionId);
      this.userToSession.delete(userId);
      this.userToSession.delete(partnerId);
    }

    this.userConnections.delete(userId);
    this.userRoles.delete(userId);
  }

  relay(userId: string, msg: any) {
    const sessionId = this.userToSession.get(userId);
    if (!sessionId) return;
    const session = this.sessions.get(sessionId);
    if (!session) return;
    const partnerId = session.priest === userId ? session.sinner : session.priest;
    const partnerWs = this.userConnections.get(partnerId);
    if (partnerWs) this.sendTo(partnerWs, msg);
  }

  private createSession(priestId: string, priestWs: MockWebSocket, sinnerId: string, sinnerWs: MockWebSocket) {
    const sessionId = `session-${this.nextId++}`;
    this.sessions.set(sessionId, { priest: priestId, sinner: sinnerId });
    this.userToSession.set(priestId, sessionId);
    this.userToSession.set(sinnerId, sessionId);
    this.sendTo(priestWs, { type: 'matched', partnerId: sinnerId, initiator: true });
    this.sendTo(sinnerWs, { type: 'matched', partnerId: priestId, initiator: false });
  }

  private findLivePartner(map: Map<string, WaitingUser>): [string, WaitingUser] | undefined {
    for (const [id, user] of map) {
      if (user.ws.readyState === 1) return [id, user];
      map.delete(id);
      this.userConnections.delete(id);
      this.userRoles.delete(id);
    }
    return undefined;
  }

  private sendTo(ws: MockWebSocket, msg: any): boolean {
    try {
      if (ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// --- Tests ---

let mm: TestMatchmaker;

beforeEach(() => {
  mm = new TestMatchmaker();
});

describe('basic matching', () => {
  it('matches a waiting sinner with a joining priest', () => {
    const sinnerWs = new MockWebSocket();
    const priestWs = new MockWebSocket();

    mm.join('sinner', sinnerWs);
    mm.join('priest', priestWs);

    expect(priestWs.lastMessage()).toMatchObject({ type: 'matched', initiator: true });
    expect(sinnerWs.lastMessage()).toMatchObject({ type: 'matched', initiator: false });
  });

  it('matches a waiting priest with a joining sinner', () => {
    const priestWs = new MockWebSocket();
    const sinnerWs = new MockWebSocket();

    mm.join('priest', priestWs);
    mm.join('sinner', sinnerWs);

    expect(priestWs.lastMessage()).toMatchObject({ type: 'matched', initiator: true });
    expect(sinnerWs.lastMessage()).toMatchObject({ type: 'matched', initiator: false });
  });

  it('sends waiting position when no partner available', () => {
    const ws = new MockWebSocket();
    mm.join('sinner', ws);

    expect(ws.lastMessage()).toEqual({ type: 'waiting', position: 1 });
  });

  it('priest is always the initiator', () => {
    const sinnerWs = new MockWebSocket();
    const priestWs = new MockWebSocket();

    mm.join('sinner', sinnerWs);
    mm.join('priest', priestWs);

    expect(priestWs.lastMessage().initiator).toBe(true);
    expect(sinnerWs.lastMessage().initiator).toBe(false);
  });
});

describe('multiple users in queue', () => {
  it('matches in FIFO order — first sinner gets first priest', () => {
    const sinner1 = new MockWebSocket();
    const sinner2 = new MockWebSocket();
    const sinner3 = new MockWebSocket();
    const priest1 = new MockWebSocket();

    mm.join('sinner', sinner1);
    mm.join('sinner', sinner2);
    mm.join('sinner', sinner3);

    // Sinners should get waiting positions
    expect(sinner1.messages[0]).toEqual({ type: 'waiting', position: 1 });
    expect(sinner2.messages[0]).toEqual({ type: 'waiting', position: 2 });
    expect(sinner3.messages[0]).toEqual({ type: 'waiting', position: 3 });

    // Priest joins — should match with sinner1 (first in queue)
    mm.join('priest', priest1);

    expect(sinner1.lastMessage()).toMatchObject({ type: 'matched' });
    expect(priest1.lastMessage()).toMatchObject({ type: 'matched' });

    // sinner2 and sinner3 should NOT have been matched
    expect(sinner2.messages.every((m: any) => m.type !== 'matched')).toBe(true);
    expect(sinner3.messages.every((m: any) => m.type !== 'matched')).toBe(true);
  });

  it('matches multiple pairs as priests arrive', () => {
    const sinner1 = new MockWebSocket();
    const sinner2 = new MockWebSocket();
    const priest1 = new MockWebSocket();
    const priest2 = new MockWebSocket();

    mm.join('sinner', sinner1);
    mm.join('sinner', sinner2);
    mm.join('priest', priest1);
    mm.join('priest', priest2);

    expect(sinner1.lastMessage()).toMatchObject({ type: 'matched' });
    expect(priest1.lastMessage()).toMatchObject({ type: 'matched' });
    expect(sinner2.lastMessage()).toMatchObject({ type: 'matched' });
    expect(priest2.lastMessage()).toMatchObject({ type: 'matched' });

    expect(mm.waitingSinners.size).toBe(0);
    expect(mm.waitingPriests.size).toBe(0);
  });

  it('queues multiple priests when no sinners available', () => {
    const priest1 = new MockWebSocket();
    const priest2 = new MockWebSocket();
    const priest3 = new MockWebSocket();

    mm.join('priest', priest1);
    mm.join('priest', priest2);
    mm.join('priest', priest3);

    expect(priest1.lastMessage()).toEqual({ type: 'waiting', position: 1 });
    expect(priest2.lastMessage()).toEqual({ type: 'waiting', position: 2 });
    expect(priest3.lastMessage()).toEqual({ type: 'waiting', position: 3 });

    expect(mm.waitingPriests.size).toBe(3);
  });

  it('drains priest queue in order as sinners arrive', () => {
    const priest1 = new MockWebSocket();
    const priest2 = new MockWebSocket();
    const sinner1 = new MockWebSocket();
    const sinner2 = new MockWebSocket();

    mm.join('priest', priest1);
    mm.join('priest', priest2);

    mm.join('sinner', sinner1); // matches priest1
    mm.join('sinner', sinner2); // matches priest2

    expect(priest1.lastMessage()).toMatchObject({ type: 'matched' });
    expect(sinner1.lastMessage()).toMatchObject({ type: 'matched' });
    expect(priest2.lastMessage()).toMatchObject({ type: 'matched' });
    expect(sinner2.lastMessage()).toMatchObject({ type: 'matched' });

    expect(mm.waitingPriests.size).toBe(0);
    expect(mm.waitingSinners.size).toBe(0);
    expect(mm.sessions.size).toBe(2);
  });
});

describe('dead socket pruning', () => {
  it('skips dead sinner and matches with next live one', () => {
    const deadSinner = new MockWebSocket();
    const liveSinner = new MockWebSocket();
    const priest = new MockWebSocket();

    mm.join('sinner', deadSinner);
    mm.join('sinner', liveSinner);

    // Kill the first sinner's socket
    deadSinner.readyState = 3;

    mm.join('priest', priest);

    // Should skip dead sinner and match with live one
    expect(liveSinner.lastMessage()).toMatchObject({ type: 'matched' });
    expect(priest.lastMessage()).toMatchObject({ type: 'matched' });
    expect(deadSinner.messages.every((m: any) => m.type !== 'matched')).toBe(true);
  });

  it('skips dead priest and matches with next live one', () => {
    const deadPriest = new MockWebSocket();
    const livePriest = new MockWebSocket();
    const sinner = new MockWebSocket();

    mm.join('priest', deadPriest);
    mm.join('priest', livePriest);

    deadPriest.readyState = 3;

    mm.join('sinner', sinner);

    expect(livePriest.lastMessage()).toMatchObject({ type: 'matched' });
    expect(sinner.lastMessage()).toMatchObject({ type: 'matched' });
  });

  it('returns no match when all waiting sockets are dead', () => {
    const dead1 = new MockWebSocket();
    const dead2 = new MockWebSocket();
    const priest = new MockWebSocket();

    mm.join('sinner', dead1);
    mm.join('sinner', dead2);

    dead1.readyState = 3;
    dead2.readyState = 3;

    mm.join('priest', priest);

    // No match — priest goes to waiting
    expect(priest.lastMessage()).toEqual({ type: 'waiting', position: 1 });
    expect(mm.waitingPriests.size).toBe(1);
  });
});

describe('disconnect handling', () => {
  it('notifies partner when user disconnects during session', () => {
    const sinnerWs = new MockWebSocket();
    const priestWs = new MockWebSocket();

    const sinnerId = mm.join('sinner', sinnerWs);
    mm.join('priest', priestWs);

    // Both matched
    expect(mm.sessions.size).toBe(1);

    // Sinner disconnects
    mm.disconnect(sinnerId);

    expect(priestWs.lastMessage()).toEqual({ type: 'partner-left' });
    expect(mm.sessions.size).toBe(0);
  });

  it('removes user from waiting queue on disconnect', () => {
    const ws = new MockWebSocket();
    const userId = mm.join('sinner', ws);

    expect(mm.waitingSinners.size).toBe(1);

    mm.disconnect(userId);

    expect(mm.waitingSinners.size).toBe(0);
  });

  it('next sinner in queue gets matched after first disconnects', () => {
    const sinner1 = new MockWebSocket();
    const sinner2 = new MockWebSocket();
    const priest = new MockWebSocket();

    const sinner1Id = mm.join('sinner', sinner1);
    mm.join('sinner', sinner2);

    // sinner1 disconnects before a priest arrives
    mm.disconnect(sinner1Id);

    mm.join('priest', priest);

    // sinner2 should be matched
    expect(sinner2.lastMessage()).toMatchObject({ type: 'matched' });
    expect(priest.lastMessage()).toMatchObject({ type: 'matched' });
  });
});

describe('message relay', () => {
  it('relays message from priest to sinner', () => {
    const sinnerWs = new MockWebSocket();
    const priestWs = new MockWebSocket();

    mm.join('sinner', sinnerWs);
    const priestId = mm.join('priest', priestWs);

    mm.relay(priestId, { type: 'chat-message', text: 'hello sinner', sender: 'priest' });

    expect(sinnerWs.lastMessage()).toEqual({ type: 'chat-message', text: 'hello sinner', sender: 'priest' });
  });

  it('relays message from sinner to priest', () => {
    const sinnerWs = new MockWebSocket();
    const priestWs = new MockWebSocket();

    const sinnerId = mm.join('sinner', sinnerWs);
    mm.join('priest', priestWs);

    mm.relay(sinnerId, { type: 'chat-message', text: 'forgive me', sender: 'sinner' });

    expect(priestWs.lastMessage()).toEqual({ type: 'chat-message', text: 'forgive me', sender: 'sinner' });
  });

  it('does not relay if user has no session', () => {
    const ws = new MockWebSocket();
    const userId = mm.join('sinner', ws);

    // No match yet — relay should do nothing
    mm.relay(userId, { type: 'chat-message', text: 'hello?', sender: 'sinner' });

    // Only the 'waiting' message should be there
    expect(ws.messages).toHaveLength(1);
    expect(ws.messages[0].type).toBe('waiting');
  });

  it('does not relay to dead partner socket', () => {
    const sinnerWs = new MockWebSocket();
    const priestWs = new MockWebSocket();

    const sinnerId = mm.join('sinner', sinnerWs);
    mm.join('priest', priestWs);

    // Kill priest socket without disconnect
    priestWs.readyState = 3;

    mm.relay(sinnerId, { type: 'chat-message', text: 'hello?', sender: 'sinner' });

    // priest should only have the matched message, no relay
    expect(priestWs.messages).toHaveLength(1);
    expect(priestWs.messages[0].type).toBe('matched');
  });
});

describe('concurrent sessions', () => {
  it('maintains independent sessions for multiple pairs', () => {
    const s1 = new MockWebSocket();
    const p1 = new MockWebSocket();
    const s2 = new MockWebSocket();
    const p2 = new MockWebSocket();

    const s1Id = mm.join('sinner', s1);
    const p1Id = mm.join('priest', p1);
    const s2Id = mm.join('sinner', s2);
    const p2Id = mm.join('priest', p2);

    expect(mm.sessions.size).toBe(2);

    // Relay in session 1 doesn't leak to session 2
    mm.relay(p1Id, { type: 'chat-message', text: 'session 1', sender: 'priest' });

    expect(s1.lastMessage()).toEqual({ type: 'chat-message', text: 'session 1', sender: 'priest' });
    // s2 should only have 'matched', not the chat message
    expect(s2.messages.filter((m: any) => m.type === 'chat-message')).toHaveLength(0);

    // Relay in session 2
    mm.relay(s2Id, { type: 'chat-message', text: 'session 2', sender: 'sinner' });

    expect(p2.lastMessage()).toEqual({ type: 'chat-message', text: 'session 2', sender: 'sinner' });
    expect(p1.messages.filter((m: any) => m.type === 'chat-message').length).toBe(0);
  });

  it('disconnecting one pair does not affect the other', () => {
    const s1 = new MockWebSocket();
    const p1 = new MockWebSocket();
    const s2 = new MockWebSocket();
    const p2 = new MockWebSocket();

    const s1Id = mm.join('sinner', s1);
    mm.join('priest', p1);
    const s2Id = mm.join('sinner', s2);
    mm.join('priest', p2);

    // Disconnect session 1
    mm.disconnect(s1Id);

    expect(p1.lastMessage()).toEqual({ type: 'partner-left' });
    expect(mm.sessions.size).toBe(1);

    // Session 2 still works
    mm.relay(s2Id, { type: 'chat-message', text: 'still here', sender: 'sinner' });
    expect(p2.lastMessage()).toEqual({ type: 'chat-message', text: 'still here', sender: 'sinner' });
  });
});
