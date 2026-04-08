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
  chatColumn: {
    width: '320px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0808',
    borderLeft: '1px solid #2a2622',
  },
  chatHeader: {
    padding: '0.85rem 1rem',
    background: '#15110f',
    borderBottom: '1px solid #2a2622',
    flexShrink: 0,
  },
  chatHeaderLabel: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    color: '#f5f0e6',
    letterSpacing: '0.1em',
    fontWeight: 700,
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    background: '#0a0808',
  },
  chatEmpty: {
    color: '#8a8278',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.8rem',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '2rem',
  },
  chatMessage: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '0.6rem 0.75rem',
    maxWidth: '90%',
    borderRadius: '4px',
  },
  chatMessageSelf: {
    alignSelf: 'flex-end',
    background: '#2a201c',
    border: '1px solid #5a4a40',
  },
  chatMessageOther: {
    alignSelf: 'flex-start',
    background: '#1a1614',
    border: '1px solid #3a3530',
  },
  chatSender: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.65rem',
    color: '#c9c0b0',
    letterSpacing: '0.06em',
    marginBottom: '0.15rem',
    fontWeight: 700,
  },
  chatText: {
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    color: '#f5f0e6',
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  typingIndicator: {
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.7rem',
    color: '#c9c0b0',
    fontStyle: 'italic',
    padding: '0.3rem 0.4rem',
  },
  chatInputContainer: {
    display: 'flex',
    gap: '0',
    background: '#15110f',
    borderTop: '1px solid #2a2622',
    flexShrink: 0,
  },
  chatInput: {
    flex: 1,
    padding: '0.85rem 1rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.85rem',
    background: '#0a0808',
    border: 'none',
    borderRight: '1px solid #2a2622',
    color: '#f5f0e6',
    outline: 'none',
  },
  chatSendButton: {
    padding: '0.85rem 1.25rem',
    fontFamily: 'var(--font-terminal)',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    background: '#2a201c',
    border: 'none',
    borderRadius: 0,
    color: '#f5f0e6',
    cursor: 'pointer',
    flexShrink: 0,
    fontWeight: 700,
  },
};
