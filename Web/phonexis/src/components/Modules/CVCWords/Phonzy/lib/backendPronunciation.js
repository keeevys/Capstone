import { checkBackendPronunciation } from '../../../../../lib/supabaseClient';

const BACKEND_TIMEOUT_MS = 4000;

function withTimeout(promise, ms) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    }).catch(() => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

/**
 * Sends the recognized transcript to the backend for an independent
 * pronunciation check + persistence. Resolves `null` (never rejects) if the
 * backend is unreachable, slow, or returns an error — callers should treat
 * that as "no server verification available this time" and keep using the
 * local score, not as a game-breaking failure.
 *
 * @param {Object} params
 * @param {number|string|null} params.userId
 * @param {string} params.levelId
 * @param {string} params.targetWord
 * @param {string} params.transcript
 * @param {{transcript: string, confidence: number|null}[]|null} params.alternatives
 * @param {number|null} params.confidence
 * @param {number|null} params.audioQuality
 * @returns {Promise<{score:number, band:string, passed:boolean, transcript:string, targetWord:string, title:string, message:string}|null>}
 */
export async function verifyPronunciationOnBackend({ userId, levelId, targetWord, transcript, alternatives, confidence, audioQuality }) {
  const payload = {
    userId: userId ?? null,
    levelId: levelId ?? null,
    targetWord,
    transcript,
    alternatives: Array.isArray(alternatives)
      ? alternatives.map((alt) => ({ transcript: alt.transcript, confidence: alt.confidence ?? null }))
      : null,
    confidence,
    audioQuality,
  };

  const result = await withTimeout(checkBackendPronunciation(payload), BACKEND_TIMEOUT_MS);
  if (!result || result.error || !result.data) return null;

  return result.data;
}
