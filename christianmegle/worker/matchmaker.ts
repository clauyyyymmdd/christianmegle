import { SignalMessage, UserRole } from '../src/lib/types';

// Priest action message types that should be relayed (priest only)
const PRIEST_ACTION_TYPES = [
  'priest-penance',
  'priest-absolution',
  'priest-scripture',
  'priest-effect',
  'priest-excommunicate',
  'priest-silence',
  'priest-inscribe',
  'priest-bells',
] as const;

// Chat message types that can be sent by either user
const CHAT_MESSAGE_TYPES = [
  'chat-message',
  'chat-typing',
] as const;

type PriestActionType = typeof PRIEST_ACTION_TYPES[number];
type ChatMessageType = typeof CHAT_MESSAGE_TYPES[number];

function isPriestAction(type: string): type is PriestActionType {
  return PRIEST_ACTION_TYPES.includes(type as PriestActionType);
}

function isChatMessage(type: string): type is ChatMessageType {
  return CHAT_MESSAGE_TYPES.includes(type as ChatMessageType);
}

interface WaitingUser {
  ws: WebSocket;
  role: UserRole;
  priestId?: string;
  joinedAt: number;
}

interface SessionInfo {
  priest: string;
  sinner: string;
  priestId?: string; // Database priest ID
  dbSessionId?: string; // Database session ID
  startedAt: number;
}

interface Env {
  DB: D1Database;
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

      default:
        // Handle priest action messages
        if (isPriestAction(msg.type)) {
          this.handlePriestAction(userId, msg);
        }
        // Handle chat messages (can be sent by either user)
        else if (isChatMessage(msg.type)) {
          this.relayToPartner(userId, msg);
        }
        break;
    }
  }

  private handlePriestAction(userId: string, msg: SignalMessage): void {
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

    if (role === 'priest') {
      // Check if there's a waiting sinner
      const sinnerEntry = this.getFirstWaiting(this.waitingSinners);
      if (sinnerEntry) {
        const [sinnerId, sinner] = sinnerEntry;
        this.waitingSinners.delete(sinnerId);
        this.createSession(userId, ws, sinnerId, sinner.ws, priestId);
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
    this.sendTo(priestWs, { type: 'matched', partnerId: sinnerUserId, initiator: true });
    this.sendTo(sinnerWs, { type: 'matched', partnerId: priestUserId, initiator: false });
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

  private handleDisconnect(userId: string): void {
    // Remove from waiting queues
    this.waitingPriests.delete(userId);
    this.waitingSinners.delete(userId);

    // End any active session
    this.handleEndSession(userId, 'disconnect');

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
