import './Register.css';

export default function Register({ onNavigate, onSuccess }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSuccess();
    onNavigate('dashboard');
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
            <input type="text" name="firstname" aria-label="Firstname" />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Last Name *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">👤</span>
            <input type="text" name="lastname" aria-label="Last Name" />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Username *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">✉️</span>
            <input type="text" name="username" aria-label="Username" />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Password *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">🔒</span>
            <input type="password" name="password" aria-label="Password" />
          </span>
        </label>

        <label className="register-field">
          <span className="register-field-label">Confirm Password *</span>
          <span className="register-field-box">
            <span className="register-field-icon" aria-hidden="true">🔒</span>
            <input type="password" name="confirmPassword" aria-label="Confirm Password" />
          </span>
        </label>

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