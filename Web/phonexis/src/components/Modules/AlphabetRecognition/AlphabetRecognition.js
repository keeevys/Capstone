import { useMemo, useState } from 'react';
import './AlphabetRecognition.css';

const alphabet = [
  { letter: 'A', word: 'Apple', icon: '🍎' },
  { letter: 'B', word: 'Ball', icon: '🏀' },
  { letter: 'C', word: 'Cat', icon: '🐱' },
  { letter: 'D', word: 'Dog', icon: '🐶' },
  { letter: 'E', word: 'Egg', icon: '🥚' },
  { letter: 'F', word: 'Fish', icon: '🐟' },
  { letter: 'G', word: 'Grapes', icon: '🍇' },
  { letter: 'H', word: 'Hat', icon: '🎩' },
  { letter: 'I', word: 'Ice cream', icon: '🍦' },
  { letter: 'J', word: 'Jam', icon: '🫙' },
  { letter: 'K', word: 'Kite', icon: '🪁' },
  { letter: 'L', word: 'Lion', icon: '🦁' },
  { letter: 'M', word: 'Moon', icon: '🌙' },
  { letter: 'N', word: 'Nest', icon: '🪺' },
  { letter: 'O', word: 'Orange', icon: '🍊' },
  { letter: 'P', word: 'Pear', icon: '🍐' },
  { letter: 'Q', word: 'Queen', icon: '👑' },
  { letter: 'R', word: 'Rainbow', icon: '🌈' },
  { letter: 'S', word: 'Sun', icon: '☀️' },
  { letter: 'T', word: 'Tree', icon: '🌳' },
  { letter: 'U', word: 'Umbrella', icon: '☂️' },
  { letter: 'V', word: 'Violin', icon: '🎻' },
  { letter: 'W', word: 'Whale', icon: '🐋' },
  { letter: 'X', word: 'Xylophone', icon: '🎼' },
  { letter: 'Y', word: 'Yarn', icon: '🧶' },
  { letter: 'Z', word: 'Zebra', icon: '🦓' },
];

