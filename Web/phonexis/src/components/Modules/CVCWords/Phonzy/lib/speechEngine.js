/**
 * Thin wrapper around the Web Speech API's SpeechRecognition, isolated so
 * it can be swapped for a cloud speech/pronunciation service later without
 * touching the game screens.
 */

function getRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionAvailable() {
  return !!getRecognitionCtor();
}

/**
 * Runs one speech recognition pass and resolves with the best transcript.
 * Never rejects on recognition-level issues (no-speech, aborted, etc.) —
 * instead resolves with `{ unavailable: true, reason }` so callers can fall
 * back to audio-only scoring.
 *
 * @param {Object} options
 * @param {string} [options.language]
 * @param {number} [options.maxDurationMs]
 * @param {{ current: () => void }} [options.stopHandle] populated with a manual stop() function
 */
export function recognizeSpeech(options = {}) {
  const { language = 'en-US', maxDurationMs = 6000, stopHandle } = options;
  const RecognitionCtor = getRecognitionCtor();

  if (!RecognitionCtor) {
    return Promise.resolve({ unavailable: true, reason: 'unsupported' });
  }

  return new Promise((resolve) => {
    const recognition = new RecognitionCtor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;

    let settled = false;
    const timeoutId = setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        // ignore
      }
    }, maxDurationMs);

    const finish = (payload) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      resolve(payload);
    };

    recognition.onresult = (event) => {
      const result = event.results[0];
      const alternatives = Array.from(result).map((alt) => ({
        transcript: alt.transcript,
        confidence: typeof alt.confidence === 'number' && !Number.isNaN(alt.confidence) ? alt.confidence : null,
      }));
      finish({ unavailable: false, alternatives });
    };

    recognition.onerror = (event) => {
      finish({ unavailable: true, reason: event.error || 'error' });
    };

    recognition.onend = () => {
      finish({ unavailable: true, reason: 'no-speech' });
    };

    if (stopHandle) {
      stopHandle.current = () => {
        try {
          recognition.stop();
        } catch {
          // ignore
        }
      };
    }

    try {
      recognition.start();
    } catch (err) {
      finish({ unavailable: true, reason: err.name || 'start-error' });
    }
  });
}

export function speak(word, { language = 'en-US', rate = 0.85, onEnd, onError } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onError) onError('Speech playback is not available in this browser.');
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = language;
  utterance.rate = rate;
  utterance.pitch = 1;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = () => onError('Could not play the pronunciation guide.');
  window.speechSynthesis.speak(utterance);
}
