import { LEVELS } from '../data/words';
import { isLevelUnlocked } from '../lib/progressStore';

export default function LevelSelectScreen({ progress, onSelectLevel, onBack }) {
  return (
    <div className="phonzy-screen phonzy-level-select">
      <div className="phonzy-screen-header">
        <button type="button" className="phonzy-btn phonzy-btn-ghost phonzy-back-btn" onClick={onBack}>
          ← Home
        </button>
        <h1>Choose a Level</h1>
      </div>

      <div className="phonzy-level-grid">
        {LEVELS.map((level) => {
          const unlocked = isLevelUnlocked(progress, level.id);
          const stats = progress.levelStats[level.id];

          return (
            <button
              key={level.id}
              type="button"
              className={`phonzy-level-card${unlocked ? '' : ' locked'}`}
              style={{ '--level-color': level.color }}
              onClick={() => unlocked && onSelectLevel(level.id)}
              disabled={!unlocked}
            >
              <span className="phonzy-level-icon" aria-hidden="true">
                {unlocked ? level.icon : '🔒'}
              </span>
              <h3>{level.title}</h3>
              <p>{level.subtitle}</p>
              <span className="phonzy-level-count">{level.words.length} words</span>

              {stats ? (
                <div className="phonzy-level-best">
                  <span>Best: {stats.bestScore} pts</span>
                  <span>{'★'.repeat(stats.bestStars)}{'☆'.repeat(3 - stats.bestStars)}</span>
                </div>
              ) : (
                <div className="phonzy-level-best phonzy-level-best-empty">
                  {unlocked ? 'Not played yet' : 'Finish the previous level to unlock'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
