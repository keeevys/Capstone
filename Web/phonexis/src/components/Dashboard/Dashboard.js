import './Dashboard.css';

const moduleCards = [
  {
    key: 'alphabet',
    icon: '📘',
    title: 'Alphabet Recognition',
    description: 'Learn letters and sounds with fun tracing activities',
    accent: 'blue',
    progress: 0,
  },
  {
    key: 'vowels',
    icon: '🔉',
    title: 'Vowels & Consonants',
    description: 'Discover vowels and consonants with audio guides',
    accent: 'purple',
    progress: 0,
  },
  {
    key: 'cvc',
    icon: '💡',
    title: 'CVC Words',
    description: 'Build simple words and practice phonics',
    accent: 'pink',
    progress: 9,
  },
];

export default function Dashboard({ onNavigate, onSelectModule, onLogout }) {
  const openGame = (moduleKey) => {
    onSelectModule(moduleKey);
    onNavigate(moduleKey);
  };

  const overallProgress = 3;

  return (
    <section className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-user">
          <div className="dashboard-avatar" aria-hidden="true">
            <span>🎓</span>
          </div>
          <div>
            <h2>Welcome, can dog!</h2>
            <p>Let&apos;s learn together</p>
          </div>
        </div>

        <button type="button" className="dashboard-logout" onClick={onLogout}>
          ↪ LOGOUT
        </button>
      </header>

      <section className="dashboard-progress-card" aria-label="Overall progress">
        <div className="dashboard-progress-head">
          <span className="dashboard-progress-icon" aria-hidden="true">
            🏅
          </span>
          <h3>Overall Progress</h3>
        </div>

        <div className="dashboard-progress-meter">
          <div className="dashboard-progress-track">
            <div className="dashboard-progress-fill" style={{ width: `${overallProgress}%` }} />
          </div>
          <strong>{overallProgress}%</strong>
        </div>
      </section>

      <section className="dashboard-cards" aria-label="Game modules">
        {moduleCards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`dashboard-card dashboard-card-${card.accent}`}
            onClick={() => openGame(card.key)}
          >
            <div className="dashboard-card-icon" aria-hidden="true">
              <span>{card.icon}</span>
            </div>

            <div className="dashboard-card-copy">
              <h3>{card.title}</h3>
              <p>{card.description}</p>

              <div className="dashboard-card-progress">
                <span>Progress</span>
                <strong>{card.progress}%</strong>
              </div>

              <div className="dashboard-card-button">START LEARNING ✨</div>
            </div>
          </button>
        ))}
      </section>
    </section>
  );
}