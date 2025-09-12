import { useEffect, useState } from 'react';
import Modal from './Modal';

interface AddWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (word: string) => Promise<void> | void;
  dictionaryName?: string | null;
}

export default function AddWordModal({ isOpen, onClose, onSubmit, dictionaryName }: AddWordModalProps) {
  const [word, setWord] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWord('');
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const text = word.trim();
    if (!text) return;
    try {
      setSubmitting(true);
      await onSubmit(text);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add word');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Add word${dictionaryName ? ` to “${dictionaryName}”` : ''}`}>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="word">Word</label>
          <input
            id="word"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word"
            autoFocus
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn--primary" disabled={submitting || !word.trim()}>
            {submitting ? 'Adding…' : 'Add Word'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

