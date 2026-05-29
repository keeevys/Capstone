import { useState } from 'react';
import './Vowels.css';

const vowels = [
  { letter: 'A', sound: 'ah', word: 'Apple', icon: '🍎' },
  { letter: 'E', sound: 'eh', word: 'Elephant', icon: '🐘' },
  { letter: 'I', sound: 'ih', word: 'Ice cream', icon: '🍦' },
  { letter: 'O', sound: 'oh', word: 'Octopus', icon: '🐙' },
  { letter: 'U', sound: 'uh', word: 'Umbrella', icon: '☂️' },
];

const activityDeck = [
  { letter: 'A', prompt: '_pple', icon: '🍎', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'E', prompt: '_lephant', icon: '🐘', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'I', prompt: '_ce cream', icon: '🍦', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'O', prompt: '_ctopus', icon: '🐙', choices: ['A', 'E', 'I', 'O', 'U'] },
  { letter: 'U', prompt: '_mbrella', icon: '☂️', choices: ['A', 'E', 'I', 'O', 'U'] },
];

const videos = [
  {
    id: 1,
    title: 'Introduction to Vowels',
    description: 'Learn about the 5 main vowel sounds and how they are pronounced.',
    url: '/vowels-videos/video1.mp4',
    duration: '5:30',
  },
  {
    id: 2,
    title: 'Vowel Sounds in Words',
    description: 'Practice identifying vowel sounds in common words.',
    url: '/vowels-videos/video2.mp4',
    duration: '6:45',
  },
];

