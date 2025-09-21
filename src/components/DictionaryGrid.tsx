import WordCard from './WordCard';
import './WordCard.css';

interface DictionaryGridProps {
  words: any[];
  selectedWordIds: Set<string>;
  onToggleSelection: (wordId: string) => void;
  onReset: (wordId: string) => void;
  onDelete?: (wordId: string) => void;
  maxTimeMs?: number;
  onAddWord?: () => void;
  dictionaryName?: string;
}

export default function DictionaryGrid({
  words,
  selectedWordIds,
  onToggleSelection,
  onReset,
  onDelete,
  maxTimeMs,
  onAddWord,
  dictionaryName
}: DictionaryGridProps) {
  if (words.length === 0) {
    return (
      <div className="empty-grid">
        <div className="empty-message">
          <span className="empty-icon">✨</span>
          <h3>Ready to add words!</h3>
          <p>Start building your {dictionaryName ? `"${dictionaryName}"` : 'dictionary'} by adding your first word.</p>
          {onAddWord && (
            <button
              className="btn btn--primary"
              onClick={onAddWord}
            >
              ➕ Add Your First Word
            </button>
          )}
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
          onDelete={onDelete}
          maxTimeMs={maxTimeMs}
        />
      ))}
    </div>
  );
}
