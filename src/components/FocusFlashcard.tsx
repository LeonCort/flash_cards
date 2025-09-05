import './FocusFlashcard.css';

interface FocusFlashcardProps {
  word: string;
  elapsedMs: number;
  onNext: () => void;
  onReset: () => void;
  flipping: boolean;

  // Round data
  roundState?: {
    solved: number;
    total: number;
    round?: {
      repsPerWord: number;
      maxTimeMs?: number;
    };
  };
  isRoundComplete: boolean;

  // Performance tracking
  streak?: number;
}

export default function FocusFlashcard({
  word,
  elapsedMs,
  onNext,
  onReset,
  flipping,
  roundState,
  isRoundComplete,
  streak = 0
}: FocusFlashcardProps) {
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Determine if we're approaching or exceeding time limit
  const maxTime = roundState?.round?.maxTimeMs;
  const isApproachingLimit = maxTime && elapsedMs > maxTime * 0.8;
  const isOverLimit = maxTime && elapsedMs > maxTime;

  return (
    <div className={`focus-flashcard ${flipping ? 'flipping' : ''}`}>
      {/* Simple Progress Indicator */}
      {roundState && (
        <div className="simple-progress">
          <span className="progress-text">
            {roundState.solved}/{roundState.total}
          </span>
          {roundState.round?.repsPerWord && (
            <span className="goal-text">
              Goal: {roundState.round.repsPerWord} reps per word
              {roundState.round.maxTimeMs && ` under ${formatTime(roundState.round.maxTimeMs)}`}
            </span>
          )}
        </div>
      )}

      {/* Streak Display (only if > 0) */}
      {streak > 0 && (
        <div className="streak-display">
          🔥 {streak} streak
        </div>
      )}

      {/* Main Word Display */}
      <div className="word-container">
        <div className={`word-display ${isOverLimit ? 'over-limit' : isApproachingLimit ? 'approaching-limit' : ''}`}>
          {word}
        </div>

        {/* Simple Timer */}
        <div className={`timer-display ${isOverLimit ? 'over-limit' : isApproachingLimit ? 'approaching-limit' : ''}`}>
          {formatTime(elapsedMs)}
          {maxTime && (
            <span className="time-limit">/ {formatTime(maxTime)}</span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="focus-actions">
        <button className="next-btn" onClick={onNext}>
          Next <span className="keyboard-hint">⎵</span>
        </button>
        <button className="reset-btn" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}
