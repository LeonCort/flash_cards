import './WordCard.css';

interface WordCardProps {
  word: {
    _id: string;
    text: string;
    stats: {
      total: number;
      correctRate: number | null;
      typicalTimeMs: number | null;
      highScoreMs: number | null;
    };
  };
  isSelected: boolean;
  onToggleSelection: (wordId: string) => void;
  onReset: (wordId: string) => void;
  onWordClick: (wordId: string) => void;
  maxTimeMs?: number; // For determining if word has cleared time limit
}

function msFmt(ms: number | null | undefined) {
  if (ms == null) return "—";
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function WordCard({
  word,
  isSelected,
  onToggleSelection,
  onReset,
  onWordClick,
  maxTimeMs
}: WordCardProps) {
  // Determine performance indicators
  const hasAttempts = word.stats.total > 0;
  const accuracy = word.stats.correctRate ? Math.round(word.stats.correctRate * 100) : 0;
  const hasGoodAccuracy = accuracy >= 80;
  const hasClearedTimeLimit = maxTimeMs && word.stats.highScoreMs && word.stats.highScoreMs <= maxTimeMs;
  
  // Performance level for styling
  const getPerformanceLevel = () => {
    if (!hasAttempts) return 'new';
    if (accuracy >= 90) return 'excellent';
    if (accuracy >= 70) return 'good';
    return 'needs-work';
  };

  const performanceLevel = getPerformanceLevel();

  const handleCardClick = () => {
    onToggleSelection(word._id);
  };

  const handlePracticeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onWordClick(word._id);
  };

  return (
    <div
      className={`word-card ${performanceLevel} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      title={`Click to ${isSelected ? 'deselect' : 'select'} "${word.text}" for training`}
    >


      {/* Performance indicators */}
      <div className="card-indicators">
        {hasClearedTimeLimit && (
          <span className="indicator star" title="Cleared time limit!">⭐</span>
        )}
        {hasGoodAccuracy && hasAttempts && (
          <span className="indicator smiley" title="Good accuracy!">😊</span>
        )}
      </div>

      {/* Main word content */}
      <div className="card-content">
        <div className="word-text">{word.text}</div>

        <div className="word-stats">
          {hasAttempts ? (
            <>
              <div className="stat-row">
                <span className="stat-label">Attempts:</span>
                <span className="stat-value">{word.stats.total}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Accuracy:</span>
                <span className="stat-value">{accuracy}%</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Best:</span>
                <span className="stat-value">{msFmt(word.stats.highScoreMs)}</span>
              </div>
            </>
          ) : (
            <div className="no-stats">No attempts yet</div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="card-actions">
        <button
          className="practice-btn"
          onClick={handlePracticeClick}
          title={`Practice "${word.text}"`}
        >
          Practice
        </button>
        <button
          className="reset-btn"
          onClick={(e) => {
            e.stopPropagation();
            onReset(word._id);
          }}
          title="Reset word statistics"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
