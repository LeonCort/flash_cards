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
  const [emailSent, setEmailSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = new FormData();
      formData.set('email', email);
      await signIn('resend', formData);
      setEmailSent(true);
    } catch (error) {
      console.error('Sign-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    setLoading(false);
    onClose();
  };

  if (emailSent) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Check your email">
        <div className="modal-form">
          <div className="email-sent-content">
            <div className="email-sent-icon">📧</div>
            <h3>Sign-in link sent!</h3>
            <p>
              We've sent a sign-in link to <strong>{email}</strong>
            </p>
            <p>
              Check your email and click the link to complete your sign-in.
              You can close this window and return to the app once you've signed in.
            </p>
            <div className="email-sent-note">
              <small>
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within a few minutes.
              </small>
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn--primary" onClick={handleClose}>
              Got it
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Sign in to save your progress">
      <div className="modal-form">
        <div className="signin-benefits">
          <h4>Why create an account?</h4>
          <ul className="benefits-list">
            <li>📱 <strong>Sync across devices</strong> - Access your words and progress anywhere</li>
            <li>📊 <strong>Track your improvement</strong> - Keep your stats and high scores</li>
            <li>🔒 <strong>Never lose your data</strong> - Your dictionary is safely stored</li>
          </ul>
        </div>

        <form onSubmit={onSubmit}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
          />
          <div className="modal-actions">
            <button type="button" className="btn btn--secondary" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

