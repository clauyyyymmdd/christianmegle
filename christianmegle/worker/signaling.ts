/**
 * SignalingRoom Durable Object
 * 
 * Reserved for future use if we need per-room state
 * (e.g., session recording metadata, room-specific settings).
 * Currently, the Matchmaker handles all WebSocket signaling directly.
 */
export class SignalingRoom {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    return new Response('SignalingRoom — not directly used. See Matchmaker.', { status: 200 });
  }
}
