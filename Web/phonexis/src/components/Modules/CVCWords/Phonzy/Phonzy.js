import { useMemo, useState } from 'react';
import './Phonzy.css';
import HomeScreen from './screens/HomeScreen';
import LevelSelectScreen from './screens/LevelSelectScreen';
import GameScreen from './screens/GameScreen';
import ResultsScreen, { computeStars } from './screens/ResultsScreen';
import ProgressScreen from './screens/ProgressScreen';
import { LEVELS, getLevelById, getLevelIndex } from './data/words';
import { loadProgress, recordLevelResult } from './lib/progressStore';

/**
 * Phonzy: a CVC pronunciation game.
 * Screen flow: home -> levels -> game -> results -> (levels | game | home)
 */
export default function Phonzy({ onBack, backLabel = '← Back to Modules', backendUserId = null }) {
  const [screen, setScreen] = useState('home');
  const [activeLevelId, setActiveLevelId] = useState(LEVELS[0].id);
  const [lastSummary, setLastSummary] = useState(null);
  const [progress, setProgress] = useState(() => loadProgress());
  const [gameSessionId, setGameSessionId] = useState(0);

  const activeLevel = useMemo(() => getLevelById(activeLevelId), [activeLevelId]);

  const goHome = () => setScreen('home');
  const goLevels = () => setScreen('levels');

  const handleSelectLevel = (levelId) => {
    setActiveLevelId(levelId);
    setGameSessionId((id) => id + 1);
    setScreen('game');
  };

  const handleFinishLevel = (summary) => {
    const stars = computeStars(summary.accuracy, summary.completed);
    const nextProgress = recordLevelResult(progress, {
      levelId: summary.levelId,
      score: summary.score,
      accuracy: summary.accuracy,
      stars,
      completed: summary.completed,
      avgPronunciationScore: summary.avgPronunciationScore,
    });
    setProgress(nextProgress);
    setLastSummary(summary);
    setScreen('results');
  };

  const handleRetryLevel = () => {
    setGameSessionId((id) => id + 1);
    setScreen('game');
  };

  const handleNextLevel = () => {
    const currentIndex = getLevelIndex(activeLevelId);
    const nextLevel = LEVELS[currentIndex + 1];
    if (nextLevel) {
      setActiveLevelId(nextLevel.id);
    }
    setGameSessionId((id) => id + 1);
    setScreen(nextLevel ? 'game' : 'levels');
  };

  return (
    <div className="module-detail phonzy-detail">
      {typeof onBack === 'function' ? (
        <div className="phonzy-exit-bar">
          <button type="button" className="cvc-back" onClick={onBack}>
            {backLabel}
          </button>
        </div>
      ) : null}

      {screen === 'home' ? (
        <HomeScreen onPlay={goLevels} onViewProgress={() => setScreen('progress')} totalScore={progress.totalScore} />
      ) : null}

      {screen === 'levels' ? (
        <LevelSelectScreen progress={progress} onSelectLevel={handleSelectLevel} onBack={goHome} />
      ) : null}

      {screen === 'game' ? (
        <GameScreen
          key={`${activeLevel.id}-${gameSessionId}`}
          level={activeLevel}
          onFinish={handleFinishLevel}
          onExit={goLevels}
          backendUserId={backendUserId}
        />
      ) : null}

      {screen === 'results' && lastSummary ? (
        <ResultsScreen
          summary={lastSummary}
          hasNextLevel={getLevelIndex(activeLevelId) < LEVELS.length - 1}
          onRetryLevel={handleRetryLevel}
          onNextLevel={handleNextLevel}
          onLevelSelect={goLevels}
          onHome={goHome}
        />
      ) : null}

      {screen === 'progress' ? <ProgressScreen progress={progress} onBack={goHome} /> : null}
    </div>
  );
}
