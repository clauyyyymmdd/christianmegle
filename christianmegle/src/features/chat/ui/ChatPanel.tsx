import type { RefObject } from 'react';
import { UserRole } from '../../../lib/types';
import type { ChatMessage } from '../hooks/useChat';

interface ChatPanelProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  strangerTyping: boolean;
  chatEndRef: RefObject<HTMLDivElement>;
  sessionActive: boolean;
  connectionState: string;
  role: UserRole;
  onSend: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export function ChatPanel({
  chatMessages,
  chatInput,
  strangerTyping,
  chatEndRef,
  sessionActive,
  connectionState,
  role,
  onSend,
  onInputChange,
  onKeyDown,
}: ChatPanelProps) {
  return (
    <div style={styles.chatColumn}>
      <div style={styles.chatHeader}>
        <span style={styles.chatHeaderLabel}>&gt; CONFESSION CHAT _</span>
      </div>
      <div style={styles.chatMessages}>
        {chatMessages.length === 0 && (
          <p style={styles.chatEmpty}>
            {sessionActive
              ? 'Say something...'
              : connectionState === 'ended'
                ? 'Session ended.'
                : 'Waiting for connection...'}
          </p>
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
          onChange={onInputChange}
          onKeyDown={onKeyDown}
          placeholder={sessionActive ? 'Type a message...' : 'Waiting...'}
          disabled={!sessionActive}
          style={{ ...styles.chatInput, opacity: sessionActive ? 1 : 0.4 }}
        />
        <button
          onClick={onSend}
          disabled={!sessionActive}
          style={{ ...styles.chatSendButton, opacity: sessionActive ? 1 : 0.4 }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  chatColumn: { width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'rgba(10, 8, 8, 0.98)' },
  chatHeader: { padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  chatHeaderLabel: { fontFamily: 'var(--font-terminal)', fontSize: '0.7rem', color: 'var(--ivory-dim)', letterSpacing: '0.1em' },
  chatMessages: { flex: 1, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  chatEmpty: { color: 'var(--ivory-dim)', fontFamily: 'var(--font-terminal)', fontSize: '0.75rem', fontStyle: 'italic', textAlign: 'center', marginTop: '2rem', opacity: 0.5 },
  chatMessage: { display: 'flex', flexDirection: 'column', gap: '0.2rem', padding: '0.5rem 0.65rem', maxWidth: '90%' },
  chatMessageSelf: { alignSelf: 'flex-end', background: 'rgba(100, 20, 20, 0.4)', border: '1px solid rgba(139, 0, 0, 0.4)' },
  chatMessageOther: { alignSelf: 'flex-start', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' },
  chatSender: { fontFamily: 'var(--font-terminal)', fontSize: '0.6rem', color: 'var(--ivory-dim)', letterSpacing: '0.06em', marginBottom: '0.1rem' },
  chatText: { fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--ivory)', lineHeight: 1.45, wordBreak: 'break-word' },
  typingIndicator: { fontFamily: 'var(--font-terminal)', fontSize: '0.7rem', color: 'var(--ivory-dim)', fontStyle: 'italic', padding: '0.2rem 0.4rem', opacity: 0.6 },
  chatInputContainer: { display: 'flex', gap: '0', borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 },
  chatInput: { flex: 1, padding: '0.7rem 0.85rem', fontFamily: 'var(--font-terminal)', fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', border: 'none', borderRight: '1px solid rgba(255,255,255,0.08)', color: 'var(--ivory)', outline: 'none' },
  chatSendButton: { padding: '0.7rem 1rem', fontFamily: 'var(--font-terminal)', fontSize: '0.7rem', letterSpacing: '0.08em', background: 'transparent', border: 'none', borderRadius: 0, color: 'var(--ivory-dim)', cursor: 'pointer', flexShrink: 0 },
};
