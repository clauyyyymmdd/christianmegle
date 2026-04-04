import { SignalingClient } from './signaling';
import { DEFAULT_RTC_CONFIG } from './types';
import type { ServerMessage } from '../../shared/types/messages';

interface WebRTCCallbacks {
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onPartnerLeft: () => void;
  onError: (error: string) => void;
}

export class WebRTCManager {
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private signaling: SignalingClient;
  private callbacks: WebRTCCallbacks;
  private cleanupSignaling: (() => void) | null = null;
  private apiUrl: string;

  constructor(signaling: SignalingClient, callbacks: WebRTCCallbacks, apiUrl: string) {
    this.signaling = signaling;
    this.callbacks = callbacks;
    this.apiUrl = apiUrl;
  }

  /**
   * Get local camera/mic stream
   */
  async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) return this.localStream;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      return this.localStream;
    } catch (e) {
      const error = e instanceof Error ? e.message : 'Failed to access camera/mic';
      this.callbacks.onError(error);
      throw e;
    }
  }

  /**
   * Set up the peer connection and signaling listeners.
   * Call this after being matched with a partner.
   */
  async initialize(isInitiator: boolean): Promise<void> {
    // Fetch TURN credentials from the server, fall back to STUN-only
    let config: RTCConfiguration = DEFAULT_RTC_CONFIG;
    try {
      const res = await fetch(`${this.apiUrl}/api/ice-config`);
      if (res.ok) {
        const data = await res.json() as { iceServers: RTCIceServer[] };
        config = { iceServers: data.iceServers };
      }
    } catch (e) {
      console.warn('[WebRTC] Failed to fetch ICE config, using defaults:', e);
    }

    // Create peer connection
    this.pc = new RTCPeerConnection(config);

    // Add local tracks to connection
    const stream = await this.getLocalStream();
    stream.getTracks().forEach((track) => {
      this.pc!.addTrack(track, stream);
    });

    // Handle incoming remote tracks
    this.pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.callbacks.onRemoteStream(event.streams[0]);
      }
    };

    // Send ICE candidates to peer via signaling
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.send({
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Monitor connection state
    this.pc.onconnectionstatechange = () => {
      if (this.pc) {
        this.callbacks.onConnectionStateChange(this.pc.connectionState);

        if (this.pc.connectionState === 'failed') {
          this.callbacks.onError('Connection failed. The other person may have left.');
        }
      }
    };

    // Listen for signaling messages
    this.cleanupSignaling = this.signaling.onMessage(async (msg: ServerMessage) => {
      try {
        switch (msg.type) {
          case 'offer':
            await this.handleOffer(msg.sdp);
            break;
          case 'answer':
            await this.handleAnswer(msg.sdp);
            break;
          case 'ice-candidate':
            await this.handleIceCandidate(msg.candidate);
            break;
          case 'partner-left':
            this.callbacks.onPartnerLeft();
            break;
        }
      } catch (e) {
        console.error('[WebRTC] Error handling signal:', e);
      }
    });

    // If we're the initiator, create and send an offer
    if (isInitiator) {
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      this.signaling.send({ type: 'offer', sdp: offer });
    }
  }

  private async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.signaling.send({ type: 'answer', sdp: answer });
  }

  private async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
    if (!this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.pc) return;
    try {
      await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (e) {
      // ICE candidates can arrive before remote description is set
      // This is normal and usually resolves itself
      console.warn('[WebRTC] Failed to add ICE candidate:', e);
    }
  }

  /**
   * End the current session and clean up
   */
  endSession(): void {
    this.signaling.send({ type: 'end-session' });
    this.cleanup();
  }

  /**
   * Clean up all resources
   */
  cleanup(): void {
    this.cleanupSignaling?.();
    this.cleanupSignaling = null;

    this.pc?.close();
    this.pc = null;

    // Don't stop local stream here — we might reuse it for next match
  }

  /**
   * Full teardown including camera
   */
  destroy(): void {
    this.cleanup();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
  }
}
