import './Register.css';
import { useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function Register({ onNavigate, onSuccess }) {
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstname,
            lastname,
          },
        },
      });
      if (signUpError) {
        setError(signUpError.message || 'Signup failed');
        return;
      }

      // On successful sign up, some projects require email confirmation. We'll call onSuccess anyway.
      if (data?.user) {
        onSuccess({
          email: data.user.email,
          firstName: firstname,
          lastName: lastname,
          user_metadata: data.user.user_metadata,
        });
        onNavigate('dashboard');
      } else {
        // If user not returned immediately (e.g., confirmation required), navigate to dashboard and let backend handle session.
        onSuccess({
          email,
          firstName: firstname,
          lastName: lastname,
        });
        onNavigate('dashboard');
      }
    } catch (err) {
      setError(err.message || 'Registration error');
    }
  };

  return (
    <section className="register-card" aria-label="Registration form">
      <div className="register-badge" aria-hidden="true">
        <span>📖</span>
      </div>

      <div className="register-copy">
        <h2>Phonics Learning</h2>
        <p>Create your learner account</p>
      </div>

      <form className="register-form" onSubmit={handleSubmit}>
        <label className="register-field">
          <span className="register-field-label">Firstname *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">👤</span>
            <input type="text" name="firstname" aria-label="Firstname" value={firstname} onChange={(e) => setFirstname(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Last Name *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">👤</span>
            <input type="text" name="lastname" aria-label="Last Name" value={lastname} onChange={(e) => setLastname(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Email *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">✉️</span>
            <input type="email" name="email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Password *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">🔒</span>
            <input type="password" name="password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Confirm Password *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">🔒</span>
            <input type="password" name="confirmPassword" aria-label="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </span>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="register-submit">
          SIGN UP
        </button>

        <button type="button" className="register-link" onClick={() => onNavigate('login')}>
          Already have an account? <span>Sign in</span>
        </button>
      </form>
    </section>
  );
}