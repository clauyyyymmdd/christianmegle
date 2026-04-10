import { VisualEffectType } from '../../../lib/types';

interface AtmosphereToolbarProps {
  activeEffects: Set<VisualEffectType>;
  onToggleEffect: (effect: VisualEffectType) => void;
  onRingBells: () => void;
}

/**
 * Atmosphere controls available to both priests and sinners during a
 * session: visual effects (stained glass, incense, candlelight, holy
 * water), ring bells, and take eucharist.
 */
export default function AtmosphereToolbar({
  activeEffects,
  onToggleEffect,
  onRingBells,
}: AtmosphereToolbarProps) {
  const effects: VisualEffectType[] = [
    'stained-glass',
    'incense',
    'candlelight',
    'holy-water',
  ];

  return (
    <div className="priest-toolbar">
      <div className="toolbar-section">
        <div className="section-title">Atmosphere</div>
        {effects.map((effect) => (
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
        <button onClick={() => alert('🍞🍷 You have taken the Eucharist.')}>
          Take Eucharist
        </button>
      </div>
    </div>
  );
}

function formatEffectName(effect: VisualEffectType): string {
  return effect
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
