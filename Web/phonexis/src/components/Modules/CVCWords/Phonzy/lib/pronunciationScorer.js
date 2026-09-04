import { phoneticSimilarity, textSimilarity } from './phonemeUtils';

/**
 * Combines speech-recognition results with raw audio-energy metrics into a
 * single 0-100 pronunciation score. Deliberately does NOT rely on exact
 * text matching alone: phonetic similarity is blended with recognizer
 * confidence and voice/audio quality signals (silence, background noise).
 *
 * Structured so a future upgrade (real phoneme aligner / cloud pronunciation
 * API) only needs to replace `phoneticSimilarity` or feed richer
 * `recognition` data — the blending + banding logic stays the same.
 */

export const SCORE_BANDS = [
  { min: 90, key: 'excellent', label: 'Excellent', emoji: '✅' },
  { min: 75, key: 'good', label: 'Good', emoji: '✅' },
  { min: 60, key: 'needs-improvement', label: 'Needs Improvement', emoji: '🔄' },
  { min: 0, key: 'incorrect', label: 'Incorrect', emoji: '❌' },
];

export function getBand(score) {
  return SCORE_BANDS.find((band) => score >= band.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1];
}

export const PASS_THRESHOLD = 60;

/**
 * @param {string} targetWord
 * @param {{unavailable: boolean, reason?: string, alternatives?: {transcript: string, confidence: number|null}[]}} recognition
 * @param {{durationMs: number, peakRMS: number, avgRMS: number, silenceRatio: number, hasSound: boolean, speechDurationMs: number}} audioMetrics
 */
export function scorePronunciation(targetWord, recognition, audioMetrics) {
  const best = recognition && !recognition.unavailable ? recognition.alternatives?.[0] : null;
  const transcript = (best?.transcript || '').trim();

  // The recognizer captures the microphone independently of our local energy
  // meter (a separate getUserMedia stream). If it actually returned text,
  // that's ground truth that speech was heard — trust it even if the energy
  // meter (tuned for silence/noise detection, not as a hard gate) disagreed.
  if (transcript) {
    return scoreFromRecognition(targetWord, recognition, best, transcript, audioMetrics);
  }

  // No recognized text. Only now fall back to the energy meter to tell
  // silence apart from "heard something, couldn't make out words".
  if (!audioMetrics || !audioMetrics.hasSound) {
    return buildResult({
      score: 0,
      targetWord,
      transcript: '',
      issue: 'silence',
      title: 'We couldn\'t hear you',
      message: 'No voice was detected. Check that your microphone is unmuted and try speaking closer to it.',
    });
  }

  return scoreFromAudioOnly(targetWord, recognition, audioMetrics);
}

function scoreFromRecognition(targetWord, recognition, best, transcript, audioMetrics) {
  const metrics = audioMetrics || { silenceRatio: 0, hasSound: true, durationMs: 0, speechDurationMs: 0 };

  // Best phonetic/text match across all recognizer alternatives.
  let bestPhonetic = 0;
  let bestText = 0;
  let bestTranscript = transcript;
  for (const alt of recognition.alternatives) {
    const p = phoneticSimilarity(targetWord, alt.transcript);
    const t = textSimilarity(targetWord, alt.transcript);
    if (p > bestPhonetic) {
      bestPhonetic = p;
      bestTranscript = alt.transcript;
    }
    bestText = Math.max(bestText, t);
  }

  const confidence = typeof best.confidence === 'number' ? best.confidence : 0.7;
  const audioQuality = audioQualityScore(metrics, targetWord);

  const blended =
    0.6 * bestPhonetic +
    0.25 * confidence +
    0.15 * audioQuality;

  const textBoost = bestText >= 0.98 ? 0.05 : 0;
  const score = Math.round(clamp01(blended + textBoost) * 100);

  const issue = metrics.silenceRatio > 0.55 && score < PASS_THRESHOLD ? 'background-noise' : null;

  return buildResult({
    score,
    targetWord,
    transcript: bestTranscript,
    issue,
    breakdown: {
      phoneticSimilarity: round2(bestPhonetic),
      recognitionConfidence: round2(confidence),
      audioQuality: round2(audioQuality),
    },
    ...feedbackFor(score, targetWord, bestTranscript, issue),
  });
}

