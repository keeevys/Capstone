function computeStars(accuracy, completed) {
  if (!completed) return 0;
  if (accuracy >= 90) return 3;
  if (accuracy >= 70) return 2;
  return 1;
}

export default function ResultsScreen({ summary, hasNextLevel, onRetryLevel, onNextLevel, onLevelSelect, onHome }) {
  const stars = computeStars(summary.accuracy, summary.completed);

  return (
    <div className="phonzy-screen phonzy-results">
      <div className="phonzy-results-banner" aria-hidden="true">
        {summary.completed ? '🏆' : '💔'}
      </div>
      <h1>{summary.completed ? 'Level Complete!' : 'Game Over'}</h1>
      <p className="phonzy-results-level">{summary.levelTitle} Level</p>

      <div className="phonzy-stars" aria-label={`${stars} out of 3 stars`}>
        {Array.from({ length: 3 }, (_, i) => (
          <span key={i} className={i < stars ? 'phonzy-star filled' : 'phonzy-star'}>
            ★
          </span>
        ))}
      </div>

      <div className="phonzy-results-grid">
        <div className="phonzy-results-stat">
          <span>Score</span>
          <strong>{summary.score}</strong>
        </div>
        <div className="phonzy-results-stat">
          <span>Accuracy</span>
          <strong>{summary.accuracy}%</strong>
        </div>
        <div className="phonzy-results-stat">
          <span>Correct</span>
          <strong>{summary.correctCount} ✅</strong>
        </div>
        <div className="phonzy-results-stat">
          <span>Incorrect</span>
          <strong>{summary.incorrectCount} ❌</strong>
        </div>
        <div className="phonzy-results-stat phonzy-results-stat-wide">
          <span>Average Pronunciation Score</span>
          <strong>{summary.avgPronunciationScore} / 100</strong>
        </div>
      </div>

      <div className="phonzy-results-actions">
        <button type="button" className="phonzy-btn phonzy-btn-secondary" onClick={onRetryLevel}>
          🔄 Retry Level
        </button>
        {summary.completed && hasNextLevel ? (
          <button type="button" className="phonzy-btn phonzy-btn-primary" onClick={onNextLevel}>
            Next Level →
          </button>
        ) : null}
        <button type="button" className="phonzy-btn phonzy-btn-ghost" onClick={onLevelSelect}>
          Level Select
        </button>
        <button type="button" className="phonzy-btn phonzy-btn-ghost" onClick={onHome}>
          Home
        </button>
      </div>
    </div>
  );
}

export { computeStars };
