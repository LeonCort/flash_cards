import { useState } from 'react';
import Modal from './Modal';
import './Modal.css';
import { useAuthActions } from '@convex-dev/auth/react';

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.set('email', email);
      await signIn('resend', formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign in">
      <form onSubmit={onSubmit} className="modal-form">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <div className="modal-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading || !email}>
            {loading ? 'Sending…' : 'Send sign-in link'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

