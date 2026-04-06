import { UserRole } from '../src/lib/types';
import type {
  ClientMessage,
  PriestActionMessage,
  ServerMessage,
} from '../shared/types/messages';
import { isPriestAction, isChatMessage } from '../shared/types/messages';
import type { Env } from './lib/types';

interface WaitingUser {
  ws: WebSocket;
  role: UserRole;
  priestId?: string;
  joinedAt: number;
}

interface SessionInfo {
  priest: string;
  sinner: string;
  priestId?: string;
  dbSessionId?: string;
  startedAt: number;
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
  private env: Env;
  private waitingPriests: Map<string, WaitingUser> = new Map();
  private waitingSinners: Map<string, WaitingUser> = new Map();
  private sessions: Map<string, SessionInfo> = new Map();
  private userToSession: Map<string, string> = new Map();
  private userConnections: Map<string, WebSocket> = new Map();
  private userRoles: Map<string, UserRole> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
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
        const raw = event.data as string;
        // Reject oversized messages (64KB max)
        if (raw.length > 65536) return;
        const msg: ClientMessage = JSON.parse(raw);
        this.handleMessage(userId, msg, server);
      } catch {
        // Silently drop unparseable messages
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

  private handleMessage(userId: string, msg: ClientMessage, ws: WebSocket): void {
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

      default: {
        // Block sinners from sending priest-prefixed messages
        const userRole = this.userRoles.get(userId);
        if (isPriestAction(msg)) {
          if (userRole !== 'priest') return;
          this.handlePriestAction(userId, msg);
        } else if (isChatMessage(msg)) {
          // Enforce chat message length limit
          if ('text' in msg && typeof msg.text === 'string' && msg.text.length > 5000) return;
          this.relayToPartner(userId, msg);
        }
        break;
      }
    }
  }

  private handlePriestAction(userId: string, msg: PriestActionMessage): void {
    // Validate that the sender is a priest
    const userRole = this.userRoles.get(userId);
    if (userRole !== 'priest') {
      console.warn(`[Matchmaker] Non-priest user ${userId} attempted priest action: ${msg.type}`);
      return;
    }

    // Relay to partner (the sinner)
    this.relayToPartner(userId, msg);

    // Handle excommunication - end the session
    if (msg.type === 'priest-excommunicate') {
      // Small delay to allow the effect to play
      setTimeout(() => {
        this.handleEndSession(userId);
      }, 3000);
    }
  }

  private handleJoin(userId: string, role: UserRole, ws: WebSocket, priestId?: string): void {
    const user: WaitingUser = { ws, role, priestId, joinedAt: Date.now() };

    // Store user's role for validation
    this.userRoles.set(userId, role);

    console.log(`[Matchmaker] JOIN: ${role} (${userId.slice(0, 8)}), priests waiting: ${this.waitingPriests.size}, sinners waiting: ${this.waitingSinners.size}`);

    if (role === 'priest') {
      const partner = this.findLivePartner(this.waitingSinners);
      if (partner) {
        const [sinnerId, sinner] = partner;
        this.waitingSinners.delete(sinnerId);
        console.log(`[Matchmaker] MATCH: priest ${userId.slice(0, 8)} <-> sinner ${sinnerId.slice(0, 8)}`);
        this.createSession(userId, ws, sinnerId, sinner.ws, priestId);
      } else {
        this.waitingPriests.set(userId, user);
        this.sendTo(ws, { type: 'waiting', position: this.waitingPriests.size });
      }
    } else {
      const partner = this.findLivePartner(this.waitingPriests);
      if (partner) {
        const [pId, priest] = partner;
        this.waitingPriests.delete(pId);
        console.log(`[Matchmaker] MATCH: priest ${pId.slice(0, 8)} <-> sinner ${userId.slice(0, 8)}`);
        this.createSession(pId, priest.ws, userId, ws, priest.priestId);
      } else {
        this.waitingSinners.set(userId, user);
        this.sendTo(ws, { type: 'waiting', position: this.waitingSinners.size });
      }
    }
  }

  private async createSession(
    priestUserId: string,
    priestWs: WebSocket,
    sinnerUserId: string,
    sinnerWs: WebSocket,
    dbPriestId?: string
  ): Promise<void> {
    const sessionId = crypto.randomUUID();
    const dbSessionId = crypto.randomUUID().slice(0, 16);

    this.sessions.set(sessionId, {
      priest: priestUserId,
      sinner: sinnerUserId,
      priestId: dbPriestId,
      dbSessionId,
      startedAt: Date.now(),
    });
    this.userToSession.set(priestUserId, sessionId);
    this.userToSession.set(sinnerUserId, sessionId);

    // Save session to database
    if (dbPriestId) {
      try {
        await this.env.DB.prepare(
          `INSERT INTO sessions (id, priest_id, started_at) VALUES (?, ?, datetime('now'))`
        ).bind(dbSessionId, dbPriestId).run();
      } catch (e) {
        console.error('[Matchmaker] Failed to create session record:', e);
      }
    }

    // Priest is the initiator (creates the WebRTC offer)
    const priestSent = this.sendTo(priestWs, { type: 'matched', partnerId: sinnerUserId, initiator: true });
    const sinnerSent = this.sendTo(sinnerWs, { type: 'matched', partnerId: priestUserId, initiator: false });
    console.log(`[Matchmaker] SESSION ${sessionId.slice(0, 8)}: matched sent priest=${priestSent} sinner=${sinnerSent}`);
  }

  private relayToPartner(userId: string, msg: ClientMessage): void {
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

  private async handleEndSession(userId: string, endedBy?: 'priest' | 'sinner' | 'disconnect'): Promise<void> {
    const sessionId = this.userToSession.get(userId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const partnerId = session.priest === userId ? session.sinner : session.priest;
    const partnerWs = this.userConnections.get(partnerId);

    if (partnerWs) {
      this.sendTo(partnerWs, { type: 'partner-left' });
    }

    // Update session in database
    if (session.dbSessionId) {
      const durationSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
      const endReason = endedBy || (userId === session.priest ? 'priest' : 'sinner');

      try {
        await this.env.DB.prepare(
          `UPDATE sessions SET ended_at = datetime('now'), ended_by = ?, duration_seconds = ? WHERE id = ?`
        ).bind(endReason, durationSeconds, session.dbSessionId).run();
      } catch (e) {
        console.error('[Matchmaker] Failed to update session record:', e);
      }
    }

    // Clean up session
    this.sessions.delete(sessionId);
    this.userToSession.delete(userId);
    this.userToSession.delete(partnerId);
  }

  private async handleDisconnect(userId: string): Promise<void> {
    console.log(`[Matchmaker] DISCONNECT: ${userId.slice(0, 8)}`);

    // Remove from waiting queues
    this.waitingPriests.delete(userId);
    this.waitingSinners.delete(userId);

    // End any active session
    await this.handleEndSession(userId, 'disconnect');

    // Remove connection and role
    this.userConnections.delete(userId);
    this.userRoles.delete(userId);

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

  /** Find the first waiting user with a live WebSocket, pruning dead ones. */
  private findLivePartner(map: Map<string, WaitingUser>): [string, WaitingUser] | undefined {
    for (const [id, user] of map) {
      const ws = user.ws;
      // Check if socket is still open (readyState 1 = OPEN)
      if (ws.readyState === WebSocket.OPEN || ws.readyState === 1) {
        return [id, user];
      }
      // Dead socket — prune it
      console.log(`[Matchmaker] PRUNE: dead socket ${id.slice(0, 8)}`);
      map.delete(id);
      this.userConnections.delete(id);
      this.userRoles.delete(id);
    }
    return undefined;
  }

  private sendTo(ws: WebSocket, msg: ServerMessage | ClientMessage): boolean {
    try {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === 1) {
        ws.send(JSON.stringify(msg));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
