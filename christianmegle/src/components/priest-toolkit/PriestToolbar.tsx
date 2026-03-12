import { useState } from 'react';
import { VisualEffectType, PenanceAssignment, ScriptureVerse } from '../../lib/types';
import PenanceDropdown from './PenanceDropdown';
import ScriptureLibrary from './ScriptureLibrary';

interface PriestToolbarProps {
  activeEffects: Set<VisualEffectType>;
  silenceActive: boolean;
  onSendPenance: (penance: PenanceAssignment) => void;
  onGrantAbsolution: () => void;
  onSendScripture: (verse: ScriptureVerse) => void;
  onToggleEffect: (effect: VisualEffectType) => void;
  onRingBells: () => void;
  onToggleSilence: () => void;
  onExcommunicate: () => void;
  onInscribe: (text: string) => void;
}

export default function PriestToolbar({
  activeEffects,
  silenceActive,
  onSendPenance,
  onGrantAbsolution,
  onSendScripture,
  onToggleEffect,
  onRingBells,
  onToggleSilence,
  onExcommunicate,
  onInscribe,
}: PriestToolbarProps) {
  const [showPenance, setShowPenance] = useState(false);
  const [showScripture, setShowScripture] = useState(false);
  const [showInscribe, setShowInscribe] = useState(false);
  const [showExcommunicateConfirm, setShowExcommunicateConfirm] = useState(false);
  const [inscribeText, setInscribeText] = useState('');

  const handlePenanceSelect = (penance: PenanceAssignment) => {
    onSendPenance(penance);
    setShowPenance(false);
  };

  const handleScriptureSelect = (verse: ScriptureVerse) => {
    onSendScripture(verse);
    setShowScripture(false);
  };

  const handleInscribeSubmit = () => {
    if (inscribeText.trim()) {
      onInscribe(inscribeText.trim());
      setInscribeText('');
      setShowInscribe(false);
    }
  };

  const handleExcommunicateConfirm = () => {
    onExcommunicate();
    setShowExcommunicateConfirm(false);
  };

  const atmosphereEffects: VisualEffectType[] = [
    'stained-glass',
    'incense',
    'candlelight',
    'holy-water',
  ];

  return (
    <>
      <div className="priest-toolbar">
        {/* Sacraments */}
        <div className="toolbar-section">
          <div className="section-title">Sacraments</div>
          <div className="penance-dropdown">
            <button onClick={() => setShowPenance(!showPenance)}>
              Assign Penance
            </button>
            {showPenance && (
              <PenanceDropdown
                onSelect={handlePenanceSelect}
                onClose={() => setShowPenance(false)}
              />
            )}
          </div>
          <button onClick={onGrantAbsolution}>
            Grant Absolution
          </button>
          <button onClick={() => setShowInscribe(true)}>
            Inscribe
          </button>
        </div>

        {/* Scripture */}
        <div className="toolbar-section">
          <div className="section-title">Scripture</div>
          <button onClick={() => setShowScripture(true)}>
            Send Verse
          </button>
        </div>

        {/* Atmosphere */}
        <div className="toolbar-section">
          <div className="section-title">Atmosphere</div>
          {atmosphereEffects.map((effect) => (
            <button
              key={effect}
              onClick={() => onToggleEffect(effect)}
              className={activeEffects.has(effect) ? 'active' : ''}
            >
              {formatEffectName(effect)}
            </button>
          ))}
          <button onClick={onRingBells}>
            Ring Bells
          </button>
        </div>

        {/* Discipline */}
        <div className="toolbar-section">
          <div className="section-title">Discipline</div>
          <button
            onClick={onToggleSilence}
            className={silenceActive ? 'active' : ''}
          >
            {silenceActive ? 'Lift Silence' : 'Impose Silence'}
          </button>
          <button
            className="danger"
            onClick={() => setShowExcommunicateConfirm(true)}
          >
            Excommunicate
          </button>
        </div>
      </div>

      {/* Scripture Library Modal */}
      {showScripture && (
        <ScriptureLibrary
          onSelect={handleScriptureSelect}
          onClose={() => setShowScripture(false)}
        />
      )}

      {/* Inscribe Modal */}
      {showInscribe && (
        <div className="inscribe-modal">
          <div className="modal-content">
            <h3>Inscribe in the Book of Life</h3>
            <textarea
              value={inscribeText}
              onChange={(e) => setInscribeText(e.target.value)}
              placeholder="Write your inscription..."
              autoFocus
            />
            <div className="modal-buttons">
              <button onClick={() => setShowInscribe(false)}>
                Cancel
              </button>
              <button onClick={handleInscribeSubmit}>
                Inscribe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excommunicate Confirmation Modal */}
      {showExcommunicateConfirm && (
        <div className="confirm-modal">
          <div className="modal-content">
            <h3>Excommunication</h3>
            <p>
              This soul shall be cast out from the fellowship of the faithful.
              This action will end the session immediately.
            </p>
            <div className="modal-buttons">
              <button onClick={() => setShowExcommunicateConfirm(false)}>
                Show Mercy
              </button>
              <button
                className="primary"
                onClick={handleExcommunicateConfirm}
                style={{ borderColor: 'var(--crimson)', background: 'var(--crimson-dim)' }}
              >
                Excommunicate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function formatEffectName(effect: VisualEffectType): string {
  return effect
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
