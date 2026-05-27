import './ForgotPassword.css';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ForgotPassword({ onNavigate, onEmailSubmit }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) {
        setError(resetError.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      // Pass email to reset password screen
      onEmailSubmit(email);
    } catch (err) {
      setError(err.message || 'Error sending reset email');
      setLoading(false);
    }
  };

  return (
    <section className="forgotpassword-card" aria-label="Forgot password form">
      <div className="forgotpassword-badge" aria-hidden="true">
        <span>📖</span>
      </div>

      <div className="forgotpassword-copy">
        <h2>Forgot Password</h2>
        <p>Enter your email to reset your password</p>
      </div>

      <form className="forgotpassword-form" onSubmit={handleSubmit}>
        <label className="forgotpassword-field">
          <span className="forgotpassword-field-label">Email *</span>
          <span className="forgotpassword-field-box">
            <span className="forgotpassword-field-icon" aria-hidden="true">✉️</span>
            <input
              type="email"
              name="email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </span>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="forgotpassword-submit" disabled={loading}>
          {loading ? 'SENDING...' : 'CONTINUE'}
        </button>

        <button type="button" className="forgotpassword-back-link" onClick={() => onNavigate('login')}>
          ← Back to Login
        </button>
      </form>
    </section>
  );
}
