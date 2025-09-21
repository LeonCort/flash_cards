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

  streak = 0
}: FocusFlashcardProps) {
  const formatTime = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Calculate progress bar values
  const maxTime = roundState?.round?.maxTimeMs;
  const progressPercentage = maxTime ? Math.min((elapsedMs / maxTime) * 100, 100) : 0;

  // Determine progress bar color based on elapsed time
  const getProgressBarColor = () => {
    if (!maxTime) return 'var(--accent)';

    const ratio = elapsedMs / maxTime;
    if (ratio <= 0.5) return '#10b981'; // Green - good time
    if (ratio <= 0.8) return '#f59e0b'; // Yellow - approaching limit
    return '#ef4444'; // Red - over/near limit
  };

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
        <div className="word-display">
          {word}
        </div>

        {/* Timer with Progress Bar */}
        <div className="timer-container">
          <div className="timer-display">
            {formatTime(elapsedMs)}
            {maxTime && (
              <span className="time-limit">/ {formatTime(maxTime)}</span>
            )}
          </div>

          {/* Progress Bar */}
          {maxTime && (
            <div className="timer-progress-bar-container">
              <div
                className="timer-progress-bar"
                style={{
                  width: `${progressPercentage}%`,
                  backgroundColor: getProgressBarColor()
                }}
              />
            </div>
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
