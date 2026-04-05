import { useEffect, useState } from 'react';
import {
  VisualEffectType,
  PenanceAssignment,
  ScriptureVerse,
} from '../../../lib/types';

interface EffectsOverlayProps {
  activeEffects: Set<VisualEffectType>;
  absolutionActive: boolean;
  silenceActive: boolean;
  excommunicateActive: boolean;
  currentPenance: PenanceAssignment | null;
  currentScripture: ScriptureVerse | null;
  onPenanceDismiss: () => void;
  onScriptureDismiss: () => void;
}

export default function EffectsOverlay({
  activeEffects,
  absolutionActive,
  silenceActive,
  excommunicateActive,
  currentPenance,
  currentScripture,
  onPenanceDismiss,
  onScriptureDismiss,
}: EffectsOverlayProps) {
  const [showAbsolution, setShowAbsolution] = useState(false);
  const [showExcommunicate, setShowExcommunicate] = useState(false);

  // Handle absolution animation timing
  useEffect(() => {
    if (absolutionActive) {
      setShowAbsolution(true);
      const timer = setTimeout(() => setShowAbsolution(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [absolutionActive]);

  // Handle excommunication animation
  useEffect(() => {
    if (excommunicateActive) {
      setShowExcommunicate(true);
    }
  }, [excommunicateActive]);

  // Auto-dismiss penance after 10 seconds
  useEffect(() => {
    if (currentPenance) {
      const timer = setTimeout(onPenanceDismiss, 10000);
      return () => clearTimeout(timer);
    }
  }, [currentPenance, onPenanceDismiss]);

  // Auto-dismiss scripture after 12 seconds
  useEffect(() => {
    if (currentScripture) {
      const timer = setTimeout(onScriptureDismiss, 12000);
      return () => clearTimeout(timer);
    }
  }, [currentScripture, onScriptureDismiss]);

  return (
    <div className="effects-overlay">
      {/* Absolution Effect */}
      {showAbsolution && (
        <div className="effect-absolution">
          <div className="glow" />
          <div className="dove">🕊</div>
        </div>
      )}

      {/* Stained Glass */}
      {activeEffects.has('stained-glass') && (
        <div className="effect-stained-glass" />
      )}

      {/* Incense */}
      {activeEffects.has('incense') && (
        <div className="effect-incense">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="smoke-particle" />
          ))}
        </div>
      )}

      {/* Candlelight */}
      {activeEffects.has('candlelight') && (
        <div className="effect-candlelight" />
      )}

      {/* Holy Water */}
      {activeEffects.has('holy-water') && (
        <HolyWaterEffect />
      )}

      {/* Silence Effect */}
      {silenceActive && (
        <div className="effect-silence">
          <div className="message">Silence has been imposed</div>
          <div className="candle">🕯</div>
        </div>
      )}

      {/* Excommunication Effect */}
      {showExcommunicate && (
        <div className="effect-excommunicate">
          <div className="shatter-container">
            {[...Array(25)].map((_, i) => (
              <div
                key={i}
                className="shatter-piece"
                style={{
                  '--tx': `${(Math.random() - 0.5) * 200}px`,
                  '--ty': `${(Math.random() - 0.5) * 200}px`,
                  '--rot': `${(Math.random() - 0.5) * 360}deg`,
                  '--delay': `${Math.random() * 0.5}s`,
                } as React.CSSProperties}
              />
            ))}
          </div>
          <div className="fade-black" />
          <div className="message">Excommunicated</div>
        </div>
      )}

      {/* Penance Display */}
      {currentPenance && (
        <div className="penance-display" onClick={onPenanceDismiss}>
          <h3>Your Penance</h3>
          <div className="penance-text">
            {formatPenance(currentPenance)}
          </div>
          {currentPenance.quantity && currentPenance.quantity > 1 && (
            <div className="penance-quantity">
              {currentPenance.quantity} times
            </div>
          )}
        </div>
      )}

      {/* Scripture Display */}
      {currentScripture && (
        <div className="scripture-display" onClick={onScriptureDismiss}>
          <div className="verse-text">"{currentScripture.text}"</div>
          <div className="verse-reference">— {currentScripture.reference}</div>
        </div>
      )}
    </div>
  );
}

function HolyWaterEffect() {
  const [key, setKey] = useState(0);

  // Re-trigger animation periodically while effect is active
  useEffect(() => {
    const timer = setInterval(() => {
      setKey(k => k + 1);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="effect-holy-water" key={key}>
      <div className="ripple" />
      <div className="ripple" />
      <div className="ripple" />
      <div className="droplet">💧</div>
    </div>
  );
}

function formatPenance(penance: PenanceAssignment): string {
  const penanceNames: Record<string, string> = {
    'hail-mary': 'Hail Mary',
    'our-father': 'Our Father',
    'rosary': 'The Holy Rosary',
    'stations': 'The Stations of the Cross',
    'fasting': 'A period of fasting',
    'almsgiving': 'An act of almsgiving',
    'custom': penance.customText || 'A special penance',
  };

  return penanceNames[penance.type] || penance.type;
}
