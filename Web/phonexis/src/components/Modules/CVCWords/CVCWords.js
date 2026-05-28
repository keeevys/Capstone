import { useMemo, useState } from 'react';
import './CVCWords.css';

const cvcTypes = [
  { id: 'families', label: 'Word Families' },
  { id: 'selection', label: 'Word Selection' },
  { id: 'building', label: 'Word Building' },
];

const wordFamilies = [
  {
    family: '-at',
    icon: '🐱',
    words: [
      { word: 'cat', icon: '🐱', description: 'A funny pet that says meow' },
      { word: 'bat', icon: '🦇', description: 'A night flyer with tiny wings' },
      { word: 'hat', icon: '🎩', description: 'Something you wear on your head' },
      { word: 'mat', icon: '🧶', description: 'A soft pad on the floor' },
      { word: 'rat', icon: '🐭', description: 'A small mouse-like animal' },
    ],
  },
  {
    family: '-an',
    icon: '🐻',
    words: [
      { word: 'man', icon: '🧑', description: 'A grown-up person' },
      { word: 'fan', icon: '🪭', description: 'It moves air when it spins' },
      { word: 'pan', icon: '🍳', description: 'Used for cooking food' },
      { word: 'can', icon: '🥫', description: 'A metal container' },
      { word: 'van', icon: '🚐', description: 'A vehicle for carrying people' },
    ],
  },
  {
    family: '-ig',
    icon: '🐷',
    words: [
      { word: 'pig', icon: '🐷', description: 'A farm animal that oinks' },
      { word: 'big', icon: '🟣', description: 'Something large in size' },
      { word: 'wig', icon: '💇', description: 'A head covering with hair' },
      { word: 'dig', icon: '⛏️', description: 'To make a hole in the ground' },
      { word: 'fig', icon: '🫐', description: 'A sweet fruit' },
    ],
  },
];

const wordSelection = [
  { word: 'dog', icon: '🐶', prompt: 'A pet that barks', choices: ['Log', 'Dog', 'Fog'], correct: 'Dog' },
  { word: 'cat', icon: '🐱', prompt: 'A funny pet that says meow', choices: ['Hat', 'Cat', 'Mat'], correct: 'Cat' },
  { word: 'pig', icon: '🐷', prompt: 'A farm animal that oinks', choices: ['Pig', 'Fig', 'Dig'], correct: 'Pig' },
  { word: 'bat', icon: '🦇', prompt: 'A night flyer with tiny wings', choices: ['Bat', 'Rat', 'Hat'], correct: 'Bat' },
  { word: 'sun', icon: '☀️', prompt: 'The bright star in the sky', choices: ['Sun', 'Run', 'Fun'], correct: 'Sun' },
];

const wordBuildingDeck = [
  {
    target: 'cat',
    icon: '🐱',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['', 'A', 'T'],
    choices: ['C', 'A', 'T', 'O', 'E'],
    description: 'A small pet that says meow.',
  },
  {
    target: 'dog',
    icon: '🐶',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['D', '', 'G'],
    choices: ['D', 'O', 'G', 'A', 'U'],
    description: 'A pet that barks.',
  },
  {
    target: 'sun',
    icon: '☀️',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['S', 'U', ''],
    choices: ['S', 'U', 'N', 'A', 'E'],
    description: 'The bright star in the sky.',
  },
  {
    target: 'pig',
    icon: '🐷',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['', 'I', 'G'],
    choices: ['P', 'I', 'G', 'O', 'E'],
    description: 'A farm animal that oinks.',
  },
  {
    target: 'bat',
    icon: '🦇',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['B', '', 'T'],
    choices: ['B', 'A', 'T', 'I', 'O'],
    description: 'A night flyer with tiny wings.',
  },
  {
    target: 'man',
    icon: '🧑',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['M', 'A', ''],
    choices: ['M', 'A', 'N', 'E', 'I'],
    description: 'A grown-up person.',
  },
  {
    target: 'fan',
    icon: '🪭',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['', 'A', 'N'],
    choices: ['F', 'A', 'N', 'O', 'U'],
    description: 'It moves air when it spins.',
  },
  {
    target: 'pen',
    icon: '🖊️',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['P', '', 'N'],
    choices: ['P', 'E', 'N', 'A', 'O'],
    description: 'A tool used for writing.',
  },
  {
    target: 'cup',
    icon: '🥤',
    prompt: 'Build the word by choosing the correct letters',
    slots: ['C', 'U', ''],
    choices: ['C', 'U', 'P', 'A', 'O'],
    description: 'A container used for drinking.',
  },
];

const getRandomBuildingWord = () => wordBuildingDeck[Math.floor(Math.random() * wordBuildingDeck.length)];

