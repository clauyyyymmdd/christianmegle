import { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCManager } from '../lib/webrtc';
import { SignalingClient } from '../lib/signaling';
import {
  UserRole,
  SignalMessage,
  VisualEffectType,
  PenanceAssignment,
  ScriptureVerse,
  BookEntry,
} from '../lib/types';
import { getAudioManager } from '../lib/audio';
import { PriestToolbar, EffectsOverlay, BookOfLife } from './priest-toolkit';

interface ChatMessage {
  id: string;
  text: string;
  sender: UserRole;
  timestamp: number;
}

interface VideoChatProps {
  signaling: SignalingClient;
  role: UserRole;
  onSessionEnd: () => void;
}

export default function VideoChat({ signaling, role, onSessionEnd }: VideoChatProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const rtcRef = useRef<WebRTCManager | null>(null);
  const [connectionState, setConnectionState] = useState<string>('connecting');
  const [sessionActive, setSessionActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Priest toolkit state
  const [activeEffects, setActiveEffects] = useState<Set<VisualEffectType>>(new Set());
  const [absolutionActive, setAbsolutionActive] = useState(false);
  const [silenceActive, setSilenceActive] = useState(false);
  const [excommunicateActive, setExcommunicateActive] = useState(false);
  const [currentPenance, setCurrentPenance] = useState<PenanceAssignment | null>(null);
  const [currentScripture, setCurrentScripture] = useState<ScriptureVerse | null>(null);
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const audioManager = getAudioManager();

  // Preload audio on mount
  useEffect(() => {
    audioManager.preload();
    return () => {
      audioManager.stopAllLoops();
    };
  }, []);

  // Handle incoming priest messages
  const handlePriestMessage = useCallback((msg: SignalMessage) => {
    switch (msg.type) {
      case 'priest-penance':
        setCurrentPenance(msg.penance);
        break;

      case 'priest-absolution':
        setAbsolutionActive(true);
        audioManager.play('organ-swell');
        setTimeout(() => setAbsolutionActive(false), 100);
        break;

      case 'priest-scripture':
        setCurrentScripture(msg.verse);
        break;

      case 'priest-effect':
        setActiveEffects(prev => {
          const next = new Set(prev);
          if (next.has(msg.effect)) {
            next.delete(msg.effect);
          } else {
            next.add(msg.effect);
          }
          return next;
        });
        break;

      case 'priest-bells':
        audioManager.play('sanctus-bells');
        break;

      case 'priest-silence':
        setSilenceActive(msg.active);
        if (msg.active) {
          audioManager.startLoop('ambient-silence');
        } else {
          audioManager.stopLoop('ambient-silence');
        }
        break;

      case 'priest-inscribe':
        setBookEntries(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            text: msg.text,
            timestamp: Date.now(),
          },
        ]);
        break;

      case 'priest-excommunicate':
        setExcommunicateActive(true);
        // Session will end via partner-left message from server
        break;

      case 'chat-message':
        setChatMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          text: msg.text,
          sender: msg.sender,
          timestamp: Date.now(),
        }]);
        setStrangerTyping(false);
        // Play notification sound for incoming messages
        audioManager.play('chat-message');
        break;

      case 'chat-typing':
        setStrangerTyping(msg.isTyping);
        break;
    }
  }, [audioManager]);

  useEffect(() => {
    const rtc = new WebRTCManager(signaling, {
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setSessionActive(true);
        setConnectionState('connected');

        // Start timer
        timerRef.current = setInterval(() => {
          setElapsed((prev) => prev + 1);
        }, 1000);
      },
      onConnectionStateChange: (state) => {
        setConnectionState(state);
      },
      onPartnerLeft: () => {
        setSessionActive(false);
        setConnectionState('ended');
        if (timerRef.current) clearInterval(timerRef.current);
        audioManager.stopAllLoops();
      },
      onError: (err) => {
        setError(err);
      },
    });

    rtcRef.current = rtc;

    // Get local video immediately
    rtc.getLocalStream().then((stream) => {
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    });

    // Listen for match, priest, and chat messages
    const cleanup = signaling.onMessage(async (msg) => {
      if (msg.type === 'matched') {
        await rtc.initialize(msg.initiator);
      } else if (msg.type.startsWith('priest-') || msg.type.startsWith('chat-')) {
        handlePriestMessage(msg);
      }
    });

    return () => {
      cleanup();
      if (timerRef.current) clearInterval(timerRef.current);
      rtc.destroy();
      audioManager.stopAllLoops();
    };
  }, [signaling, handlePriestMessage]);

  const handleEndSession = () => {
    rtcRef.current?.endSession();
    if (timerRef.current) clearInterval(timerRef.current);
    audioManager.stopAllLoops();
    onSessionEnd();
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Priest action handlers
  const handleSendPenance = (penance: PenanceAssignment) => {
    signaling.send({ type: 'priest-penance', penance });
    // Also show locally for feedback
    setCurrentPenance(penance);
  };

  const handleGrantAbsolution = () => {
    signaling.send({ type: 'priest-absolution' });
    setAbsolutionActive(true);
    audioManager.play('organ-swell');
    setTimeout(() => setAbsolutionActive(false), 100);
  };

  const handleSendScripture = (verse: ScriptureVerse) => {
    signaling.send({ type: 'priest-scripture', verse });
    setCurrentScripture(verse);
  };

  const handleToggleEffect = (effect: VisualEffectType) => {
    signaling.send({ type: 'priest-effect', effect });
    setActiveEffects(prev => {
      const next = new Set(prev);
      if (next.has(effect)) {
        next.delete(effect);
      } else {
        next.add(effect);
      }
      return next;
    });
  };

  const handleRingBells = () => {
    signaling.send({ type: 'priest-bells' });
    audioManager.play('sanctus-bells');
  };

  const handleToggleSilence = () => {
    const newState = !silenceActive;
    signaling.send({ type: 'priest-silence', active: newState });
    setSilenceActive(newState);
    if (newState) {
      audioManager.startLoop('ambient-silence');
    } else {
      audioManager.stopLoop('ambient-silence');
    }
  };

  const handleExcommunicate = () => {
    signaling.send({ type: 'priest-excommunicate' });
    setExcommunicateActive(true);
    // The server will handle ending the session
    setTimeout(() => {
      handleEndSession();
    }, 3000);
  };

  const handleInscribe = (text: string) => {
    signaling.send({ type: 'priest-inscribe', text });
    setBookEntries(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text,
        timestamp: Date.now(),
      },
    ]);
  };

  // Chat handlers
  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: chatInput.trim(),
      sender: role,
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, message]);
    signaling.send({ type: 'chat-message', text: message.text, sender: role });
    setChatInput('');

    // Clear typing indicator
    signaling.send({ type: 'chat-typing', isTyping: false });
  };

  const handleChatInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);

    // Send typing indicator
    signaling.send({ type: 'chat-typing', isTyping: true });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = window.setTimeout(() => {
      signaling.send({ type: 'chat-typing', isTyping: false });
    }, 2000);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div style={styles.container}>
      {/* Remote video (full screen) */}
      <div className="video-container" style={styles.remoteVideo}>
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={styles.video}
        />
        {!sessionActive && (
          <div style={styles.videoOverlay}>
            <div className="flicker" style={styles.waitingIcon}>🕯</div>
            <p style={styles.waitingText}>
              {connectionState === 'ended'
                ? 'The confession has ended.'
                : role === 'priest'
                  ? 'Waiting for a soul to confess...'
                  : 'Waiting for a priest to hear your confession...'}
            </p>
          </div>
        )}

        {/* Effects Overlay */}
        <EffectsOverlay
          activeEffects={activeEffects}
          absolutionActive={absolutionActive}
          silenceActive={silenceActive}
          excommunicateActive={excommunicateActive}
          currentPenance={currentPenance}
          currentScripture={currentScripture}
          onPenanceDismiss={() => setCurrentPenance(null)}
          onScriptureDismiss={() => setCurrentScripture(null)}
        />
      </div>

      {/* Local video (small overlay) */}
      <div className="video-container local" style={styles.localVideo}>
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          style={styles.video}
        />
        <div style={styles.localLabel}>
          {role === 'priest' ? '☦ Priest' : 'Penitent'}
        </div>
      </div>

      {/* Priest Toolbar */}
      {role === 'priest' && sessionActive && (
        <PriestToolbar
          activeEffects={activeEffects}
          silenceActive={silenceActive}
          onSendPenance={handleSendPenance}
          onGrantAbsolution={handleGrantAbsolution}
          onSendScripture={handleSendScripture}
          onToggleEffect={handleToggleEffect}
          onRingBells={handleRingBells}
          onToggleSilence={handleToggleSilence}
          onExcommunicate={handleExcommunicate}
          onInscribe={handleInscribe}
        />
      )}

      {/* Book of Life */}
      {bookEntries.length > 0 && (
        <BookOfLife entries={bookEntries} />
      )}

      {/* Chat Panel */}
      {sessionActive && (
        <div style={{
          ...styles.chatPanel,
          transform: chatOpen ? 'translateX(0)' : 'translateX(calc(100% - 40px))',
        }}>
          <button
            style={styles.chatToggle}
            onClick={() => setChatOpen(!chatOpen)}
          >
            {chatOpen ? '›' : '‹'} Chat
          </button>

          <div style={styles.chatMessages}>
            {chatMessages.length === 0 && (
              <p style={styles.chatEmpty}>No messages yet...</p>
            )}
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  ...styles.chatMessage,
                  ...(msg.sender === role ? styles.chatMessageSelf : styles.chatMessageOther),
                }}
              >
                <span style={styles.chatSender}>
                  {msg.sender === 'priest' ? '☦ Priest' : '🕯 Stranger'}
                </span>
                <span style={styles.chatText}>{msg.text}</span>
              </div>
            ))}
            {strangerTyping && (
              <div style={styles.typingIndicator}>
                {role === 'priest' ? 'Penitent' : 'Priest'} is typing...
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div style={styles.chatInputContainer}>
            <input
              type="text"
              value={chatInput}
              onChange={handleChatInputChange}
              onKeyDown={handleChatKeyDown}
              placeholder="Type a message..."
              style={styles.chatInput}
            />
            <button onClick={handleSendMessage} style={styles.chatSendButton}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div style={styles.controls}>
        <div style={styles.controlsLeft}>
          <span style={styles.roleTag}>
            {role === 'priest' ? '☦ HEARING CONFESSION' : '🕯 CONFESSING'}
          </span>
          {sessionActive && (
            <span style={styles.timer}>{formatTime(elapsed)}</span>
          )}
        </div>

        <div style={styles.controlsRight}>
          {sessionActive && (
            <button onClick={handleEndSession} style={styles.endButton}>
              End Confession
            </button>
          )}
          {connectionState === 'ended' && (
            <button onClick={onSessionEnd} style={styles.nextButton}>
              {role === 'priest' ? 'Next Penitent' : 'Confess Again'}
            </button>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div style={styles.error}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100vh',
    background: 'var(--bg-primary)',
    overflow: 'hidden',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
    border: 'none',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-primary)',
    gap: '1.5rem',
  },
  waitingIcon: {
    fontSize: '3rem',
  },
  waitingText: {
    fontFamily: 'var(--font-body)',
    fontStyle: 'italic',
    color: 'var(--text-secondary)',
    fontSize: '1.1rem',
  },
  localVideo: {
    position: 'absolute',
    bottom: '5rem',
    right: '1.5rem',
    width: '200px',
    height: '150px',
    zIndex: 10,
  },
  localLabel: {
    position: 'absolute',
    bottom: '0.5rem',
    left: '0.5rem',
    fontFamily: 'var(--font-display)',
    fontSize: '0.6rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: 'var(--gold)',
    background: 'rgba(10, 9, 8, 0.7)',
    padding: '0.2rem 0.5rem',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    background: 'linear-gradient(transparent, rgba(10, 9, 8, 0.95))',
    zIndex: 20,
  },
  controlsLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  controlsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  roleTag: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    color: 'var(--gold-dim)',
  },
  timer: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    letterSpacing: '0.1em',
    color: 'var(--text-secondary)',
  },
  endButton: {
    background: 'var(--crimson-dim)',
    borderColor: 'var(--crimson)',
    fontSize: '0.75rem',
    padding: '0.5rem 1.5rem',
  },
  nextButton: {
    fontSize: '0.75rem',
    padding: '0.5rem 1.5rem',
  },
  error: {
    position: 'absolute',
    top: '1rem',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--crimson-dim)',
    border: '1px solid var(--crimson)',
    padding: '0.75rem 1.5rem',
    zIndex: 30,
    color: 'var(--parchment)',
    fontStyle: 'italic',
  },
  // Chat styles
  chatPanel: {
    position: 'absolute',
    top: '1rem',
    right: 0,
    width: '320px',
    height: 'calc(100% - 6rem)',
    background: 'rgba(13, 10, 10, 0.9)',
    border: '1px solid var(--blood-dim)',
    borderRight: 'none',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 25,
    transition: 'transform 0.3s ease',
  },
  chatToggle: {
    position: 'absolute',
    left: '-40px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'rgba(13, 10, 10, 0.9)',
    border: '1px solid var(--blood-dim)',
    borderRight: 'none',
    padding: '1rem 0.5rem',
    fontSize: '0.7rem',
    writingMode: 'vertical-rl',
    textOrientation: 'mixed',
    cursor: 'pointer',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  chatEmpty: {
    color: 'var(--text-dim)',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    textAlign: 'center',
    marginTop: '2rem',
  },
  chatMessage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '4px',
    maxWidth: '85%',
  },
  chatMessageSelf: {
    alignSelf: 'flex-end',
    background: 'var(--blood-dim)',
    borderColor: 'var(--blood)',
  },
  chatMessageOther: {
    alignSelf: 'flex-start',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--blood-dim)',
  },
  chatSender: {
    fontSize: '0.65rem',
    color: 'var(--ivory-dim)',
    letterSpacing: '0.05em',
  },
  chatText: {
    fontSize: '0.9rem',
    color: 'var(--ivory)',
    lineHeight: 1.4,
    wordBreak: 'break-word',
  },
  typingIndicator: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)',
    fontStyle: 'italic',
    padding: '0.25rem 0.5rem',
  },
  chatInputContainer: {
    display: 'flex',
    gap: '0.5rem',
    padding: '0.75rem',
    borderTop: '1px solid var(--blood-dim)',
  },
  chatInput: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    fontSize: '0.85rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--blood-dim)',
    color: 'var(--ivory)',
  },
  chatSendButton: {
    padding: '0.5rem 1rem',
    fontSize: '0.75rem',
  },
};
