import { EffectsOverlay } from '../../../components/priest-toolkit';
import type {
  VisualEffectType,
  PenanceAssignment,
  ScriptureVerse,
} from '../../../lib/types';

interface PriestOverlayProps {
  activeEffects: Set<VisualEffectType>;
  absolutionActive: boolean;
  silenceActive: boolean;
  excommunicateActive: boolean;
  currentPenance: PenanceAssignment | null;
  currentScripture: ScriptureVerse | null;
  onPenanceDismiss: () => void;
  onScriptureDismiss: () => void;
}

export function PriestOverlay({
  activeEffects,
  absolutionActive,
  silenceActive,
  excommunicateActive,
  currentPenance,
  currentScripture,
  onPenanceDismiss,
  onScriptureDismiss,
}: PriestOverlayProps) {
  return (
    <EffectsOverlay
      activeEffects={activeEffects}
      absolutionActive={absolutionActive}
      silenceActive={silenceActive}
      excommunicateActive={excommunicateActive}
      currentPenance={currentPenance}
      currentScripture={currentScripture}
      onPenanceDismiss={onPenanceDismiss}
      onScriptureDismiss={onScriptureDismiss}
    />
  );
}
