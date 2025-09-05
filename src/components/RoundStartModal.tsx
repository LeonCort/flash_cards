import Modal from './Modal';
import './RoundStartModal.css';

interface RoundStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  wordCount: number;
  repsPerWord: number;
  maxTimeMs?: number;
}

export default function RoundStartModal({
  isOpen,
  onClose,
  onConfirm,
  wordCount,
  repsPerWord,
  maxTimeMs
}: RoundStartModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      className="round-start-modal"
      showCloseButton={false}
    >
      <div className="round-start-content">
        <div className="round-start-icon">
          🚀
        </div>
        
        <h2 className="round-start-title">Start New Round</h2>
        
        <p className="round-start-description">
          Ready to begin your practice session? Here's what you'll be working on:
        </p>
        
        <div className="round-start-stats">
          <div className="stat-item">
            <div className="stat-label">Words to practice</div>
            <div className="stat-value">{wordCount}</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-label">Target per word</div>
            <div className="stat-value">{repsPerWord} correct {repsPerWord === 1 ? 'attempt' : 'attempts'}</div>
          </div>
          
          {maxTimeMs && (
            <div className="stat-item">
              <div className="stat-label">Time challenge</div>
              <div className="stat-value">Under {(maxTimeMs / 1000).toFixed(1)}s</div>
            </div>
          )}
        </div>
        
        <div className="round-start-goal">
          <strong>Goal:</strong> Complete {repsPerWord} correct {repsPerWord === 1 ? 'attempt' : 'attempts'} 
          per word{maxTimeMs ? ` under ${(maxTimeMs / 1000).toFixed(1)} seconds` : ''}
        </div>
        
        <div className="round-start-actions">
          <button 
            className="round-start-cancel" 
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="round-start-confirm" 
            onClick={handleConfirm}
            autoFocus
          >
            Start Round
          </button>
        </div>
      </div>
    </Modal>
  );
}
