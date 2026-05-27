import './Profile.css';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Profile({ onNavigate, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('info');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const firstName = user?.firstName || user?.firstname || user?.user_metadata?.firstname || user?.user_metadata?.firstName || '';
  const lastName = user?.lastName || user?.lastname || user?.user_metadata?.lastname || user?.user_metadata?.lastName || '';
  const displayName = `${firstName} ${lastName}`.trim() || user?.email?.split('@')[0] || 'Learner';
  const email = user?.email || '';
  const role = user?.role || user?.user_metadata?.role || 'student';

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // First verify current password by attempting to sign in
      const { error: verifyError } = await supabase.auth.signInWithPassword({ 
        email, 
        password: currentPassword 
      });

      if (verifyError) {
        setError('Current password is incorrect');
        setLoading(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError(updateError.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      setSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="profile-shell">
      <button type="button" className="profile-back" onClick={() => onNavigate('dashboard')}>
        ← BACK TO DASHBOARD
      </button>

      <div className="profile-header">
        <div className="profile-header-content">
          <div className="profile-header-avatar" aria-hidden="true">
            <span>👤</span>
          </div>
          <div>
            <h2>{displayName}</h2>
            <p>{role.charAt(0).toUpperCase() + role.slice(1)} Profile</p>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          type="button" 
          className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          PROFILE INFO
        </button>
        <button 
          type="button" 
          className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          SETTINGS
        </button>
      </div>

      {activeTab === 'info' && (
        <div className="profile-info-tab">
          <div className="profile-info-field">
            <div className="profile-info-icon" aria-hidden="true">👤</div>
            <div>
              <p className="profile-info-label">Username</p>
              <p className="profile-info-value">{displayName}</p>
            </div>
          </div>

          <div className="profile-info-field">
            <div className="profile-info-icon" aria-hidden="true">📧</div>
            <div>
              <p className="profile-info-label">Email Address</p>
              <p className="profile-info-value">{email}</p>
            </div>
          </div>

          <div className="profile-info-field">
            <div className="profile-info-icon" aria-hidden="true">🛡️</div>
            <div>
              <p className="profile-info-label">Role</p>
              <p className="profile-info-value">{role.charAt(0).toUpperCase() + role.slice(1)}</p>
            </div>
          </div>

          <div className="profile-learning-progress">
            <h3>Learning Progress</h3>
            <div className="profile-progress-item">
              <span>Alphabet Recognition</span>
              <span className="profile-progress-percentage">0%</span>
            </div>
            <div className="profile-progress-item">
              <span>Vowels & Consonants</span>
              <span className="profile-progress-percentage">0%</span>
            </div>
            <div className="profile-progress-item">
              <span>CVC Words</span>
              <span className="profile-progress-percentage">0%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="profile-settings-tab">
          <div className="profile-settings-section">
            <div className="profile-settings-header">
              <span className="profile-settings-icon" aria-hidden="true">⚙️</span>
              <div>
                <h3>Change Password</h3>
                <p>Update your password to keep your account secure</p>
              </div>
            </div>

            <form className="profile-password-form" onSubmit={handleChangePassword}>
              <label className="profile-form-field">
                <span className="profile-form-label">Current Password *</span>
                <div className="profile-form-box">
                  <span className="profile-form-icon" aria-hidden="true">🔒</span>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="profile-form-field">
                <span className="profile-form-label">New Password *</span>
                <span className="profile-form-hint">Must be at least 8 characters</span>
                <div className="profile-form-box">
                  <span className="profile-form-icon" aria-hidden="true">🔒</span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              <label className="profile-form-field">
                <span className="profile-form-label">Confirm New Password *</span>
                <div className="profile-form-box">
                  <span className="profile-form-icon" aria-hidden="true">🔒</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </label>

              {error && <p className="profile-form-error">{error}</p>}
              {success && <p className="profile-form-success">✓ {success}</p>}

              <button type="submit" className="profile-update-btn" disabled={loading}>
                {loading ? 'UPDATING...' : '✓ UPDATE PASSWORD'}
              </button>
            </form>
          </div>

          <div className="profile-sign-out-section">
            <p>Need help with your account?</p>
            <button type="button" className="profile-sign-out-btn" onClick={onLogout}>
              SIGN OUT
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