export default function CVCWords({ onComplete, onBack }) {
  const [activeType, setActiveType] = useState('families');
  const [selectedFamily, setSelectedFamily] = useState(wordFamilies[0].family);
  const [selectedWord, setSelectedWord] = useState(wordSelection[0]);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [selectionResult, setSelectionResult] = useState(null);
  const [selectionMessage, setSelectionMessage] = useState('');
  const [buildingWord, setBuildingWord] = useState(getRandomBuildingWord());
  const [builtSlots, setBuiltSlots] = useState(buildingWord.slots);
  const [buildingChoice, setBuildingChoice] = useState(buildingWord.choices[0]);
  const [buildingResult, setBuildingResult] = useState(null);
  const [buildingMessage, setBuildingMessage] = useState('Choose the missing letter.');
  const [feedback, setFeedback] = useState('Choose a word family to begin.');

  const pickRandomBuildingWord = (excludeTarget) => {
    const availableWords = wordBuildingDeck.filter((item) => item.target !== excludeTarget);
    const source = availableWords.length > 0 ? availableWords : wordBuildingDeck;
    return source[Math.floor(Math.random() * source.length)];
  };

  const speakWord = (word) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setFeedback(`Hear the word: ${word}.`);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    setFeedback(`Speaking ${word}.`);
  };

  const activeFamily = useMemo(
    () => wordFamilies.find((item) => item.family === selectedFamily) ?? wordFamilies[0],
    [selectedFamily]
  );

  const handleTypeChange = (typeId) => {
    setActiveType(typeId);

    if (typeId === 'families') {
      setFeedback('Choose a family and match the words.');
      return;
    }

    if (typeId === 'selection') {
      setFeedback('Choose the correct word for the picture.');
      return;
    }

    const nextBuildingWord = pickRandomBuildingWord();
    setBuildingWord(nextBuildingWord);
    setBuiltSlots(nextBuildingWord.slots);
    setBuildingChoice(nextBuildingWord.choices[0]);
    setBuildingResult(null);
    setBuildingMessage('Choose the missing letter.');
    setFeedback('Build the word by choosing the correct letter.');
  };

  const handleFamilyPick = (family) => {
    setSelectedFamily(family);
    const nextFamily = wordFamilies.find((item) => item.family === family) ?? wordFamilies[0];
    setSelectedWord(nextFamily.words[0]);
    setFeedback(`Selected ${family} family.`);
  };

  const handleWordPick = (item) => {
    setSelectedWord(item);
    setFeedback(`${item.word} selected.`);
  };

  const currentSelection = wordSelection[selectionIndex];

  const handleSelectionPick = (choice) => {
    if (choice !== currentSelection.correct) {
      setSelectionResult('wrong');
      setSelectionMessage('Wrong answer. Try again.');
      setFeedback('');
      return;
    }

    setSelectionResult('correct');
    setSelectionMessage('Correct!');
    setFeedback('');
  };

  const handleNextSelection = () => {
    const nextIndex = selectionIndex + 1;

    if (nextIndex >= wordSelection.length) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setSelectionIndex(nextIndex);
    setSelectedWord(wordSelection[nextIndex]);
    setSelectionResult(null);
    setSelectionMessage('');
    setFeedback('');
  };

  const handleBuildLetter = (letter) => {
    setBuildingChoice(letter);
    setBuildingResult(null);
    setBuildingMessage('Choose the missing letter.');
    setFeedback(`Letter ${letter} selected.`);
  };

  const handleCheckBuild = () => {
    const blankIndex = buildingWord.slots.findIndex((slot) => slot === '');
    const nextSlots = [...buildingWord.slots];
    nextSlots[blankIndex] = buildingChoice;
    setBuiltSlots(nextSlots);

    if (nextSlots.join('').toLowerCase() === buildingWord.target) {
      setBuildingResult('correct');
      setBuildingMessage('Correct!');
      setFeedback('Correct!');
      return;
    }

    setBuildingResult('wrong');
    setBuildingMessage('Wrong answer. Try again.');
    setFeedback('Try again.');
  };

  const handleNextBuildingWord = () => {
    const nextBuildingWord = pickRandomBuildingWord(buildingWord.target);
    setBuildingWord(nextBuildingWord);
    setBuiltSlots(nextBuildingWord.slots);
    setBuildingChoice(nextBuildingWord.choices[0]);
    setBuildingResult(null);
    setBuildingMessage('Choose the missing letter.');
    setFeedback('Build the word by choosing the correct letter.');
  };

  const renderFamilies = () => (
    <div className="cvc-stage">
      <div className="cvc-family-chips" aria-label="Word family selector">
        {wordFamilies.map((item) => (
          <button
            key={item.family}
            type="button"
            className={item.family === selectedFamily ? 'cvc-family-chip active' : 'cvc-family-chip'}
            onClick={() => handleFamilyPick(item.family)}
          >
            {item.family}
          </button>
        ))}
      </div>

      <div className="cvc-word-row" aria-label="Word family cards">
        {activeFamily.words.map((item) => (
          <button
            key={item.word}
            type="button"
            className={item.word === selectedWord.word ? 'cvc-word-card active' : 'cvc-word-card'}
            onClick={() => handleWordPick(item)}
          >
            <span className="cvc-word-icon" aria-hidden="true">
              {item.icon}
            </span>
            <strong>{item.word}</strong>
          </button>
        ))}
      </div>

      <div className="cvc-centered-panel">
        <span className="cvc-centered-icon" aria-hidden="true">
          {selectedWord.icon}
        </span>
        <h3>{selectedWord.word}</h3>
        <p>{selectedWord.description}</p>
        <button type="button" className="cvc-action-button" onClick={() => speakWord(selectedWord.word)}>
          Hear the Word
        </button>
      </div>
    </div>
  );

  const renderSelection = () => (
    <div className="cvc-stage cvc-selection-stage">
      <div className="cvc-selection-header">
        <h3>Choose the Correct Word</h3>
        <p>{currentSelection.prompt}</p>
      </div>

      <div className="cvc-selection-card-shell">
        <div className="cvc-selection-image" aria-hidden="true">
          {currentSelection.icon}
        </div>

        <div className="cvc-selection-answer-area">
          <div className="cvc-selection-choices" aria-label="Word selection choices">
            {currentSelection.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={selectionResult === 'correct' && choice === currentSelection.correct ? 'cvc-selection-option correct' : choice === currentSelection.correct && selectionResult === 'wrong' ? 'cvc-selection-option correct' : 'cvc-selection-option'}
                onClick={() => handleSelectionPick(choice)}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>

        <div className={selectionResult === 'correct' ? 'cvc-selection-message correct' : 'cvc-selection-message wrong'} aria-live="polite">
          {selectionMessage}
        </div>

        {selectionResult === 'correct' ? (
          <button type="button" className="cvc-action-button cvc-next-button" onClick={handleNextSelection}>
            Next
          </button>
        ) : null}
      </div>

      <div className="cvc-dots" aria-label="Selection progress">
        {wordSelection.map((item, index) => (
          <span key={item.word} className={index === selectionIndex ? 'cvc-dot active' : index < selectionIndex ? 'cvc-dot done' : 'cvc-dot'} />
        ))}
      </div>
    </div>
  );

  const renderBuilding = () => (
    <div className="cvc-stage">
      <div className="cvc-building-shell">
        <div className="cvc-building-hint" aria-label="Word clue">
          <span className="cvc-building-hint-label">Object clue</span>
          <span className="cvc-building-hint-icon" aria-hidden="true">
            {buildingWord.icon}
          </span>
          <p>{buildingWord.description}</p>
        </div>

        <span className="cvc-centered-icon" aria-hidden="true">
          {buildingWord.icon}
        </span>
        <h3>Word Building</h3>
        <p>{buildingWord.prompt}</p>

        <div className="cvc-build-word" aria-label="Built word">
          {builtSlots.map((slot, index) => (
            <div key={`${index}-${slot}`} className={slot ? 'cvc-build-slot filled' : 'cvc-build-slot'}>
              {slot || '_'}
            </div>
          ))}
        </div>

        <div className="cvc-letter-choices" aria-label="Letter choices">
          {buildingWord.choices.map((letter) => (
            <button
              key={letter}
              type="button"
              className={letter === buildingChoice ? 'cvc-letter-choice active' : 'cvc-letter-choice'}
              onClick={() => handleBuildLetter(letter)}
            >
              {letter}
            </button>
          ))}
        </div>

        <button type="button" className="cvc-action-button" onClick={handleCheckBuild}>
          Check Word
        </button>

        {buildingResult === 'correct' ? (
          <button type="button" className="cvc-action-button cvc-next-button" onClick={handleNextBuildingWord}>
            Next Word
          </button>
        ) : null}

        <div className={buildingResult === 'correct' ? 'cvc-selection-message correct' : 'cvc-selection-message wrong'} aria-live="polite">
          {buildingMessage}
        </div>
      </div>
    </div>
  );

  return (
    <div className="module-detail cvc-detail">
      <div className="cvc-topbar">
        <button type="button" className="cvc-back" onClick={onBack}>
          ← BACK TO DASHBOARD
        </button>
      </div>

      <div className="cvc-tabs" role="tablist" aria-label="CVC lesson types">
        {cvcTypes.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={activeType === item.id}
            className={activeType === item.id ? 'cvc-tab active' : 'cvc-tab'}
            onClick={() => handleTypeChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeType === 'families' ? renderFamilies() : null}
      {activeType === 'selection' ? renderSelection() : null}
      {activeType === 'building' ? renderBuilding() : null}

      <div className="cvc-feedback" aria-live="polite">
        {activeType === 'selection' || activeType === 'building' ? '' : feedback}
      </div>
    </div>
  );
}
