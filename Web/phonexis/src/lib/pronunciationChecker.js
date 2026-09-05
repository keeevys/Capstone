const getSpeechRecognition = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition;
};

const getVoiceSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('phonexis_voice_settings') || '{}');
  } catch (storageError) {
    return {};
  }
};

export function startPronunciationSession(targetWord, language = 'en-US', options = {}) {
  const SpeechRecognition = getSpeechRecognition();
  const target = normalizeText(targetWord);
  const settings = getVoiceSettings();
  const threshold = options.threshold ?? (Number(settings.threshold) || 75);

  if (!SpeechRecognition) {
    return {
      promise: Promise.reject(new Error('Speech Recognition is not supported in this browser.')),
      stop: () => {},
    };
  }

  let settled = false;
  let recognition;
  let timeoutId;
  let resolveResult;
  let rejectResult;
  const promise = new Promise((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const finish = (result, error) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    if (error) rejectResult(error);
    else resolveResult(result);
  };

  const buildResult = (recognizedText) => {
    const recognized = normalizeText(recognizedText);
    const accuracy = calculateSimilarity(recognized, target);
    const success = accuracy >= threshold / 100;
    return {
      success,
      accuracy: Math.round(accuracy * 100),
      recognized,
      target,
      feedback: generateFeedback(success, recognized, target, accuracy),
    };
  };

  recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onresult = (event) => finish(buildResult(event.results[0][0].transcript));
  recognition.onerror = (event) => {
    if (event.error !== 'aborted') finish(null, new Error(`Speech recognition error: ${event.error}`));
  };
  recognition.onend = () => {
    if (!settled) finish(buildResult(''));
  };

  try {
    recognition.start();
  } catch (error) {
    finish(null, error);
  }

  timeoutId = setTimeout(() => {
    try {
      recognition.stop();
    } catch (error) {
      finish(null, error);
    }
  }, options.timeout ?? 5000);

  return {
    promise,
    stop: () => {
      try {
        recognition.stop();
      } catch (error) {
        finish(null, error);
      }
    },
  };
}

export function startPronunciationCheck(targetWord, language = 'en-US', options = {}) {
  return startPronunciationSession(targetWord, language, options).promise;
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  if (str1.includes(str2) || str2.includes(str1)) {
    return Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
  }

  const matrix = Array.from({ length: str2.length + 1 }, (_, index) => [index]);
  for (let index = 0; index <= str1.length; index += 1) matrix[0][index] = index;
  for (let row = 1; row <= str2.length; row += 1) {
    for (let column = 1; column <= str1.length; column += 1) {
      matrix[row][column] = str2[row - 1] === str1[column - 1]
        ? matrix[row - 1][column - 1]
        : Math.min(matrix[row - 1][column - 1] + 1, matrix[row][column - 1] + 1, matrix[row - 1][column] + 1);
    }
  }
  return 1 - matrix[str2.length][str1.length] / Math.max(str1.length, str2.length);
}

function generateFeedback(isCorrect, recognized, target, accuracy) {
  if (isCorrect) {
    if (accuracy >= 0.95) return 'Perfect pronunciation!';
    if (accuracy >= 0.85) return 'Great job! Very close!';
    return 'Good effort! Close enough!';
  }
  if (!recognized) return `I could not hear "${target}". Please try again.`;
  return `You said "${recognized}". Try to say "${target}" more clearly.`;
}
