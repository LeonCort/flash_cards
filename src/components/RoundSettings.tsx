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
              className="btn btn--success btn--lg"
              disabled={wordsCount === 0}
              style={{ width: '100%' }}
            >
              <span>🚀</span>
              Start Round
              <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '2px' }}>
                {selectedWords > 0 && selectedWords < totalWords
                  ? `${selectedWords} of ${totalWords} words selected`
                  : selectedWords === 0 && totalWords > 0
                  ? `All ${wordsCount} words (none selected)`
                  : `${wordsCount} words`
                }
              </div>
            </button>
          ) : isRoundComplete ? (
            <button
              onClick={onCompleteRound}
              className="btn btn--success btn--lg"
              style={{ width: '100%' }}
            >
              <span>🎉</span>
              Start New Round
            </button>
          ) : (
            <button
              onClick={onEndRound}
              className="btn btn--destructive"
            >
              <span>⏹️</span>
              End Round Early
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
