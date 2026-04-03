import { useState } from 'react';
import { SignalingClient } from '../../../lib/signaling';
import {
  VisualEffectType,
  PenanceAssignment,
  ScriptureVerse,
  BookEntry,
} from '../../../lib/types';
import { getAudioManager } from '../../../lib/audio';

export function usePriestActions(signaling: SignalingClient) {
  const [activeEffects, setActiveEffects] = useState<Set<VisualEffectType>>(new Set());
  const [absolutionActive, setAbsolutionActive] = useState(false);
  const [silenceActive, setSilenceActive] = useState(false);
  const [excommunicateActive, setExcommunicateActive] = useState(false);
  const [currentPenance, setCurrentPenance] = useState<PenanceAssignment | null>(null);
  const [currentScripture, setCurrentScripture] = useState<ScriptureVerse | null>(null);
  const [bookEntries, setBookEntries] = useState<BookEntry[]>([]);

  const audioManager = getAudioManager();

  const toggleEffect = (effect: VisualEffectType) => {
    setActiveEffects((prev) => {
      const next = new Set(prev);
      if (next.has(effect)) next.delete(effect); else next.add(effect);
      return next;
    });
  };

  // Handlers for receiving priest messages (sinner side)
  const handleIncoming = (msg: Record<string, unknown>) => {
    switch (msg.type) {
      case 'priest-penance':
        setCurrentPenance(msg.penance as PenanceAssignment);
        break;
      case 'priest-absolution':
        setAbsolutionActive(true);
        audioManager.play('organ-swell');
        setTimeout(() => setAbsolutionActive(false), 100);
        break;
      case 'priest-scripture':
        setCurrentScripture(msg.verse as ScriptureVerse);
        break;
      case 'priest-effect':
        toggleEffect(msg.effect as VisualEffectType);
        break;
      case 'priest-bells':
        audioManager.play('sanctus-bells');
        break;
      case 'priest-silence':
        setSilenceActive(msg.active as boolean);
        if (msg.active) audioManager.startLoop('ambient-silence');
        else audioManager.stopLoop('ambient-silence');
        break;
      case 'priest-inscribe':
        setBookEntries((prev) => [
          ...prev,
          { id: crypto.randomUUID(), text: msg.text as string, timestamp: Date.now() },
        ]);
        break;
      case 'priest-excommunicate':
        setExcommunicateActive(true);
        break;
    }
  };

  // Priest action senders
  const sendPenance = (penance: PenanceAssignment) => {
    signaling.send({ type: 'priest-penance', penance });
    setCurrentPenance(penance);
  };

  const grantAbsolution = () => {
    signaling.send({ type: 'priest-absolution' });
    setAbsolutionActive(true);
    audioManager.play('organ-swell');
    setTimeout(() => setAbsolutionActive(false), 100);
  };

  const sendScripture = (verse: ScriptureVerse) => {
    signaling.send({ type: 'priest-scripture', verse });
    setCurrentScripture(verse);
  };

  const sendToggleEffect = (effect: VisualEffectType) => {
    signaling.send({ type: 'priest-effect', effect });
    toggleEffect(effect);
  };

  const ringBells = () => {
    signaling.send({ type: 'priest-bells' });
    audioManager.play('sanctus-bells');
  };

  const toggleSilence = () => {
    const next = !silenceActive;
    signaling.send({ type: 'priest-silence', active: next });
    setSilenceActive(next);
    if (next) audioManager.startLoop('ambient-silence');
    else audioManager.stopLoop('ambient-silence');
  };

  const excommunicate = (onDone: () => void) => {
    signaling.send({ type: 'priest-excommunicate' });
    setExcommunicateActive(true);
    setTimeout(onDone, 3000);
  };

  const inscribe = (text: string) => {
    signaling.send({ type: 'priest-inscribe', text });
    setBookEntries((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, timestamp: Date.now() },
    ]);
  };

  return {
    activeEffects,
    absolutionActive,
    silenceActive,
    excommunicateActive,
    currentPenance,
    currentScripture,
    bookEntries,
    handleIncoming,
    sendPenance,
    grantAbsolution,
    sendScripture,
    sendToggleEffect,
    ringBells,
    toggleSilence,
    excommunicate,
    inscribe,
    dismissPenance: () => setCurrentPenance(null),
    dismissScripture: () => setCurrentScripture(null),
  };
}
