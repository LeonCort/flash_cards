import { useState, useEffect } from 'react';
import Modal from './Modal';
import './RoundStartModal.css';

export type WordSource = 'all' | 'non-cleared' | 'difficult' | 'custom';

interface RoundStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (settings: { repsPerWord: number; maxTimeMs?: number; wordSource: WordSource }) => void;
  wordCounts: {
    all: number;
    nonCleared: number;
    difficult: number;
    custom: number;
  };
  getWordsBySource: (source: WordSource) => any[];
  hasSelectedWords: boolean;
  currentFilter: 'all' | 'non-cleared' | 'not-tested' | 'difficult';
}

export default function RoundStartModal({
  isOpen,
  onClose,
  onConfirm,
  wordCounts,
  getWordsBySource,
  hasSelectedWords,
  currentFilter
}: RoundStartModalProps) {
  // Smart initial word source logic
  const getInitialWordSource = (): WordSource => {
    if (hasSelectedWords) {
      return 'custom';
    }

    // Map filter to word source
    switch (currentFilter) {
      case 'non-cleared': return 'non-cleared';
      case 'difficult': return 'difficult';
      case 'not-tested': return 'all'; // not-tested doesn't have a direct mapping, use all
      default: return 'all';
    }
  };

  const [repsPerWord, setRepsPerWord] = useState(3);
  const [maxTimeMs, setMaxTimeMs] = useState('3');
  const [wordSource, setWordSource] = useState<WordSource>(getInitialWordSource());
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Update word source when modal opens or selection changes
  useEffect(() => {
    if (isOpen) {
      setWordSource(getInitialWordSource());
    }
  }, [isOpen, hasSelectedWords, currentFilter]);

  const getCurrentWordCount = () => {
    switch (wordSource) {
      case 'all': return wordCounts.all;
      case 'non-cleared': return wordCounts.nonCleared;
      case 'difficult': return wordCounts.difficult;
      case 'custom': return wordCounts.custom;
      default: return 0;
    }
  };

  const getCurrentWords = () => {
    return getWordsBySource(wordSource);
  };

  const handleConfirm = () => {
    const maxMs = maxTimeMs.trim() ? Number(maxTimeMs) * 1000 : undefined;
    onConfirm({ repsPerWord, maxTimeMs: maxMs, wordSource });
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
        
        <h2 className="round-start-title">Practice</h2>

        <p className="round-start-description">
          Ready to begin your practice session? Here's what you'll be working on:
        </p>

        <div className="round-start-stats">
          <div className="stat-item">
            <div className="stat-label">Words to practice ({getCurrentWordCount()})</div>
            <div className="word-list">
              {getCurrentWords().map((word) => (
                <span key={word._id} className="word-chip">
                  {word.text}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="round-settings">
          <div className="settings-header" onClick={() => setSettingsExpanded(!settingsExpanded)}>
            <span className="settings-title">Settings</span>
            <span className={`settings-toggle ${settingsExpanded ? 'expanded' : ''}`}>
              ▼
            </span>
          </div>

          {settingsExpanded && (
            <div className="settings-content">
              <div className="setting-group">
                <label htmlFor="wordSource" className="setting-label">
                  Words
                </label>
                <select
                  id="wordSource"
                  value={wordSource}
                  onChange={(e) => setWordSource(e.target.value as WordSource)}
                  className="setting-input"
                >
                  <option value="all">All ({wordCounts.all})</option>
                  <option value="non-cleared">Non-cleared ({wordCounts.nonCleared})</option>
                  <option value="difficult">Difficult ({wordCounts.difficult})</option>
                  <option value="custom" disabled={wordCounts.custom === 0}>
                    Custom ({wordCounts.custom})
                  </option>
                </select>
              </div>

              <div className="setting-group">
                <label htmlFor="repsPerWord" className="setting-label">
                  Correct attempts per word
                </label>
                <select
                  id="repsPerWord"
                  value={repsPerWord}
                  onChange={(e) => setRepsPerWord(Number(e.target.value))}
                  className="setting-input"
                >
                  <option value={1}>1 attempt</option>
                  <option value={2}>2 attempts</option>
                  <option value={3}>3 attempts</option>
                  <option value={4}>4 attempts</option>
                  <option value={5}>5 attempts</option>
                </select>
              </div>

              <div className="setting-group">
                <label htmlFor="maxTime" className="setting-label">
                  Time challenge (optional)
                </label>
                <div className="time-input-group">
                  <input
                    id="maxTime"
                    type="number"
                    value={maxTimeMs}
                    onChange={(e) => setMaxTimeMs(e.target.value)}
                    placeholder="No limit"
                    className="setting-input time-input"
                    min="0.1"
                    step="0.1"
                  />
                  <span className="time-unit">seconds</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="round-start-goal">
          <strong>Goal:</strong> Complete {repsPerWord} correct {repsPerWord === 1 ? 'attempt' : 'attempts'}
          per word{maxTimeMs ? ` under ${maxTimeMs} seconds` : ''}
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
            disabled={getCurrentWordCount() === 0}
          >
            Start Practice
          </button>
        </div>
      </div>
    </Modal>
  );
}
