import { useState } from 'react';
import { ScriptureVerse, SinCategory } from '../../../lib/types';
import { SCRIPTURE_BY_SIN, SIN_LABELS, SIN_ICONS } from '../../../lib/scripture-data';

interface ScriptureLibraryProps {
  onSelect: (verse: ScriptureVerse) => void;
  onClose: () => void;
}

const SIN_CATEGORIES: SinCategory[] = [
  'pride',
  'greed',
  'lust',
  'envy',
  'gluttony',
  'wrath',
  'sloth',
];

export default function ScriptureLibrary({ onSelect, onClose }: ScriptureLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<SinCategory>('pride');

  const verses = SCRIPTURE_BY_SIN[selectedCategory];

  return (
    <div className="scripture-picker">
      <button className="close-btn" onClick={onClose}>
        Close
      </button>

      <h3>Select Scripture</h3>

      <div className="sin-tabs">
        {SIN_CATEGORIES.map((category) => (
          <button
            key={category}
            className={`sin-tab ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {SIN_ICONS[category]} {SIN_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="verses-list">
        {verses.map((verse, index) => (
          <div
            key={index}
            className="verse-item"
            onClick={() => onSelect(verse)}
          >
            <div className="text">"{verse.text}"</div>
            <div className="reference">— {verse.reference}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
