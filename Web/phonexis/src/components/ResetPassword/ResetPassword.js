import './ResetPassword.css';
import { useState } from 'react';
import { supabase, syncSupabasePasswordToBackend } from '../../lib/supabaseClient';

export default function ResetPassword({ onNavigate, email }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ email, password: newPassword });
      if (updateError) {
        setError(updateError.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      void syncSupabasePasswordToBackend(email, null, newPassword);

      setSuccess(true);
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Error resetting password');
      setLoading(false);
    }
  };

  return (
    <section className="resetpassword-card" aria-label="Reset password form">
      <div className="resetpassword-badge" aria-hidden="true">
        <span>📖</span>
      </div>

      <div className="resetpassword-copy">
        <h2>Reset Password</h2>
        <p>Create a new password for your account</p>
      </div>

      <div className="resetpassword-info-box">
        <span className="resetpassword-info-icon" aria-hidden="true">ℹ️</span>
        <div>
          <p className="resetpassword-info-label">Resetting password for:</p>
          <p className="resetpassword-info-email">{email || 'your account'}</p>
        </div>
      </div>

      {success ? (
        <div className="resetpassword-success">
          <p>✓ Password reset successfully! Redirecting to login...</p>
        </div>
      ) : (
        <form className="resetpassword-form" onSubmit={handleSubmit}>
          <label className="resetpassword-field">
            <span className="resetpassword-field-label">New Password *</span>
            <span className="resetpassword-field-box">
              <span className="resetpassword-field-icon" aria-hidden="true">🔒</span>
              <input
                type="password"
                name="newPassword"
                aria-label="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </span>
          </label>

          <label className="resetpassword-field">
            <span className="resetpassword-field-label">Confirm New Password *</span>
            <span className="resetpassword-field-box">
              <span className="resetpassword-field-icon" aria-hidden="true">🔒</span>
              <input
                type="password"
                name="confirmPassword"
                aria-label="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </span>
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <button type="submit" className="resetpassword-submit" disabled={loading}>
            {loading ? 'RESETTING...' : 'RESET PASSWORD'}
          </button>

          <button type="button" className="resetpassword-back-link" onClick={() => onNavigate('login')}>
            ← Back to Login
          </button>
        </form>
      )}
    </section>
  );
}
