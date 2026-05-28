import React, { useState, useCallback, useEffect } from 'react';
import './AlphaQuest.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const DIFFICULTY_MODES = {
  beginner: {
    rounds: 3,
    maxHealth: 4,
    emojis: ['👾', '🐙', '🦞', '🐟', '🥶', '🐡', '🐊'],
    name: 'Beginner',
  },
  intermediate: {
    rounds: 4,
    maxHealth: 4,
    emojis: ['🐒', '🦍', '🦁', '🐯', '🐉', '🦕', '🦈'],
    name: 'Intermediate',
  },
  endless: {
    rounds: Infinity,
    maxHealth: 4,
    emojis: ['😈', '👹', '😤', '🤡', '👺', '👻'],
    name: 'Endless',
  },
};

export default function AlphaQuest({ onClose }) {
  const [gameState, setGameState] = useState('menu'); // menu, playing, gameOver, victory
  const [difficulty, setDifficulty] = useState(null);
  const [round, setRound] = useState(1);
  const [currentLetter, setCurrentLetter] = useState(null);
  const [currentBoss, setCurrentBoss] = useState(null);
  const [playerHealth, setPlayerHealth] = useState(null);
  const [maxPlayerHealth, setMaxPlayerHealth] = useState(null);
  const [bossHealth, setBossHealth] = useState(null);
  const [maxBossHealth, setMaxBossHealth] = useState(null);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [totalRounds, setTotalRounds] = useState(null);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [score, setScore] = useState(0);

  // Get random emoji for boss
  const getRandomBossEmoji = useCallback((emojis) => {
    return emojis[Math.floor(Math.random() * emojis.length)];
  }, []);

  // Get random letter
  const getRandomLetter = useCallback(() => {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }, []);

  // Speak the letter pronunciation
  const speakLetter = useCallback((letter) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(letter);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Get player emoji based on health
  const getPlayerEmoji = useCallback(() => {
    if (playerHealth === null) return '🤓';
    if (playerHealth === maxPlayerHealth) return '🤓';
    if (playerHealth === maxPlayerHealth - 1) return '😐';
    if (playerHealth === 1) return '🤕';
    if (playerHealth <= 0) return '😵';
    return '🤓';
  }, [playerHealth, maxPlayerHealth]);

  // Initialize game
  const startGame = (selectedDifficulty) => {
    const mode = DIFFICULTY_MODES[selectedDifficulty];
    setDifficulty(selectedDifficulty);
    setGameState('playing');
    setRound(1);
    setTotalRounds(mode.rounds);
    setPlayerHealth(mode.maxHealth);
    setMaxPlayerHealth(mode.maxHealth);
    setBossHealth(mode.maxHealth);
    setMaxBossHealth(mode.maxHealth);
    setStreak(0);
    setScore(0);
    setFeedback('Listen to the letter pronunciation and type the correct letter!');

    const letter = getRandomLetter();
    const boss = getRandomBossEmoji(mode.emojis);
    setCurrentLetter(letter);
    setCurrentBoss(boss);

    // Speak the letter
    setTimeout(() => {
      speakLetter(letter);
    }, 500);
  };

  // Handle keyboard input
  const handleLetterPress = useCallback(
    (letter) => {
      if (gameState !== 'playing' || !currentLetter || !currentBoss) return;

      const upperLetter = letter.toUpperCase();

      if (upperLetter === currentLetter) {
        // Correct answer
        const newBossHealth = bossHealth - 1;
        const newStreak = streak + 1;

        if (newBossHealth <= 0) {
          // Boss defeated, move to next round
          const newScore = score + 10 + streak;
          setScore(newScore);

          if (newStreak % 3 === 0 && (difficulty === 'intermediate' || difficulty === 'endless')) {
            // Bonus heart for 3-streak
            const bonusHealth = Math.min(playerHealth + 1, maxPlayerHealth);
            setPlayerHealth(bonusHealth);
            setFeedback(`✓ Correct! Boss defeated! Bonus +1 ❤️ from streak!`);
          } else {
            setFeedback(`✓ Correct! Boss defeated!`);
          }

          setStreak(0);

          // Check if all rounds completed
          if (round >= totalRounds) {
            setTimeout(() => {
              setGameState('victory');
              setGameOverMessage(
                `🎉 Victory! You defeated all ${totalRounds} bosses!\nFinal Score: ${newScore}`
              );
            }, 1500);
            return;
          }

          // Next round
          setTimeout(() => {
            setRound(round + 1);
            setBossHealth(DIFFICULTY_MODES[difficulty].maxHealth);
            const newLetter = getRandomLetter();
            const newBoss = getRandomBossEmoji(DIFFICULTY_MODES[difficulty].emojis);
            setCurrentLetter(newLetter);
            setCurrentBoss(newBoss);
            setFeedback('Next boss incoming! Listen to the letter!');
            speakLetter(newLetter);
          }, 1500);
        } else {
          // Boss still alive
          setBossHealth(newBossHealth);
          setStreak(newStreak);
          setFeedback(`✓ Correct! Boss took damage!`);
          const newLetter = getRandomLetter();
          setCurrentLetter(newLetter);
          speakLetter(newLetter);
        }
      } else {
        // Wrong answer - player takes damage
        const newPlayerHealth = playerHealth - 1;
        setPlayerHealth(newPlayerHealth);
        setStreak(0);

        if (newPlayerHealth <= 0) {
          // Game over
          setGameState('gameOver');
          setGameOverMessage('You Died');
        } else {
          setFeedback(`✗ Wrong! You took damage!`);
          const newLetter = getRandomLetter();
          setCurrentLetter(newLetter);
        }
      }
    },
    [gameState, currentLetter, currentBoss, bossHealth, playerHealth, streak, difficulty, round, totalRounds, score, maxPlayerHealth, getRandomBossEmoji, getRandomLetter, speakLetter]
  );

  // Listen for keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState === 'playing') {
        const letter = e.key.toUpperCase();
        if (ALPHABET.includes(letter)) {
          e.preventDefault();
          handleLetterPress(letter);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, handleLetterPress]);

  return (
    <div className="alpha-quest-container">
      {gameState === 'menu' && (
        <div className="alpha-quest-menu">
          <div className="alpha-quest-title">
            <span className="alpha-quest-icon">⚔️</span>
            <h1>AlphaQuest</h1>
            <span className="alpha-quest-icon">🎮</span>
          </div>
          <p className="alpha-quest-subtitle">Listen to the pronunciation and type the correct letter!</p>

          <div className="alpha-quest-difficulty-buttons">
            <button
              className="alpha-quest-difficulty-btn beginner-btn"
              onClick={() => startGame('beginner')}
            >
              <div className="difficulty-icon">🟢</div>
              <div className="difficulty-name">Beginner</div>
              <div className="difficulty-desc">3 Rounds | 4 ❤️</div>
            </button>
            <button
              className="alpha-quest-difficulty-btn intermediate-btn"
              onClick={() => startGame('intermediate')}
            >
              <div className="difficulty-icon">🟡</div>
              <div className="difficulty-name">Intermediate</div>
              <div className="difficulty-desc">4 Rounds | 4 ❤️</div>
            </button>
            <button
              className="alpha-quest-difficulty-btn endless-btn"
              onClick={() => startGame('endless')}
            >
              <div className="difficulty-icon">🔴</div>
              <div className="difficulty-name">Endless</div>
              <div className="difficulty-desc">∞ Rounds | 4 ❤️</div>
            </button>
          </div>

          <button className="alpha-quest-close-btn" onClick={onClose}>
            ← Back to Alphabet
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="alpha-quest-game">
          <div className="alpha-quest-header">
            <div className="game-info">
              <p className="game-round">Round {round} / {totalRounds === Infinity ? '∞' : totalRounds}</p>
              <p className="game-difficulty">{DIFFICULTY_MODES[difficulty].name}</p>
            </div>
            <div className="game-score">Score: {score}</div>
            <button className="alpha-quest-quit-btn" onClick={onClose}>
              ← Quit
            </button>
          </div>

          <div className="alpha-quest-battle">
            {/* Player Side */}
            <div className="alpha-quest-player-side">
              <div className="player-emoji">{getPlayerEmoji()}</div>
              <div className="player-health">
                {Array.from({ length: maxPlayerHealth }).map((_, i) => (
                  <span key={i} className={`heart ${i < playerHealth ? 'full' : 'empty'}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>

            {/* Boss Side */}
            <div className="alpha-quest-boss-side">
              <div className="boss-display">
                <div className="boss-emoji">{currentBoss}</div>
              </div>
              <div className="boss-health">
                {Array.from({ length: maxBossHealth }).map((_, i) => (
                  <span key={i} className={`heart ${i < bossHealth ? 'full' : 'empty'}`}>
                    ❤️
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="alpha-quest-feedback">{feedback}</div>

          <div className="alpha-quest-controls">
            <button
              type="button"
              className="alpha-quest-listen-btn"
              onClick={() => currentLetter && speakLetter(currentLetter)}
            >
              🔊 Listen Again
            </button>
          </div>

          <div className="alpha-quest-streak">Streak: {streak}</div>

          <div className="alpha-quest-keyboard-hint">
            Type the letter or click below
          </div>

          {/* On-screen letter buttons */}
          <div className="alpha-quest-letter-buttons">
            {ALPHABET.map((letter) => (
              <button
                key={letter}
                className="alpha-quest-letter-btn"
                onClick={() => handleLetterPress(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      )}

      {(gameState === 'gameOver' || gameState === 'victory') && (
        <div className="alpha-quest-game-over">
          <div className={`game-over-modal ${gameState === 'victory' ? 'victory' : 'defeat'}`}>
            {gameState === 'gameOver' && (
              <>
                <div className="game-over-emoji">😵</div>
                <h2 className="game-over-title">{gameOverMessage}</h2>
                <p className="game-over-stats">
                  Made it to Round {round}/{totalRounds === Infinity ? '∞' : totalRounds}
                  <br />
                  Final Score: {score}
                </p>
              </>
            )}
            {gameState === 'victory' && (
              <>
                <div className="game-over-emoji">🎉</div>
                <h2 className="game-over-title">{gameOverMessage}</h2>
              </>
            )}

            <div className="game-over-buttons">
              <button className="game-over-btn play-again" onClick={() => setGameState('menu')}>
                Play Again
              </button>
              <button className="game-over-btn back-to-alpha" onClick={onClose}>
                Back to Alphabet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
