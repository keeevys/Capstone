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

  return (
    <div className="module-detail alphabet-module">
      <div className="alphabet-topbar">
        <p className="module-detail-label">Alphabet Recognition</p>
        <button type="button" className="module-back secondary" onClick={onBack}>
          ← Back to dashboard
        </button>
      </div>

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
          <button type="button" className="alphabet-complete-button" onClick={onComplete}>
            Complete
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
      </div>
    </div>
  );
}
