import './Login.css';

export default function Login({ onNavigate, onSuccess }) {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSuccess();
    onNavigate('dashboard');
  };

  return (
    <section className="login-card" aria-label="Login form">
      <div className="login-badge" aria-hidden="true">
        <span>📖</span>
      </div>

      <div className="login-copy">
        <h2>Phonics Learning</h2>
        <p>Welcome back! Let's continue learning</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <label className="login-field">
          <span className="login-field-label">Email *</span>
          <span className="login-field-box">
            <span className="login-field-icon" aria-hidden="true">✉️</span>
            <input type="email" name="email" aria-label="Email" />
          </span>
        </label>

        <label className="login-field">
          <span className="login-field-label">Password *</span>
          <span className="login-field-box">
            <span className="login-field-icon" aria-hidden="true">🔒</span>
            <input type="password" name="password" aria-label="Password" />
          </span>
        </label>

        <button type="submit" className="login-submit">
          SIGN IN
        </button>

        <button type="button" className="login-link" onClick={() => onNavigate('register')}>
          Don't have an account? <span>Register here</span>
        </button>
      </form>
    </section>
  );
}