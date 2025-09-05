import Modal from './Modal';
import './RoundCompleteModal.css';

interface RoundCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNewRound: () => void;
  onContinuePracticing: () => void;
  solvedCount: number;
  totalCount: number;
  repsPerWord: number;
  maxTimeMs?: number;
}

export default function RoundCompleteModal({
  isOpen,
  onClose,
  onStartNewRound,
  onContinuePracticing,
  solvedCount,
  totalCount,
  repsPerWord,
  maxTimeMs
}: RoundCompleteModalProps) {
  const completionRate = Math.round((solvedCount / totalCount) * 100);
  const isFullCompletion = solvedCount === totalCount;

  const handleStartNewRound = () => {
    onStartNewRound();
    onClose();
  };

  const handleContinuePracticing = () => {
    onContinuePracticing();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className="round-complete-modal"
      showCloseButton={false}
    >
      <div className="round-complete-content">
        <div className="round-complete-icon">
          {isFullCompletion ? '🎉' : '👏'}
        </div>
        
        <h2 className="round-complete-title">
          {isFullCompletion ? 'Round Complete!' : 'Great Progress!'}
        </h2>
        
        <p className="round-complete-description">
          {isFullCompletion 
            ? 'Congratulations! You completed all the words in this round.'
            : 'You made excellent progress on this round. Keep practicing to improve!'
          }
        </p>
        
        <div className="round-complete-stats">
          <div className="completion-circle">
            <div className="completion-percentage">{completionRate}%</div>
            <div className="completion-label">Complete</div>
          </div>
          
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{solvedCount}</div>
              <div className="stat-label">Words Mastered</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">{totalCount - solvedCount}</div>
              <div className="stat-label">Still Learning</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">{repsPerWord}</div>
              <div className="stat-label">Target Reps</div>
            </div>
            
            {maxTimeMs && (
              <div className="stat-item">
                <div className="stat-value">{(maxTimeMs / 1000).toFixed(1)}s</div>
                <div className="stat-label">Time Goal</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="round-complete-actions">
          <button 
            className="round-complete-continue" 
            onClick={handleContinuePracticing}
          >
            Continue Practicing
          </button>
          <button 
            className="round-complete-new-round" 
            onClick={handleStartNewRound}
            autoFocus
          >
            Start New Round
          </button>
        </div>
      </div>
    </Modal>
  );
}