function scoreFromAudioOnly(targetWord, recognition, audioMetrics) {
  // Rough heuristic: does spoken duration look plausible for this word,
  // and was the voice clear (little silence inside the attempt)?
  const expectedMs = estimateExpectedDurationMs(targetWord);
  const spokenMs = audioMetrics.speechDurationMs || audioMetrics.durationMs;
  const durationRatio = expectedMs > 0 ? Math.min(spokenMs, expectedMs) / Math.max(spokenMs, expectedMs) : 0.5;
  const clarity = clamp01(1 - audioMetrics.silenceRatio);

  const estimate = clamp01(0.5 * durationRatio + 0.5 * clarity);
  // Cap audio-only scores below "Excellent" since content was never verified.
  const score = Math.min(88, Math.round(estimate * 100));
  const reason = recognition?.reason || 'unsupported';

  const message =
    reason === 'unsupported'
      ? "Your browser doesn't support full speech recognition, so this score is based on voice clarity only. Try Chrome for full pronunciation checking."
      : "We couldn't quite catch what you said, so this score is based on voice clarity only. Speak a little louder and more clearly, closer to the microphone.";

  return buildResult({
    score,
    targetWord,
    transcript: '',
    issue: 'no-recognition',
    breakdown: { phoneticSimilarity: null, recognitionConfidence: null, audioQuality: round2(clarity) },
    title: score >= PASS_THRESHOLD ? 'Voice detected' : 'Try again',
    message,
  });
}

function audioQualityScore(metrics, targetWord) {
  const expectedMs = estimateExpectedDurationMs(targetWord);
  const spokenMs = metrics.speechDurationMs || metrics.durationMs;
  const durationRatio = expectedMs > 0 ? Math.min(spokenMs, expectedMs * 1.6) / Math.max(expectedMs * 0.4, spokenMs, 1) : 0.7;
  const clarity = clamp01(1 - metrics.silenceRatio * 0.6);
  return clamp01(0.5 * clamp01(durationRatio) + 0.5 * clarity);
}

function estimateExpectedDurationMs(word) {
  const letters = String(word || '').replace(/[^a-z]/gi, '').length;
  return Math.max(350, letters * 130);
}

function feedbackFor(score, targetWord, transcript, issue) {
  const band = getBand(score);

  if (issue === 'background-noise') {
    return {
      title: `${band.emoji} ${band.label}`,
      message: `We heard some background noise. You said "${transcript}" — try again somewhere quieter for a better score.`,
    };
  }

  if (band.key === 'excellent') {
    return { title: `${band.emoji} Excellent!`, message: `Perfect! "${transcript}" sounded just like "${targetWord}".` };
  }
  if (band.key === 'good') {
    return { title: `${band.emoji} Good job!`, message: `Nice work! You said "${transcript}", very close to "${targetWord}".` };
  }
  if (band.key === 'needs-improvement') {
    return {
      title: `${band.emoji} Needs Improvement`,
      message: `Getting there! You said "${transcript}". Listen again and try to match "${targetWord}" more closely.`,
    };
  }
  return {
    title: `${band.emoji} Incorrect`,
    message: `You said "${transcript}", but the target word is "${targetWord}". Listen to it and try again.`,
  };
}

function buildResult({ score, targetWord, transcript, issue, breakdown, title, message }) {
  const band = getBand(score);
  return {
    score,
    band: band.key,
    bandLabel: band.label,
    passed: score >= PASS_THRESHOLD,
    targetWord,
    transcript,
    issue: issue || null,
    breakdown: breakdown || null,
    title,
    message,
  };
}

function clamp01(value) {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}
