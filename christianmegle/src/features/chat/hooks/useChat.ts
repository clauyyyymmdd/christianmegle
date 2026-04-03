import { useEffect, useRef, useState } from 'react';
import { SignalingClient } from '../../../lib/signaling';
import { UserRole } from '../../../lib/types';
import { getAudioManager } from '../../../lib/audio';

export interface ChatMessage {
  id: string;
  text: string;
  sender: UserRole;
  timestamp: number;
}

export function useChat(signaling: SignalingClient, role: UserRole) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [strangerTyping, setStrangerTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const audioManager = getAudioManager();

  const handleIncoming = (msg: { type: string; text?: string; sender?: UserRole; isTyping?: boolean }) => {
    if (msg.type === 'chat-message') {
      setChatMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: msg.text!, sender: msg.sender!, timestamp: Date.now() },
      ]);
      setStrangerTyping(false);
      audioManager.play('chat-message');
    }
    if (msg.type === 'chat-typing') {
      setStrangerTyping(msg.isTyping!);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      text: chatInput.trim(),
      sender: role,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, message]);
    signaling.send({ type: 'chat-message', text: message.text, sender: role });
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
    chatEndRef,
    handleIncoming,
    sendMessage,
    handleInputChange,
    handleKeyDown,
  };
}