export default function AlphabetRecognition({ onComplete, onBack }) {
  const [selectedLetter, setSelectedLetter] = useState(alphabet[0]);
  const [feedback, setFeedback] = useState('Choose a letter to see its sample object.');
  const [mode, setMode] = useState('learning'); // 'learning' or 'pretest'
  const [difficulty, setDifficulty] = useState(null); // 'easy', 'medium', 'hard'
  const [currentPretestLetter, setCurrentPretestLetter] = useState(null);
  const [pretestScore, setPretestScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0); // Track total attempts (correct + wrong)
  const [correctLetters, setCorrectLetters] = useState([]); // Track correctly identified letters
  const [wrongTiles, setWrongTiles] = useState([]); // Track tiles guessed wrongly (for styling)

  const letters = useMemo(() => alphabet.map((item) => item.letter), []);
  const selectedIndex = letters.indexOf(selectedLetter.letter);

  const speakLetter = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Speech is not available for ${selectedLetter.letter} right now.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedLetter.letter);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking ${selectedLetter.letter}.`);
  };

  const handlePick = (letter) => {
    const nextSelected = alphabet.find((item) => item.letter === letter) ?? alphabet[0];
    setSelectedLetter(nextSelected);
    setFeedback(`Selected ${nextSelected.letter} - ${nextSelected.word}.`);
  };

  const goToRelativeLetter = (offset) => {
    const nextIndex = (selectedIndex + offset + alphabet.length) % alphabet.length;
    const nextSelected = alphabet[nextIndex];
    setSelectedLetter(nextSelected);
    setFeedback(`Selected ${nextSelected.letter} - ${nextSelected.word}.`);
  };

  const getDifficultyRange = (diff) => {
    if (diff === 'easy') return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
    if (diff === 'medium') return ['N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
    return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  };

  const startPretest = (diff) => {
    setMode('pretest');
    setDifficulty(diff);
    setPretestScore(0);
    setTotalAttempts(0);
    setCorrectLetters([]);
    setWrongTiles([]);
    selectNewPretestLetter(getDifficultyRange(diff));
  };

  const selectNewPretestLetter = (range) => {
    // Filter out already correct letters (they won't show again)
    const availableLetters = range.filter((letter) => !correctLetters.includes(letter));
    
    if (availableLetters.length > 0) {
      const randomLetter = availableLetters[Math.floor(Math.random() * availableLetters.length)];
      setCurrentPretestLetter(randomLetter);
      playPretestAudio(randomLetter);
    }
  };

  const playPretestAudio = (letter) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(letter);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
      setFeedback(`Listen to the letter...`);
    }
  };

  const playRandomPretestLetter = (range) => {
    // Don't replay if the current audio letter was already guessed correctly (GREEN)
    if (currentPretestLetter && !correctLetters.includes(currentPretestLetter)) {
      playPretestAudio(currentPretestLetter);
    }
  };

  const handlePretestAnswer = (letter) => {
    // Stop if pretest is already complete (10 attempts made)
    if (totalAttempts >= 10) {
      return;
    }

    const newTotalAttempts = totalAttempts + 1;
    const audioLetter = currentPretestLetter; // The letter that was spoken

    if (letter === audioLetter) {
      // Correct answer - audio letter turns GREEN
      const newCorrectLetters = [...correctLetters, audioLetter];
      setCorrectLetters(newCorrectLetters);
      setPretestScore((prev) => prev + 1);
      setTotalAttempts(newTotalAttempts);
      setFeedback(`✓ Correct! That's ${audioLetter}!`);

      // Check if this is the 10th attempt
      if (newTotalAttempts >= 10) {
        setTimeout(() => {
          setFeedback(`Pretest Complete! Score: ${newCorrectLetters.length}/10`);
          setMode('learning');
          setCurrentPretestLetter(null);
        }, 1500);
      } else {
        // Move to next letter after 1 second
        setTimeout(() => {
          selectNewPretestLetter(getDifficultyRange(difficulty));
        }, 1000);
      }
    } else {
      // Wrong answer - audio letter turns RED
      setWrongTiles((prev) => [...prev, audioLetter]);
      setTotalAttempts(newTotalAttempts);
      setFeedback(`✗ Wrong! That's not ${audioLetter}.`);

      // Check if this is the 10th attempt
      if (newTotalAttempts >= 10) {
        setTimeout(() => {
          setFeedback(`Pretest Complete! Score: ${pretestScore}/10`);
          setMode('learning');
          setCurrentPretestLetter(null);
        }, 1500);
      } else {
        // Move to next letter after 1 second
        setTimeout(() => {
          selectNewPretestLetter(getDifficultyRange(difficulty));
        }, 1000);
      }
    }
  };

  return (
    <div className="module-detail alphabet-module">
      <div className="alphabet-topbar">
        <p className="module-detail-label">
          {mode === 'learning' ? 'Alphabet Recognition' : `Pretest - ${difficulty?.toUpperCase()}`}
        </p>
        <button type="button" className="module-back secondary" onClick={onBack}>
          ← Back to dashboard
        </button>
      </div>

      {mode === 'learning' ? (
        <div className="alphabet-stage">
          <div className="alphabet-display">
            <div className="alphabet-letter-panel">
              <span className="alphabet-letter">{selectedLetter.letter}</span>
            </div>

            <div className="alphabet-object-panel">
              <span className="alphabet-object-icon" aria-hidden="true">
                {selectedLetter.icon}
              </span>
              <div>
                <p className="alphabet-object-word">{selectedLetter.word}</p>
                <p className="alphabet-object-caption">Sample object</p>
              </div>
            </div>
          </div>

          <div className="alphabet-actions">
            <button type="button" className="alphabet-speak-button" onClick={speakLetter}>
              🔊 Listen
            </button>
            <p className="game-feedback">{feedback}</p>
          </div>

          <div className="alphabet-controls">
            <button type="button" className="alphabet-nav-button" onClick={() => goToRelativeLetter(-1)}>
              Previous
            </button>
            <button type="button" className="alphabet-nav-button" onClick={() => goToRelativeLetter(1)}>
              Next
            </button>
          </div>

          <div className="letter-grid" aria-label="Alphabet choices">
            {letters.map((letter) => (
              <button
                key={letter}
                type="button"
                className={letter === selectedLetter.letter ? 'letter-tile active' : 'letter-tile'}
                onClick={() => handlePick(letter)}
              >
                {letter}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(3, 1fr)', maxWidth: '800px', margin: '2rem auto 0', width: '100%' }}>
            <button
              type="button"
              className="alphabet-complete-button"
              onClick={() => startPretest('easy')}
              style={{ padding: '1.5rem', fontSize: '1.1rem', fontWeight: 700 }}
            >
              🟢 EASY (A-M)
            </button>
            <button
              type="button"
              className="alphabet-complete-button"
              onClick={() => startPretest('medium')}
              style={{ padding: '1.5rem', fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
            >
              🟡 MEDIUM (N-Z)
            </button>
            <button
              type="button"
              className="alphabet-complete-button"
              onClick={() => startPretest('hard')}
              style={{ padding: '1.5rem', fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)' }}
            >
              🔴 HARD (A-Z)
            </button>
          </div>
        </div>
      ) : mode === 'pretest' ? (
        <div className="alphabet-stage">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ color: '#667eea', marginBottom: '0.5rem', fontSize: '1.8rem' }}>Listen and Identify</h2>
            <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '1rem' }}>
              Score: {pretestScore}/10 (Attempt {totalAttempts}/10)
            </p>
          </div>

          <div className="alphabet-actions">
            <button
              type="button"
              className="alphabet-speak-button"
              onClick={() => playRandomPretestLetter(getDifficultyRange(difficulty))}
              disabled={correctLetters.includes(currentPretestLetter)}
              style={{ opacity: correctLetters.includes(currentPretestLetter) ? 0.5 : 1, cursor: correctLetters.includes(currentPretestLetter) ? 'not-allowed' : 'pointer' }}
            >
              🔊 Listen Again
            </button>
            <p className="game-feedback">{feedback}</p>
          </div>

          <div className="letter-grid" aria-label="Letter choices">
            {getDifficultyRange(difficulty).map((letter) => (
              <button
                key={letter}
                type="button"
                className={
                  correctLetters.includes(letter)
                    ? 'letter-tile active'
                    : wrongTiles.includes(letter)
                    ? 'letter-tile wrong'
                    : 'letter-tile'
                }
                onClick={() => 
                  !correctLetters.includes(letter) && 
                  !wrongTiles.includes(letter) &&
                  handlePretestAnswer(letter)
                }
                disabled={correctLetters.includes(letter) || wrongTiles.includes(letter)}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
