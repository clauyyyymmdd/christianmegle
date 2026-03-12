import { SignalMessage, UserRole } from '../src/lib/types';

interface WaitingUser {
  ws: WebSocket;
  role: UserRole;
  priestId?: string;
  joinedAt: number;
}

/**
 * Matchmaker Durable Object
 * 
 * Manages the waiting queue and pairs priests with sinners.
 * Once paired, both users communicate through this object
 * which relays WebRTC signaling messages between them.
 */
export class Matchmaker {
  private state: DurableObjectState;
  private waitingPriests: Map<string, WaitingUser> = new Map();
  private waitingSinners: Map<string, WaitingUser> = new Map();
  private sessions: Map<string, { priest: string; sinner: string }> = new Map();
  private userToSession: Map<string, string> = new Map();
  private userConnections: Map<string, WebSocket> = new Map();

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    const userId = crypto.randomUUID();

    server.accept();

    server.addEventListener('message', (event) => {
      try {
        const msg: SignalMessage = JSON.parse(event.data as string);
        this.handleMessage(userId, msg, server);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(userId);
    });

    server.addEventListener('error', () => {
      this.handleDisconnect(userId);
    });

    this.userConnections.set(userId, server);

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleMessage(userId: string, msg: SignalMessage, ws: WebSocket): void {
    switch (msg.type) {
      case 'join':
        this.handleJoin(userId, msg.role, ws, msg.priestId);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        this.relayToPartner(userId, msg);
        break;

      case 'end-session':
        this.handleEndSession(userId);
        break;
    }
  }

  private handleJoin(userId: string, role: UserRole, ws: WebSocket, priestId?: string): void {
    const user: WaitingUser = { ws, role, priestId, joinedAt: Date.now() };

    if (role === 'priest') {
      // Check if there's a waiting sinner
      const sinnerEntry = this.getFirstWaiting(this.waitingSinners);
      if (sinnerEntry) {
        const [sinnerId, sinner] = sinnerEntry;
        this.waitingSinners.delete(sinnerId);
        this.createSession(userId, ws, sinnerId, sinner.ws);
      } else {
        this.waitingPriests.set(userId, user);
        this.sendTo(ws, { type: 'waiting', position: this.waitingPriests.size });
      }
    } else {
      // Sinner — check if there's a waiting priest
      const priestEntry = this.getFirstWaiting(this.waitingPriests);
      if (priestEntry) {
        const [pId, priest] = priestEntry;
        this.waitingPriests.delete(pId);
        this.createSession(pId, priest.ws, userId, ws);
      } else {
        this.waitingSinners.set(userId, user);
        this.sendTo(ws, { type: 'waiting', position: this.waitingSinners.size });
      }
    }
  }

  private createSession(priestId: string, priestWs: WebSocket, sinnerId: string, sinnerWs: WebSocket): void {
    const sessionId = crypto.randomUUID();

    this.sessions.set(sessionId, { priest: priestId, sinner: sinnerId });
    this.userToSession.set(priestId, sessionId);
    this.userToSession.set(sinnerId, sessionId);

    // Priest is the initiator (creates the WebRTC offer)
    this.sendTo(priestWs, { type: 'matched', partnerId: sinnerId, initiator: true });
    this.sendTo(sinnerWs, { type: 'matched', partnerId: priestId, initiator: false });
  }

  private relayToPartner(userId: string, msg: SignalMessage): void {
    const sessionId = this.userToSession.get(userId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const partnerId = session.priest === userId ? session.sinner : session.priest;
    const partnerWs = this.userConnections.get(partnerId);

    if (partnerWs) {
      this.sendTo(partnerWs, msg);
    }
  }

  private handleEndSession(userId: string): void {
    const sessionId = this.userToSession.get(userId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const partnerId = session.priest === userId ? session.sinner : session.priest;
    const partnerWs = this.userConnections.get(partnerId);

    if (partnerWs) {
      this.sendTo(partnerWs, { type: 'partner-left' });
    }

    // Clean up session
    this.sessions.delete(sessionId);
    this.userToSession.delete(userId);
    this.userToSession.delete(partnerId);
  }

  private handleDisconnect(userId: string): void {
    // Remove from waiting queues
    this.waitingPriests.delete(userId);
    this.waitingSinners.delete(userId);

    // End any active session
    this.handleEndSession(userId);

    // Remove connection
    this.userConnections.delete(userId);

    // Update waiting positions
    this.broadcastWaitingPositions();
  }

  private broadcastWaitingPositions(): void {
    let pos = 1;
    for (const [, user] of this.waitingPriests) {
      this.sendTo(user.ws, { type: 'waiting', position: pos++ });
    }
    pos = 1;
    for (const [, user] of this.waitingSinners) {
      this.sendTo(user.ws, { type: 'waiting', position: pos++ });
    }
  }

  private getFirstWaiting(map: Map<string, WaitingUser>): [string, WaitingUser] | undefined {
    const first = map.entries().next();
    return first.done ? undefined : first.value;
  }

  private sendTo(ws: WebSocket, msg: SignalMessage): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch (e) {
      console.error('Failed to send to WebSocket:', e);
    }
  }
}
