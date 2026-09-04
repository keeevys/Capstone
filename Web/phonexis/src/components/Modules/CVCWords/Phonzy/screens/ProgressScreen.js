import { LEVELS, getLevelById } from '../data/words';

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function ProgressScreen({ progress, onBack }) {
  return (
    <div className="phonzy-screen phonzy-progress-screen">
      <div className="phonzy-screen-header">
        <button type="button" className="phonzy-btn phonzy-btn-ghost phonzy-back-btn" onClick={onBack}>
          ← Home
        </button>
        <h1>Progress</h1>
      </div>

      <div className="phonzy-stat-pill phonzy-total-score-pill">
        <span>⭐ Total Score (all-time)</span>
        <strong>{progress.totalScore}</strong>
      </div>

      <h2 className="phonzy-section-title">Levels</h2>
      <div className="phonzy-progress-levels">
        {LEVELS.map((level) => {
          const stats = progress.levelStats[level.id];
          const unlocked = progress.unlockedLevels.includes(level.id);
          return (
            <div key={level.id} className="phonzy-progress-level-row" style={{ '--level-color': level.color }}>
              <span className="phonzy-progress-level-icon">{unlocked ? level.icon : '🔒'}</span>
              <div className="phonzy-progress-level-info">
                <strong>{level.title}</strong>
                {stats ? (
                  <span>
                    Best {stats.bestScore} pts · {stats.bestAccuracy}% accuracy · played {stats.timesPlayed}×
                  </span>
                ) : (
                  <span>{unlocked ? 'Not played yet' : 'Locked'}</span>
                )}
              </div>
              {stats ? (
                <span className="phonzy-progress-level-stars">
                  {'★'.repeat(stats.bestStars)}
                  {'☆'.repeat(3 - stats.bestStars)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      <h2 className="phonzy-section-title">Leaderboard (this device)</h2>
      {progress.leaderboard.length === 0 ? (
        <p className="phonzy-empty-note">Play a level to see your runs here.</p>
      ) : (
        <div className="phonzy-leaderboard">
          {progress.leaderboard
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="phonzy-leaderboard-row">
                <span className="phonzy-leaderboard-rank">#{index + 1}</span>
                <span className="phonzy-leaderboard-level">
                  {getLevelById(entry.levelId).icon} {getLevelById(entry.levelId).title}
                </span>
                <span className="phonzy-leaderboard-score">{entry.score} pts</span>
                <span className="phonzy-leaderboard-accuracy">{entry.accuracy}%</span>
                <span className="phonzy-leaderboard-date">{formatDate(entry.date)}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
