import { PriestToolbar, BookOfLife } from '../../../components/priest-toolkit';
import type {
  VisualEffectType,
  PenanceAssignment,
  ScriptureVerse,
  BookEntry,
} from '../../../lib/types';

interface PriestControlsProps {
  sessionActive: boolean;
  activeEffects: Set<VisualEffectType>;
  silenceActive: boolean;
  bookEntries: BookEntry[];
  onSendPenance: (penance: PenanceAssignment) => void;
  onGrantAbsolution: () => void;
  onSendScripture: (verse: ScriptureVerse) => void;
  onToggleEffect: (effect: VisualEffectType) => void;
  onRingBells: () => void;
  onToggleSilence: () => void;
  onExcommunicate: () => void;
  onInscribe: (text: string) => void;
}

export function PriestControls({
  sessionActive,
  activeEffects,
  silenceActive,
  bookEntries,
  onSendPenance,
  onGrantAbsolution,
  onSendScripture,
  onToggleEffect,
  onRingBells,
  onToggleSilence,
  onExcommunicate,
  onInscribe,
}: PriestControlsProps) {
  return (
    <>
      {sessionActive && (
        <PriestToolbar
          activeEffects={activeEffects}
          silenceActive={silenceActive}
          onSendPenance={onSendPenance}
          onGrantAbsolution={onGrantAbsolution}
          onSendScripture={onSendScripture}
          onToggleEffect={onToggleEffect}
          onRingBells={onRingBells}
          onToggleSilence={onToggleSilence}
          onExcommunicate={onExcommunicate}
          onInscribe={onInscribe}
        />
      )}
      {bookEntries.length > 0 && <BookOfLife entries={bookEntries} />}
    </>
  );
}
