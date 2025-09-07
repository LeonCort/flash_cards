import WordCard from './WordCard';
import './WordCard.css';

interface DictionaryGridProps {
  words: any[];
  selectedWordIds: Set<string>;
  onToggleSelection: (wordId: string) => void;
  onReset: (wordId: string) => void;
  onWordClick: (wordId: string) => void;
  maxTimeMs?: number;
}

export default function DictionaryGrid({
  words,
  selectedWordIds,
  onToggleSelection,
  onReset,
  onWordClick,
  maxTimeMs
}: DictionaryGridProps) {
  if (words.length === 0) {
    return (
      <div className="empty-grid">
        <div className="empty-message">
          <span className="empty-icon">📚</span>
          <h3>No words yet</h3>
          <p>Add some words to start building your dictionary!</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="words-grid"
      role="listbox"
      aria-label="Word dictionary"
      aria-multiselectable="true"
    >
      {words.map((word) => (
        <WordCard
          key={word._id}
          word={word}
          isSelected={selectedWordIds.has(word._id)}
          onToggleSelection={onToggleSelection}
          onReset={onReset}
          onWordClick={onWordClick}
          maxTimeMs={maxTimeMs}
        />
      ))}
    </div>
  );
}
