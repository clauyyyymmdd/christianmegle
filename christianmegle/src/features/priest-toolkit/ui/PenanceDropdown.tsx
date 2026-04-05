import { useState } from 'react';
import { PenanceType, PenanceAssignment } from '../../../lib/types';

interface PenanceDropdownProps {
  onSelect: (penance: PenanceAssignment) => void;
  onClose: () => void;
}

interface PenanceOption {
  type: PenanceType;
  label: string;
  defaultQuantity?: number;
}

const PENANCE_OPTIONS: PenanceOption[] = [
  { type: 'hail-mary', label: 'Hail Mary', defaultQuantity: 3 },
  { type: 'our-father', label: 'Our Father', defaultQuantity: 1 },
  { type: 'rosary', label: 'The Rosary', defaultQuantity: 1 },
  { type: 'stations', label: 'Stations of the Cross' },
  { type: 'fasting', label: 'Fasting' },
  { type: 'almsgiving', label: 'Almsgiving' },
  { type: 'custom', label: 'Custom Penance...' },
];

export default function PenanceDropdown({ onSelect, onClose }: PenanceDropdownProps) {
  const [selectedType, setSelectedType] = useState<PenanceType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customText, setCustomText] = useState('');

  const handleOptionClick = (option: PenanceOption) => {
    if (option.type === 'custom') {
      setSelectedType('custom');
    } else if (option.defaultQuantity) {
      setSelectedType(option.type);
      setQuantity(option.defaultQuantity);
    } else {
      onSelect({ type: option.type });
    }
  };

  const handleSubmit = () => {
    if (selectedType === 'custom') {
      if (customText.trim()) {
        onSelect({ type: 'custom', customText: customText.trim() });
      }
    } else if (selectedType) {
      onSelect({ type: selectedType, quantity });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="dropdown-content" onClick={handleBackdropClick}>
      {!selectedType && (
        <>
          {PENANCE_OPTIONS.map((option) => (
            <div
              key={option.type}
              className="penance-option"
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
            </div>
          ))}
        </>
      )}

      {selectedType && selectedType !== 'custom' && (
        <div className="quantity-input">
          <span>Quantity:</span>
          <input
            type="number"
            min="1"
            max="100"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            autoFocus
          />
          <button onClick={handleSubmit}>Assign</button>
          <button onClick={() => setSelectedType(null)}>Back</button>
        </div>
      )}

      {selectedType === 'custom' && (
        <div style={{ padding: '0.5rem' }}>
          <textarea
            placeholder="Describe the penance..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            style={{
              width: '100%',
              minHeight: '80px',
              marginBottom: '0.5rem',
              resize: 'vertical',
            }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleSubmit} style={{ flex: 1 }}>
              Assign
            </button>
            <button onClick={() => setSelectedType(null)} style={{ flex: 1 }}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
