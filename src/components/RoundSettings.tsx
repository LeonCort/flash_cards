import './RoundSettings.css';

interface RoundSettingsProps {
  repsPerWord: number;
  setRepsPerWord: (value: number) => void;
  maxTimeMs: string;
  setMaxTimeMs: (value: string) => void;
  activeRoundId: string | null;
  isRoundComplete: boolean;
  onStartRound: () => void;
  onEndRound: () => void;
  onCompleteRound: () => void;
  onResetStats: () => void;
  wordsCount: number;
  totalWords?: number;
  selectedWords?: number;
}

export default function RoundSettings({
  repsPerWord,
  setRepsPerWord,
  maxTimeMs,
  setMaxTimeMs,
  activeRoundId,
  isRoundComplete,
  onStartRound,
  onEndRound,
  onCompleteRound,
  onResetStats,
  wordsCount,
  totalWords = 0,
  selectedWords = 0
}: RoundSettingsProps) {
  const handleStartRound = () => {
    if (wordsCount === 0) {
      alert("Add some words first!");
      return;
    }
    onStartRound();
  };

  return (
    <div className="round-settings-card">
      <div className="round-settings-header">
        <h3>Round Settings</h3>
        <div className="round-settings-status">
          {activeRoundId ? (
            isRoundComplete ? (
              <span className="status-complete">🎉 Round Complete!</span>
            ) : (
              <span className="status-active">🔥 Round Active</span>
            )
          ) : (
            <span className="status-ready">⚡ Ready to Start</span>
          )}
        </div>
      </div>

      <div className="round-settings-content">
        <div className="settings-inputs">
          <div className="input-group">
            <label htmlFor="reps-per-word">Reps per word</label>
            <input
              id="reps-per-word"
              type="number"
              min={1}
              max={10}
              value={repsPerWord}
              onChange={e => setRepsPerWord(+e.target.value)}
              disabled={!!activeRoundId}
              className="round-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="max-time">Max time (optional)</label>
            <input
              id="max-time"
              type="number"
              min={0}
              value={maxTimeMs}
              onChange={e => setMaxTimeMs(e.target.value)}
              placeholder="ms"
              disabled={!!activeRoundId}
              className="round-input"
            />
          </div>
        </div>

        <div className="settings-actions">
          {!activeRoundId ? (
            <button
              onClick={handleStartRound}
              className="start-round-btn"
              disabled={wordsCount === 0}
            >
              <span className="btn-icon">🚀</span>
              Start Round
              <span className="btn-subtitle">
                {selectedWords > 0 && selectedWords < totalWords
                  ? `${selectedWords} of ${totalWords} words selected`
                  : selectedWords === 0 && totalWords > 0
                  ? `All ${wordsCount} words (none selected)`
                  : `${wordsCount} words`
                }
              </span>
            </button>
          ) : isRoundComplete ? (
            <button 
              onClick={onCompleteRound}
              className="complete-round-btn"
            >
              <span className="btn-icon">🎉</span>
              Start New Round
            </button>
          ) : (
            <button 
              onClick={onEndRound}
              className="end-round-btn"
            >
              <span className="btn-icon">⏹️</span>
              End Round Early
            </button>
          )}

          <button 
            onClick={onResetStats}
            className="reset-stats-btn"
            title="Reset all word statistics"
          >
            <span className="btn-icon">🔄</span>
            Reset Stats
          </button>
        </div>
      </div>
    </div>
  );
}
