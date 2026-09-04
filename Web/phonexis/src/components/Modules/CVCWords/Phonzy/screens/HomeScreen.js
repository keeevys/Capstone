import { useMicrophoneTest } from '../hooks/useMicrophoneTest';
import MicLevelMeter from '../components/MicLevelMeter';
import { isSpeechRecognitionAvailable } from '../lib/speechEngine';

const MIC_STATUS_TEXT = {
  idle: { label: 'Not tested yet', tone: 'neutral' },
  testing: { label: 'Requesting permission…', tone: 'neutral' },
  ok: { label: 'Microphone is working!', tone: 'good' },
  denied: { label: 'Permission denied', tone: 'bad' },
  unavailable: { label: 'Not supported in this browser', tone: 'bad' },
  error: { label: 'Microphone unavailable', tone: 'bad' },
};

export default function HomeScreen({ onPlay, onViewProgress, totalScore }) {
  const { status, level, errorMessage, startTest, stopTest } = useMicrophoneTest();
  const speechOk = isSpeechRecognitionAvailable();
  const micInfo = MIC_STATUS_TEXT[status] || MIC_STATUS_TEXT.idle;

  return (
    <div className="phonzy-screen phonzy-home">
      <div className="phonzy-mascot" aria-hidden="true">🦉</div>
      <h1 className="phonzy-title">Phonzy</h1>
      <p className="phonzy-tagline">Say it out loud and let's hear you shine!</p>

      <div className="phonzy-home-stats">
        <div className="phonzy-stat-pill">
          <span>⭐ Total Score</span>
          <strong>{totalScore}</strong>
        </div>
      </div>

      <div className="phonzy-card phonzy-mic-check">
        <h2>🎧 Microphone Check</h2>
        <p>Make sure your mic works before you start playing.</p>

        <div className={`phonzy-mic-status phonzy-mic-status-${micInfo.tone}`}>
          <span className="phonzy-mic-dot" />
          {micInfo.label}
        </div>

        {status === 'ok' ? <MicLevelMeter level={level} /> : null}

        {errorMessage ? <p className="phonzy-mic-error">⚠️ {errorMessage}</p> : null}

        {!speechOk ? (
          <p className="phonzy-mic-note">
            Tip: your browser doesn't fully support speech recognition. Phonzy will still work using voice-clarity
            scoring, but Chrome gives the most accurate results.
          </p>
        ) : null}

        <div className="phonzy-mic-actions">
          {status === 'ok' ? (
            <button type="button" className="phonzy-btn phonzy-btn-secondary" onClick={stopTest}>
              Stop Test
            </button>
          ) : (
            <button type="button" className="phonzy-btn phonzy-btn-secondary" onClick={startTest}>
              🎤 Test Microphone
            </button>
          )}
        </div>
      </div>

      <div className="phonzy-how-to">
        <h2>How to Play</h2>
        <ol>
          <li>🔊 Listen to the word</li>
          <li>🎤 Tap the mic and say it out loud</li>
          <li>✅ Get a pronunciation score and feedback</li>
          <li>🔥 Chain correct answers for a streak bonus</li>
        </ol>
      </div>

      <div className="phonzy-home-actions">
        <button type="button" className="phonzy-btn phonzy-btn-primary phonzy-btn-large" onClick={onPlay}>
          ▶ Play
        </button>
        <button type="button" className="phonzy-btn phonzy-btn-ghost" onClick={onViewProgress}>
          📊 Progress & Leaderboard
        </button>
      </div>
    </div>
  );
}
