import './Modules.css';
import AlphabetRecognition from './AlphabetRecognition';
import CVCWords from './CVCWords';
import Vowels from './Vowels';
import Consonants from './Consonants';

const moduleCards = {
  alphabet: {
    title: 'Alphabet recognition',
    description: 'Letter shapes, sounds, and fast visual recall.',
    component: AlphabetRecognition,
  },
  vowels: {
    title: 'Vowels',
    description: 'Learn vowel sounds with audio guides and activities.',
    component: Vowels,
  },
  consonants: {
    title: 'Consonants',
    description: 'Explore consonant sounds with visual learning.',
    component: Consonants,
  },
  cvc: {
    title: 'CVC words',
    description: 'Three-letter blend practice for simple decoding.',
    component: CVCWords,
  },
};

export default function Modules({ activeModule, onNavigate, onSelectModule, onLogout, onComplete, vowelsUnlocked = false, consonantsUnlocked = false, cvcUnlocked = false }) {
  const currentModule = moduleCards[activeModule] ?? moduleCards.alphabet;
  const CurrentGame = currentModule.component;

  const isLocked = (key) => {
    if (key === 'vowels' && !vowelsUnlocked) return true;
    if (key === 'consonants' && !consonantsUnlocked) return true;
    if (key === 'cvc' && !cvcUnlocked) return true;
    return false;
  };

  return (
    <section className="module-shell">
      <div className="module-banner">
        <div>
          <p className="module-label">Game select</p>
          <h3>Pick a phonics challenge and play the round.</h3>
          <p>
            The module grid mirrors the Figma structure: compact game cards on top, detail panel below,
            and one active challenge at a time.
          </p>
        </div>

        <div className="module-banner-stats">
          <article>
            <span>Score</span>
            <strong>240</strong>
          </article>
          <article>
            <span>Streak</span>
            <strong>6 days</strong>
          </article>
        </div>
      </div>

      <div className="module-strip">
        {Object.entries(moduleCards).map(([key, module]) => (
          <button
            key={key}
            type="button"
            className={
              key === activeModule
                ? `module-tab active${isLocked(key) ? ' locked' : ''}`
                : `module-tab${isLocked(key) ? ' locked' : ''}`
            }
            onClick={() => onSelectModule(key)}
            disabled={isLocked(key)}
          >
            <strong>{module.title}</strong>
            <span>{module.description}</span>
            {isLocked(key) ? <small className="module-tab-lock">Locked</small> : null}
          </button>
        ))}
      </div>

      <div className="module-content">
        <div className="module-stage">
          <CurrentGame onComplete={onComplete} onBack={() => onNavigate('dashboard')} />
        </div>
      </div>
    </section>
  );
}