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
    title: 'Vowels',
    description: 'Discover vowel sounds with audio guides',
    accent: 'purple',
    progress: 0,
  },
  {
    key: 'consonants',
    icon: '🔊',
    title: 'Consonants',
    description: 'Explore consonant sounds visually',
    accent: 'green',
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

export default function Dashboard({ onNavigate, onSelectModule, onLogout, user, overallProgress = 0, vowelsUnlocked = false, consonantsUnlocked = false, cvcUnlocked = false }) {
  const openGame = (moduleKey) => {
    if (moduleKey === 'vowels' && !vowelsUnlocked) {
      return;
    }

    if (moduleKey === 'consonants' && !consonantsUnlocked) {
      return;
    }

    if (moduleKey === 'cvc' && !cvcUnlocked) {
      return;
    }

    onSelectModule(moduleKey);
    onNavigate(moduleKey);
  };

  const firstName = user?.firstName || user?.firstname || user?.user_metadata?.firstname || user?.user_metadata?.firstName || '';
  const lastName = user?.lastName || user?.lastname || user?.user_metadata?.lastname || user?.user_metadata?.lastName || '';
  const emailName = user?.email ? user.email.split('@')[0] : '';
  const displayName = `${firstName} ${lastName}`.trim() || emailName || 'Learner';

  return (
    <section className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="dashboard-user">
          <div className="dashboard-avatar" aria-hidden="true">
            <span>🎓</span>
          </div>
          <div>
            <h2>Welcome, {displayName}!</h2>
            <p>Let&apos;s learn together</p>
          </div>
        </div>

        <div className="dashboard-topbar-actions">
          <button type="button" className="dashboard-profile" onClick={() => onNavigate('profile')}>
            👤 PROFILE
          </button>
          <button type="button" className="dashboard-logout" onClick={onLogout}>
            ↪ LOGOUT
          </button>
        </div>
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
        {moduleCards.map((card) => {
          const isLocked = (card.key === 'vowels' && !vowelsUnlocked) || (card.key === 'consonants' && !consonantsUnlocked) || (card.key === 'cvc' && !cvcUnlocked);
          return (
            <button
              key={card.key}
              type="button"
              className={`dashboard-card dashboard-card-${card.accent}${isLocked ? ' locked' : ''}`}
              onClick={() => openGame(card.key)}
              disabled={isLocked}
            >
              <div className="dashboard-card-icon" aria-hidden="true">
                <span>{card.icon}</span>
              </div>

              <div className="dashboard-card-copy">
                <h3>{card.title}</h3>
                <p>{card.description}</p>

                <div className="dashboard-card-progress">
                  <span>Progress</span>
                  <strong>{isLocked ? 'Locked' : `${card.progress}%`}</strong>
                </div>

              <div className="dashboard-card-button">
                {isLocked ? 'Locked' : 'START LEARNING ✨'}
              </div>
            </div>
            </button>
          );
        })}
      </section>
    </section>
  );
}