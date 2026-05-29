import { useState } from 'react';
import './Consonants.css';

const consonants = [
  { letter: 'B', word: 'Ball', icon: '⚽' },
  { letter: 'C', word: 'Cat', icon: '🐱' },
  { letter: 'D', word: 'Dog', icon: '🐶' },
  { letter: 'F', word: 'Fish', icon: '🐟' },
  { letter: 'G', word: 'Gift', icon: '🎁' },
  { letter: 'H', word: 'Hat', icon: '🎩' },
  { letter: 'J', word: 'Jam', icon: '🍓' },
  { letter: 'K', word: 'Kite', icon: '🪁' },
  { letter: 'L', word: 'Lion', icon: '🦁' },
  { letter: 'M', word: 'Moon', icon: '🌙' },
  { letter: 'N', word: 'Nest', icon: '🪺' },
  { letter: 'P', word: 'Pig', icon: '🐷' },
  { letter: 'Q', word: 'Queen', icon: '👑' },
  { letter: 'R', word: 'Rabbit', icon: '🐰' },
  { letter: 'S', word: 'Sun', icon: '☀️' },
  { letter: 'T', word: 'Tiger', icon: '🐯' },
  { letter: 'W', word: 'Wolf', icon: '🐺' },
  { letter: 'X', word: 'Xylophone', icon: '🎹' },
  { letter: 'Y', word: 'Yoyo', icon: '🪀' },
  { letter: 'Z', word: 'Zebra', icon: '🦓' },
];

export default function Consonants({ onComplete, onBack }) {
  const [mode, setMode] = useState('explore');
  const [selectedLetter, setSelectedLetter] = useState(consonants[0].letter);
  const [feedback, setFeedback] = useState('Choose a consonant to hear the object name.');

  const selectedItem = consonants.find((item) => item.letter === selectedLetter) ?? consonants[0];

  const speakText = (text, message) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(message);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setFeedback(message);
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'explore') {
      setFeedback('Choose a consonant to hear the object name.');
    }
  };

  const handlePick = (letter) => {
    const nextItem = consonants.find((item) => item.letter === letter) ?? consonants[0];
    setSelectedLetter(nextItem.letter);
    speakText(nextItem.word, `Speaking ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    speakText(selectedItem.word, `Speaking ${selectedItem.word}.`);
  };

  return (
    <div className="module-detail consonants-detail">
      <div className="consonants-topbar">
        <button type="button" className="consonants-back" onClick={onBack}>
          ← BACK TO DASHBOARD
        </button>
      </div>

      <div className="consonants-switch" role="tablist" aria-label="Consonants modes">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'explore'}
          className={mode === 'explore' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('explore')}
        >
          Explore
        </button>
      </div>

      <div className="consonants-picker" aria-label="Consonant choices">
        {consonants.map((item) => (
          <button
            key={item.letter}
            type="button"
            className={item.letter === selectedLetter ? 'consonant-tile active' : 'consonant-tile'}
            onClick={() => handlePick(item.letter)}
          >
            <span className="consonant-tile-letter">{item.letter}</span>
            <span className="consonant-tile-icon" aria-hidden="true">
              {item.icon}
            </span>
          </button>
        ))}
      </div>

      <div className="consonants-stage">
        <span className="consonants-letter">{selectedItem.letter}</span>

        <div className="consonants-object">
          <span className="consonants-object-icon" aria-hidden="true">
            {selectedItem.icon}
          </span>
          <p className="consonants-object-word">{selectedItem.word}</p>
          <p className="consonants-object-sound">Say the object name.</p>
        </div>

        <button type="button" className="consonants-listen" onClick={speakCurrent}>
          🔊 LISTEN TO OBJECT
        </button>

        <p className="game-feedback">{feedback}</p>
      </div>
    </div>
  );
}
