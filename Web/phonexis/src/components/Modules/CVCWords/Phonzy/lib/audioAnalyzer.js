/**
 * Web Audio API helpers: microphone access, live level metering, and
 * energy-based recording metrics (silence / background noise detection).
 *
 * Kept independent of speech recognition so audio-quality signals can feed
 * the pronunciation scorer even in browsers without SpeechRecognition.
 */

const SILENCE_RMS = 0.012;
const SPEECH_ONSET_RMS = 0.03;

export function isMicrophoneApiAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}

/**
 * Requests microphone access and classifies failures into user-facing reasons.
 * @returns {Promise<{stream: MediaStream}>}
 */
export async function requestMicrophoneStream() {
  if (!isMicrophoneApiAvailable()) {
    const error = new Error('This browser does not support microphone access.');
    error.reason = 'unsupported';
    throw error;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return { stream };
  } catch (err) {
    const error = new Error(classifyMicError(err));
    error.reason = err.name || 'unknown';
    throw error;
  }
}

function classifyMicError(err) {
  switch (err.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Microphone access was denied. Please allow microphone permission and try again.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found on this device. Connect a microphone and try again.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your microphone is busy or unavailable right now. Close other apps using it and try again.';
    default:
      return `Could not access the microphone (${err.message || err.name}).`;
  }
}

/**
 * Creates a live level meter over a MediaStream. Call `stop()` to release
 * the audio graph (does NOT stop the underlying stream tracks).
 * @param {MediaStream} stream
 * @param {(rms: number) => void} onLevel called on every animation frame with RMS in [0,1]
 */
export function createLevelMeter(stream, onLevel) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const buffer = new Float32Array(analyser.fftSize);
  let rafId = null;
  let running = true;

  const tick = () => {
    if (!running) return;
    analyser.getFloatTimeDomainData(buffer);
    let sumSquares = 0;
    for (let i = 0; i < buffer.length; i += 1) {
      sumSquares += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    onLevel(rms);
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return {
    stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      try {
        source.disconnect();
      } catch {
        // already disconnected
      }
      audioContext.close().catch(() => {});
    },
  };
}

/**
 * Records energy metrics from a MediaStream until either silence is
 * detected after speech, or maxDurationMs elapses. Resolves with metrics
 * used by the pronunciation scorer to detect no-speech / background noise.
 *
 * @param {MediaStream} stream
 * @param {Object} options
 * @param {number} [options.maxDurationMs]
 * @param {number} [options.silenceHangoverMs] time of continuous silence after speech onset before auto-stopping
 * @param {(rms: number) => void} [options.onLevel]
 * @param {{ current: () => void }} [options.stopHandle] object populated with a manual stop() function
 */
export function recordAndAnalyze(stream, options = {}) {
  const {
    maxDurationMs = 6000,
    silenceHangoverMs = 1100,
    onLevel,
    stopHandle,
  } = options;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  const audioContext = new AudioContextClass();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const buffer = new Float32Array(analyser.fftSize);
  const samples = [];
  const startTime = performance.now();
  let speechStartedAt = null;
  let lastLoudAt = null;

  return new Promise((resolve) => {
    let rafId = null;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (rafId) cancelAnimationFrame(rafId);
      try {
        source.disconnect();
      } catch {
        // already disconnected
      }
      audioContext.close().catch(() => {});

      const durationMs = performance.now() - startTime;
      const rmsValues = samples.map((s) => s.rms);
      const peakRMS = rmsValues.length ? Math.max(...rmsValues) : 0;
      const avgRMS = rmsValues.length ? rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length : 0;
      const loudSamples = rmsValues.filter((v) => v >= SILENCE_RMS).length;
      const silenceRatio = rmsValues.length ? 1 - loudSamples / rmsValues.length : 1;
      const hasSound = peakRMS >= SPEECH_ONSET_RMS;
      const speechDurationMs = speechStartedAt && lastLoudAt ? lastLoudAt - speechStartedAt : 0;

      resolve({
        durationMs,
        peakRMS,
        avgRMS,
        silenceRatio,
        hasSound,
        speechDurationMs,
      });
    };

    if (stopHandle) {
      stopHandle.current = finish;
    }

    const tick = () => {
      analyser.getFloatTimeDomainData(buffer);
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i += 1) {
        sumSquares += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sumSquares / buffer.length);
      const now = performance.now();
      samples.push({ t: now - startTime, rms });

      if (onLevel) onLevel(rms);

      if (rms >= SPEECH_ONSET_RMS) {
        if (speechStartedAt === null) speechStartedAt = now;
        lastLoudAt = now;
      }

      const elapsed = now - startTime;
      const silentTooLong = speechStartedAt !== null && lastLoudAt !== null && now - lastLoudAt >= silenceHangoverMs;

      if (elapsed >= maxDurationMs || silentTooLong) {
        finish();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  });
}

export function stopStreamTracks(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}