export default function Vowels({ onComplete, onBack }) {
  const [mode, setMode] = useState('learning');
  const [selectedLetter, setSelectedLetter] = useState(vowels[0].letter);
  const [activityIndex, setActivityIndex] = useState(0);
  const [activityChoice, setActivityChoice] = useState('');
  const [activityResult, setActivityResult] = useState(null);
  const [activityMessage, setActivityMessage] = useState('Choose the correct vowel.');
  const [feedback, setFeedback] = useState('Choose a vowel to hear its sound.');
  const [videosWatched, setVideosWatched] = useState([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(null);
  const [videoProgress, setVideoProgress] = useState({});

  const selectedItem = vowels.find((item) => item.letter === selectedLetter) ?? vowels[0];
  const currentActivity = activityDeck[activityIndex];
  const allVideosWatched = videosWatched.length === videos.length;

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

  const resetActivity = () => {
    setActivityIndex(0);
    setActivityChoice('');
    setActivityResult(null);
    setActivityMessage('Choose the correct vowel.');
  };

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'lecture') {
      setFeedback('Choose a vowel to hear its sound.');
    }
    resetActivity();
  };

  const handleVideoWatched = (videoId) => {
    if (!videosWatched.includes(videoId)) {
      setVideosWatched([...videosWatched, videoId]);
    }
  };

  const handleVideoComplete = (videoId) => {
    if (!videosWatched.includes(videoId)) {
      setVideosWatched((prev) => [...prev, videoId]);
    }
  };

  const handlePlayVideo = (index) => {
    setCurrentVideoIndex(index);
  };

  const handleVideoEnd = (videoId) => {
    handleVideoComplete(videoId);
  };

  const closeVideoPlayer = () => {
    setCurrentVideoIndex(null);
  };

  const handlePick = (letter) => {
    const nextItem = vowels.find((item) => item.letter === letter) ?? vowels[0];
    setSelectedLetter(nextItem.letter);
    setFeedback(`Selected ${nextItem.letter} - ${nextItem.word}.`);
  };

  const speakCurrent = () => {
    speakText(`${selectedItem.letter}, ${selectedItem.sound}`, `Speaking ${selectedItem.letter} sound.`);
  };

  const handleActivityCheck = () => {
    if (!activityChoice) {
      setActivityResult('wrong');
      setActivityMessage('Wrong answer. Choose a letter first.');
      return;
    }

    if (activityChoice !== currentActivity.letter) {
      setActivityResult('wrong');
      setActivityMessage('Wrong answer. Try again.');
      return;
    }

    setActivityResult('correct');
    setActivityMessage('Correct!');
  };

  const handleNextQuestion = () => {
    const nextIndex = activityIndex + 1;

    if (nextIndex >= activityDeck.length) {
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    setActivityIndex(nextIndex);
    setActivityChoice('');
    setActivityResult(null);
    setActivityMessage('Choose the correct vowel.');
  };

  return (
    <div className="module-detail vowels-detail">
      <div className="vowels-topbar">
        <button type="button" className="vowels-back" onClick={onBack}>
          ← BACK TO DASHBOARD
        </button>
      </div>

      <div className="vowels-switch" role="tablist" aria-label="Vowels modes">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'learning'}
          className={mode === 'learning' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('learning')}
        >
          Learning Materials
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'lecture'}
          className={`mode-pill${mode === 'lecture' ? ' active' : ''}${!allVideosWatched ? ' locked' : ''}`}
          onClick={() => {
            if (allVideosWatched) {
              handleModeChange('lecture');
            }
          }}
          disabled={!allVideosWatched}
        >
          Lecture
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'activity'}
          className={mode === 'activity' ? 'mode-pill active' : 'mode-pill'}
          onClick={() => handleModeChange('activity')}
        >
          Activity
        </button>
      </div>

      {mode === 'learning' ? (
        <div className="learning-materials">
          {currentVideoIndex !== null ? (
            <div className="video-player-modal">
              <button
                type="button"
                className="video-close-btn"
                onClick={closeVideoPlayer}
              >
                ✕
              </button>
              <div className="video-player-container">
                <div className="video-player">
                  <video
                    key={`video-${videos[currentVideoIndex].id}`}
                    width="100%"
                    height="100%"
                    controls
                    autoPlay
                    onEnded={() => handleVideoEnd(videos[currentVideoIndex].id)}
                  >
                    <source src={videos[currentVideoIndex].url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="video-player-info">
                  <h3>{videos[currentVideoIndex].title}</h3>
                  <p>{videos[currentVideoIndex].description}</p>
                  <div className="video-watched-notice">
                    <p className="watched-notice-text">
                      ✓ The video will be marked as watched once you finish watching it completely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="learning-header">
                <h3>Learning Materials</h3>
                <p>Watch all videos to unlock Lecture mode</p>
              </div>

              <div className="videos-grid">
                {videos.map((video, index) => (
                  <div key={video.id} className="video-card">
                    <div className="video-thumbnail">
                      <span className="video-icon">🎬</span>
                      {videosWatched.includes(video.id) && (
                        <span className="video-watched-badge">✓ Watched</span>
                      )}
                    </div>
                    <div className="video-info">
                      <h4>{video.title}</h4>
                      <p>{video.description}</p>
                      <span className="video-duration">{video.duration}</span>
                    </div>
                    <button
                      type="button"
                      className={`video-play-btn${videosWatched.includes(video.id) ? ' watched' : ''}`}
                      onClick={() => handlePlayVideo(index)}
                    >
                      ▶ {videosWatched.includes(video.id) ? 'REWATCH' : 'PLAY'}
                    </button>
                  </div>
                ))}
              </div>

              {videosWatched.length > 0 && (
                <div className="learning-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(videosWatched.length / videos.length) * 100}%` }}
                    />
                  </div>
                  <p>
                    {videosWatched.length} of {videos.length} videos watched
                  </p>
                  {allVideosWatched && (
                    <p className="progress-unlocked">
                      ✓ Lecture mode unlocked! Click the Lecture tab to proceed.
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      ) : mode === 'lecture' ? (
        <>
          <div className="vowels-picker" aria-label="Vowel choices">
            {vowels.map((item) => (
              <button
                key={item.letter}
                type="button"
                className={item.letter === selectedLetter ? 'vowel-tile active' : 'vowel-tile'}
                onClick={() => handlePick(item.letter)}
              >
                <span className="vowel-tile-letter">{item.letter}</span>
                <span className="vowel-tile-icon" aria-hidden="true">
                  {item.icon}
                </span>
              </button>
            ))}
          </div>

          <div className="vowels-stage">
            <span className="vowels-letter">{selectedItem.letter}</span>

            <div className="vowels-object">
              <span className="vowels-object-icon" aria-hidden="true">
                {selectedItem.icon}
              </span>
              <p className="vowels-object-word">{selectedItem.word}</p>
              <p className="vowels-object-sound">Sound: "{selectedItem.sound}"</p>
            </div>

            <button type="button" className="vowels-listen" onClick={speakCurrent}>
              🔊 LISTEN TO SOUND
            </button>

            <p className="game-feedback">{feedback}</p>
          </div>
        </>
      ) : (
        <div className="activity-stage">
          <div className="activity-header">
            <h3>Fill in the Missing Vowel</h3>
            <p>Complete the word by adding the correct vowel</p>
          </div>

          <div className="activity-card">
            <span className="activity-card-icon" aria-hidden="true">
              {currentActivity.icon}
            </span>
            <p className="activity-word">{currentActivity.prompt}</p>

            <div className="activity-answer-row" aria-label="Answer selection">
              <div className="activity-letter-box" aria-label="Missing letter answer">
                <span>{activityChoice || '\u00A0'}</span>
              </div>

              <button type="button" className="activity-check" onClick={handleActivityCheck}>
                ✓ CHECK ANSWER
              </button>
            </div>

            <div className="activity-choice-row" role="group" aria-label="Vowel options">
              {currentActivity.choices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  className={choice === activityChoice ? 'activity-choice active' : 'activity-choice'}
                  onClick={() => {
                    setActivityChoice(choice);
                    setActivityResult(null);
                    setActivityMessage('Choose the correct vowel.');
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className={activityResult === 'correct' ? 'activity-result correct' : 'activity-result wrong'} aria-live="polite">
            {activityResult ? activityMessage : ''}
          </div>

          {activityResult === 'correct' ? (
            <button type="button" className="activity-next" onClick={handleNextQuestion}>
              NEXT QUESTION
            </button>
          ) : null}

          <div className="activity-dots" aria-label="Activity progress">
            {activityDeck.map((item, index) => (
              <span key={item.letter} className={index === activityIndex ? 'activity-dot active' : 'activity-dot'} />
            ))}
          </div>

          <p className="game-feedback">{activityResult ? '' : activityMessage}</p>
        </div>
      )}
    </div>
  );
}
