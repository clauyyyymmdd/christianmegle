import type { ClientMessage, ServerMessage } from '../../shared/types/messages';
import { UserRole } from './types';

type MessageHandler = (msg: ServerMessage) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnects = 5;
  private shouldReconnect = true;
  private url: string;

  constructor(baseUrl: string) {
    // Convert http(s) to ws(s)
    this.url = baseUrl.replace(/^http/, 'ws') + '/ws';
  }

  connect(role: UserRole, priestId?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          // Announce role to server
          this.send({ type: 'join', role, priestId });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg: ServerMessage = JSON.parse(event.data);
            // Stop reconnecting once matched — session is live
            if (msg.type === 'matched') {
              this.shouldReconnect = false;
            }
            this.handlers.forEach((handler) => handler(msg));
          } catch (e) {
            console.error('[Signaling] Failed to parse message:', e);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[Signaling] Connection closed:', event.code, event.reason);
          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnects) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
            console.log(`[Signaling] Reconnecting in ${delay}ms...`);
            setTimeout(() => this.connect(role, priestId), delay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Signaling] WebSocket error:', error);
          reject(error);
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  send(msg: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    } else {
      console.warn('[Signaling] Cannot send — WebSocket not open');
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
