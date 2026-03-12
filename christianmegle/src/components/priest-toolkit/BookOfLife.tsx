import { useEffect, useRef } from 'react';
import { BookEntry } from '../../lib/types';

interface BookOfLifeProps {
  entries: BookEntry[];
}

export default function BookOfLife({ entries }: BookOfLifeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="book-of-life" ref={scrollRef}>
      <h4>Book of Life</h4>
      {entries.map((entry) => (
        <div key={entry.id} className="entry">
          <div className="entry-text">{entry.text}</div>
          <div className="entry-time">{formatTime(entry.timestamp)}</div>
        </div>
      ))}
    </div>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
