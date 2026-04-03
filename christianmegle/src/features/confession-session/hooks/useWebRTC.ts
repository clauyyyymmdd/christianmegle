import { useEffect, useRef, useState } from 'react';
import { WebRTCManager } from '../../../lib/webrtc';
import { SignalingClient } from '../../../lib/signaling';
import { getAudioManager } from '../../../lib/audio';

export function useWebRTC(signaling: SignalingClient, isInitiator: boolean) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<WebRTCManager | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const [connectionState, setConnectionState] = useState('connecting');
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const audioManager = getAudioManager();

  useEffect(() => {
    audioManager.preload();

    const rtc = new WebRTCManager(signaling, {
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        setSessionActive(true);
        setConnectionState('connected');
        timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
      },
      onConnectionStateChange: setConnectionState,
      onPartnerLeft: () => {
        setSessionActive(false);
        setConnectionState('ended');
        if (timerRef.current) clearInterval(timerRef.current);
        audioManager.stopAllLoops();
      },
      onError: setError,
    });

    rtcRef.current = rtc;

    rtc.getLocalStream().then((stream) => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    });

    rtc.initialize(isInitiator);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      rtc.destroy();
      audioManager.stopAllLoops();
    };
  }, []);

  const endSession = () => {
    rtcRef.current?.endSession();
    if (timerRef.current) clearInterval(timerRef.current);
    audioManager.stopAllLoops();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    localVideoRef,
    remoteVideoRef,
    connectionState,
    sessionActive,
    error,
    elapsed,
    endSession,
    formatTime,
  };
}
