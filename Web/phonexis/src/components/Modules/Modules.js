import './Modules.css';
import AlphabetRecognition from './AlphabetRecognition';
import CVCWords from './CVCWords';
import VowelsConsonant from './VowelsConsonant';

const moduleCards = {
  alphabet: {
    title: 'Alphabet recognition',
    description: 'Letter shapes, sounds, and fast visual recall.',
    component: AlphabetRecognition,
  },
  cvc: {
    title: 'CVC words',
    description: 'Three-letter blend practice for simple decoding.',
    component: CVCWords,
  },
  vowels: {
    title: 'Vowels and consonants',
    description: 'Sort, compare, and reinforce speech sound groups.',
    component: VowelsConsonant,
  },
};

export default function Modules({ activeModule, onNavigate, onSelectModule, onLogout }) {
  const currentModule = moduleCards[activeModule] ?? moduleCards.alphabet;
  const CurrentGame = currentModule.component;

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
            className={key === activeModule ? 'module-tab active' : 'module-tab'}
            onClick={() => onSelectModule(key)}
          >
            <strong>{module.title}</strong>
            <span>{module.description}</span>
          </button>
        ))}
      </div>

      <div className="module-content">
        <div className="module-stage">
          <CurrentGame onComplete={() => onNavigate('dashboard')} onBack={() => onNavigate('dashboard')} />
        </div>
      </div>
    </section>
  );
}