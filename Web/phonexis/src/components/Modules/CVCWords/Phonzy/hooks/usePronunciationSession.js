import { useCallback, useEffect, useRef, useState } from 'react';
import { requestMicrophoneStream, recordAndAnalyze, stopStreamTracks } from '../lib/audioAnalyzer';
import { recognizeSpeech, isSpeechRecognitionAvailable } from '../lib/speechEngine';
import { scorePronunciation } from '../lib/pronunciationScorer';
import { verifyPronunciationOnBackend } from '../lib/backendPronunciation';

/**
 * Orchestrates one pronunciation attempt: microphone permission, live level
 * metering, concurrent speech recognition + audio-energy analysis, and
 * final scoring. The mic stream is requested once and reused across
 * attempts within a game session to avoid repeated permission prompts.
 *
 * After the local (client-only) score is computed, the recognized
 * transcript is also sent to the backend so it can independently confirm
 * whether the pronunciation was correct and persist the attempt. The local
 * score is what keeps the game playable offline / when the backend is
 * unreachable — the backend result, when it arrives in time, overrides it.
 *
 * @param {number|string|null} [backendUserId] backend user id used to persist attempts server-side
 */
export function usePronunciationSession(backendUserId) {
  const [status, setStatus] = useState('idle'); // idle | requesting | listening | analyzing | result | error
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState(null);
  const [micError, setMicError] = useState(null);

  const streamRef = useRef(null);
  const stopHandleRef = useRef({ current: null });
  const recognitionStopRef = useRef({ current: null });
  const mountedRef = useRef(true);
  const attemptTokenRef = useRef(0);

  useEffect(
    () => () => {
      mountedRef.current = false;
      stopStreamTracks(streamRef.current);
    },
    [],
  );

  const ensureStream = useCallback(async () => {
    if (streamRef.current && streamRef.current.active) {
      return streamRef.current;
    }
    setStatus('requesting');
    const { stream } = await requestMicrophoneStream();
    streamRef.current = stream;
    return stream;
  }, []);

  const startAttempt = useCallback(
    async (targetWord, levelId) => {
      const attemptToken = attemptTokenRef.current + 1;
      attemptTokenRef.current = attemptToken;

      setMicError(null);
      setResult(null);
      setLevel(0);

      let stream;
      try {
        stream = await ensureStream();
      } catch (err) {
        if (!mountedRef.current) return;
        setMicError({ message: err.message, reason: err.reason });
        setStatus('error');
        return;
      }

      if (!mountedRef.current) return;
      setStatus('listening');

      const analyzePromise = recordAndAnalyze(stream, {
        maxDurationMs: 6000,
        silenceHangoverMs: 1100,
        onLevel: (rms) => {
          if (mountedRef.current) setLevel(rms);
        },
        stopHandle: stopHandleRef.current,
      });

      const recognizePromise = isSpeechRecognitionAvailable()
        ? recognizeSpeech({ maxDurationMs: 6000, stopHandle: recognitionStopRef.current })
        : Promise.resolve({ unavailable: true, reason: 'unsupported' });

      const [audioMetrics, recognition] = await Promise.all([analyzePromise, recognizePromise]);

      if (!mountedRef.current) return;
      setStatus('analyzing');
      setLevel(0);

      const scored = scorePronunciation(targetWord, recognition, audioMetrics);

      if (!mountedRef.current) return;
      // `attemptId` lets consumers dedupe this attempt even after the object
      // below is later replaced with a backend-augmented copy (same attempt,
      // new reference) — don't rely on object identity for that.
      // `backendCheckStatus`: 'skipped' (nothing to verify) | 'pending' |
      // 'done' | 'unavailable' (backend never answered in time).
      const hasTranscript = !!scored.transcript;
      setResult({
        ...scored,
        attemptId: attemptToken,
        backendCheck: null,
        backendCheckStatus: hasTranscript ? 'pending' : 'skipped',
      });
      setStatus('result');

      // Ask the backend to independently confirm correctness and persist the
      // attempt. Never blocks the UI, and never rewrites the score/pass
      // verdict already shown/tallied — it's attached as a secondary,
      // clearly-labeled confirmation so a late/slow backend can't cause a
      // confusing mid-air flip of what the player already saw happen.
      if (hasTranscript) {
        verifyPronunciationOnBackend({
          userId: backendUserId,
          levelId,
          targetWord,
          transcript: scored.transcript,
          alternatives: recognition && !recognition.unavailable ? recognition.alternatives : null,
          confidence: scored.breakdown?.recognitionConfidence ?? null,
          audioQuality: scored.breakdown?.audioQuality ?? null,
        }).then((verified) => {
          if (!mountedRef.current || attemptTokenRef.current !== attemptToken) return;
          setResult((current) => (
            current && current.attemptId === attemptToken
              ? {
                ...current,
                backendCheck: verified,
                backendCheckStatus: verified ? 'done' : 'unavailable',
              }
              : current
          ));
        });
      }
    },
    [ensureStream, backendUserId],
  );

  const stopAttempt = useCallback(() => {
    if (stopHandleRef.current.current) stopHandleRef.current.current();
    if (recognitionStopRef.current.current) recognitionStopRef.current.current();
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setMicError(null);
    setLevel(0);
  }, []);

  const releaseMicrophone = useCallback(() => {
    stopStreamTracks(streamRef.current);
    streamRef.current = null;
  }, []);

  return {
    status,
    level,
    result,
    micError,
    startAttempt,
    stopAttempt,
    reset,
    releaseMicrophone,
    speechSupported: isSpeechRecognitionAvailable(),
  };
}
