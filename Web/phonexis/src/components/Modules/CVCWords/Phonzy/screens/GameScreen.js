import { useEffect, useRef, useState } from 'react';
import { usePronunciationSession } from '../hooks/usePronunciationSession';
import MicLevelMeter from '../components/MicLevelMeter';
import { speak } from '../lib/speechEngine';

const TOTAL_HEARTS = 3;
const STREAK_BONUS_AT = 3;

export default function GameScreen({ level, onFinish, onExit, backendUserId }) {
  const words = level.words;
  const [wordIndex, setWordIndex] = useState(0);
  const [hearts, setHearts] = useState(TOTAL_HEARTS);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [attemptScores, setAttemptScores] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const session = usePronunciationSession(backendUserId);
  const processedResultRef = useRef(null);
  const finishedRef = useRef(false);

  const currentWord = words[wordIndex];
  const isLastWord = wordIndex === words.length - 1;

  // `session` is a fresh object every render; depend on the stable callback only
  // so this cleanup fires on unmount, not on every mic-level re-render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => session.releaseMicrophone(), [session.releaseMicrophone]);

  // Tally each new attempt result exactly once, keyed by attemptId (not
  // object identity) — the backend check later replaces this object in
  // place with an augmented copy of the *same* attempt, which must not
  // re-trigger a second heart/streak/score tally.
  useEffect(() => {
    const result = session.result;
    if (!result || result.attemptId === processedResultRef.current) return;
    processedResultRef.current = result.attemptId;

    setAttemptScores((prev) => [...prev, result.score]);

    if (result.passed) {
      setStreak((prevStreak) => {
        const nextStreak = prevStreak + 1;
        const bonus = nextStreak >= STREAK_BONUS_AT ? 5 : 0;
        setScore((prevScore) => prevScore + 10 + bonus);
        return nextStreak;
      });
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
      setIncorrectCount((c) => c + 1);
      setHearts((h) => Math.max(0, h - 1));
    }
  }, [session.result]);

  // Game over once hearts run out.
  useEffect(() => {
    if (hearts === 0 && session.result && !finishedRef.current) {
      finishedRef.current = true;
      const timer = setTimeout(() => {
        onFinish(buildSummary({ level, completed: false, score, correctCount, incorrectCount, attemptScores }));
      }, 1400);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hearts]);

  const handleHear = () => {
    setIsSpeaking(true);
    speak(currentWord.word, {
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const handleMicPress = () => {
    if (session.status === 'listening') {
      session.stopAttempt();
      return;
    }
    session.startAttempt(currentWord.word, level.id);
  };

  const handleTryAgain = () => {
    session.reset();
    processedResultRef.current = null;
  };

  const handleNextWord = () => {
    if (finishedRef.current) return;

    if (isLastWord) {
      finishedRef.current = true;
      onFinish(buildSummary({ level, completed: true, score, correctCount, incorrectCount, attemptScores }));
      return;
    }

    setWordIndex((i) => i + 1);
    session.reset();
    processedResultRef.current = null;
  };

  const progressPct = Math.round((wordIndex / words.length) * 100);
  const result = session.result;

  return (
    <div className="phonzy-screen phonzy-game">
      <div className="phonzy-game-topbar">
        <button type="button" className="phonzy-btn phonzy-btn-ghost phonzy-quit-btn" onClick={onExit}>
          ✕ Quit
        </button>

        <div className="phonzy-hearts" aria-label={`${hearts} lives remaining`}>
          {Array.from({ length: TOTAL_HEARTS }, (_, i) => (
            <span key={i} className={i < hearts ? 'phonzy-heart' : 'phonzy-heart lost'}>
              ❤️
            </span>
          ))}
        </div>

        <div className="phonzy-streak" aria-label={`Streak ${streak}`}>
          🔥 {streak}
        </div>
      </div>

      <div className="phonzy-progress-bar" aria-label="Level progress">
        <div className="phonzy-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <p className="phonzy-progress-label">
        Word {wordIndex + 1} of {words.length} · Score {score}
      </p>

      <div className="phonzy-word-card">
        <span className="phonzy-word-icon" aria-hidden="true">{currentWord.icon}</span>
        <h2 className="phonzy-word-text">{currentWord.word}</h2>
        <p className="phonzy-word-hint">{currentWord.hint}</p>

        <button
          type="button"
          className="phonzy-btn phonzy-btn-secondary phonzy-hear-btn"
          onClick={handleHear}
          disabled={isSpeaking}
        >
          🔊 {isSpeaking ? 'Playing…' : 'Hear It'}
        </button>
      </div>

      <div className="phonzy-mic-area">
        {session.status === 'error' ? (
          <div className="phonzy-mic-error-panel">
            <p>⚠️ {session.micError?.message || 'Microphone error.'}</p>
            <button type="button" className="phonzy-btn phonzy-btn-primary" onClick={() => session.startAttempt(currentWord.word, level.id)}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              className={`phonzy-mic-btn phonzy-mic-btn-${session.status}`}
              onClick={handleMicPress}
              disabled={session.status === 'requesting' || session.status === 'analyzing' || session.status === 'result' || hearts === 0}
              aria-label={session.status === 'listening' ? 'Stop recording' : 'Start recording'}
            >
              {micButtonIcon(session.status)}
            </button>

            <p className="phonzy-mic-status-text">{micStatusText(session.status, session.speechSupported)}</p>

            {session.status === 'listening' ? <MicLevelMeter level={session.level} /> : null}
          </>
        )}
      </div>

      {result ? (
        <div className="phonzy-feedback-overlay" role="dialog" aria-live="assertive">
          <div className={`phonzy-feedback-card phonzy-feedback-${result.band}`}>
            <div className="phonzy-feedback-score-ring" style={{ '--score-pct': `${result.score}%` }}>
              <span>{result.score}</span>
            </div>
            <h3>{result.title}</h3>
            <p>{result.message}</p>
            {result.backendCheckStatus && result.backendCheckStatus !== 'skipped' ? (
              <p className={`phonzy-backend-check phonzy-backend-check-${result.backendCheckStatus}`} aria-live="polite">
                {result.backendCheckStatus === 'pending' && '🌐 Confirming with server…'}
                {result.backendCheckStatus === 'done' && `🌐 Server check: ${result.backendCheck.score}/100 · ${result.backendCheck.title}`}
                {result.backendCheckStatus === 'unavailable' && '🌐 Server unavailable — using offline check'}
              </p>
            ) : null}

            <div className="phonzy-feedback-actions">
              {hearts === 0 ? (
                <p className="phonzy-gameover-note">💔 Out of hearts! Taking you to your results…</p>
              ) : result.passed ? (
                <button type="button" className="phonzy-btn phonzy-btn-primary" onClick={handleNextWord}>
                  {isLastWord ? 'Finish Level 🏁' : 'Next Word →'}
                </button>
              ) : (
                <button type="button" className="phonzy-btn phonzy-btn-primary" onClick={handleTryAgain}>
                  🔄 Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function micButtonIcon(status) {
  if (status === 'requesting') return '⏳';
  if (status === 'listening') return '⏹';
  if (status === 'analyzing') return '🧠';
  return '🎤';
}

function micStatusText(status, speechSupported) {
  switch (status) {
    case 'requesting':
      return 'Requesting microphone access…';
    case 'listening':
      return 'Listening… say the word now!';
    case 'analyzing':
      return 'Analyzing your pronunciation…';
    case 'result':
      return 'Attempt complete.';
    default:
      return speechSupported ? 'Tap the mic and say the word' : 'Tap the mic (voice-clarity mode)';
  }
}

function buildSummary({ level, completed, score, correctCount, incorrectCount, attemptScores }) {
  const totalAttempts = attemptScores.length;
  const avgPronunciationScore = totalAttempts
    ? Math.round(attemptScores.reduce((a, b) => a + b, 0) / totalAttempts)
    : 0;
  const totalWords = level.words.length;
  const accuracy = totalAttempts ? Math.round((correctCount / totalAttempts) * 100) : 0;

  return {
    levelId: level.id,
    levelTitle: level.title,
    completed,
    score,
    correctCount,
    incorrectCount,
    totalWords,
    accuracy,
    avgPronunciationScore,
  };
}
