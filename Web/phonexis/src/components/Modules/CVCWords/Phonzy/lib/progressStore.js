import { LEVELS } from '../data/words';

const STORAGE_KEY = 'phonexis_phonzy_progress';
const MAX_LEADERBOARD_ENTRIES = 20;

function defaultProgress() {
  return {
    unlockedLevels: [LEVELS[0].id],
    levelStats: {},
    leaderboard: [],
    totalScore: 0,
  };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return {
      ...defaultProgress(),
      ...parsed,
      unlockedLevels: Array.isArray(parsed.unlockedLevels) && parsed.unlockedLevels.length
        ? parsed.unlockedLevels
        : [LEVELS[0].id],
    };
  } catch {
    return defaultProgress();
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // localStorage unavailable (private mode, quota) — progress just won't persist.
  }
}

export function isLevelUnlocked(progress, levelId) {
  return progress.unlockedLevels.includes(levelId);
}

/**
 * Records the outcome of a finished level attempt, updates best stats,
 * unlocks the next level on success, and appends a leaderboard entry.
 */
export function recordLevelResult(progress, { levelId, score, accuracy, stars, completed, avgPronunciationScore }) {
  const next = {
    ...progress,
    unlockedLevels: [...progress.unlockedLevels],
    levelStats: { ...progress.levelStats },
    leaderboard: [...progress.leaderboard],
    totalScore: progress.totalScore + score,
  };

  const existingBest = next.levelStats[levelId];
  const isNewBest = !existingBest || score > existingBest.bestScore;

  next.levelStats[levelId] = {
    bestScore: isNewBest ? score : existingBest.bestScore,
    bestAccuracy: isNewBest ? accuracy : existingBest.bestAccuracy,
    bestStars: isNewBest ? stars : existingBest.bestStars,
    timesPlayed: (existingBest?.timesPlayed || 0) + 1,
    lastPlayedAt: new Date().toISOString(),
  };

  if (completed) {
    const levelIndex = LEVELS.findIndex((level) => level.id === levelId);
    const nextLevel = LEVELS[levelIndex + 1];
    if (nextLevel && !next.unlockedLevels.includes(nextLevel.id)) {
      next.unlockedLevels.push(nextLevel.id);
    }
  }

  next.leaderboard.unshift({
    levelId,
    score,
    accuracy,
    stars,
    avgPronunciationScore,
    completed,
    date: new Date().toISOString(),
  });
  next.leaderboard = next.leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);

  saveProgress(next);
  return next;
}

export function resetProgress() {
  const fresh = defaultProgress();
  saveProgress(fresh);
  return fresh;
}
