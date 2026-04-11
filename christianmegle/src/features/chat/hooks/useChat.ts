import { useEffect, useRef, useState } from 'react';
import { SignalingClient } from '../../../lib/signaling';
import { UserRole } from '../../../lib/types';
import type { ChatTextMessage, ChatTypingMessage } from '../../../../shared/types/messages';
import { getAudioManager } from '../../../lib/audio';
import { scrambleToTongues } from '../../../lib/tongues';

export interface ChatMessage {
  id: string;
  text: string;
  sender: UserRole;
  timestamp: number;
  tongues?: boolean;
}

export function useChat(signaling: SignalingClient, role: UserRole) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [strangerTyping, setStrangerTyping] = useState(false);
  const [tonguesActive, setTonguesActive] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const audioManager = getAudioManager();

  const handleIncoming = (msg: ChatTextMessage | ChatTypingMessage) => {
    if (msg.type === 'chat-message') {
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: msg.text, sender: msg.sender, timestamp: Date.now(), tongues: msg.tongues },
      ]);
      setStrangerTyping(false);
      audioManager.play('chat-message');
    }
    if (msg.type === 'chat-typing') {
      setStrangerTyping(msg.isTyping);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const raw = chatInput.trim();
    const finalText = tonguesActive ? scrambleToTongues(raw) : raw;
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: finalText,
      sender: role,
      timestamp: Date.now(),
      tongues: tonguesActive || undefined,
    };
    setChatMessages((prev) => [...prev, message]);
    signaling.send({ type: 'chat-message', text: finalText, sender: role, tongues: tonguesActive || undefined });
    setChatInput('');
    signaling.send({ type: 'chat-typing', isTyping: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    signaling.send({ type: 'chat-typing', isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      signaling.send({ type: 'chat-typing', isTyping: false });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return {
    chatMessages,
    chatInput,
    strangerTyping,
    tonguesActive,
    chatEndRef,
    handleIncoming,
    sendMessage,
    handleInputChange,
    handleKeyDown,
    toggleTongues: () => setTonguesActive((prev) => !prev),
  };
}
