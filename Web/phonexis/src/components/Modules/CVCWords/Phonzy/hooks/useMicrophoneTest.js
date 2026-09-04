import { useCallback, useEffect, useRef, useState } from 'react';
import { requestMicrophoneStream, createLevelMeter, stopStreamTracks, isMicrophoneApiAvailable } from '../lib/audioAnalyzer';

/**
 * Standalone microphone "sound check" used on the Home screen so players
 * can confirm their mic works before starting a level.
 */
export function useMicrophoneTest() {
  const [status, setStatus] = useState('idle'); // idle | testing | ok | denied | unavailable | error
  const [level, setLevel] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const streamRef = useRef(null);
  const meterRef = useRef(null);
  const mountedRef = useRef(true);

  const stopTest = useCallback(() => {
    if (meterRef.current) {
      meterRef.current.stop();
      meterRef.current = null;
    }
    stopStreamTracks(streamRef.current);
    streamRef.current = null;
    setLevel(0);
  }, []);

  useEffect(
    () => () => {
      mountedRef.current = false;
      stopTest();
    },
    [stopTest],
  );

  const startTest = useCallback(async () => {
    if (!isMicrophoneApiAvailable()) {
      setStatus('unavailable');
      setErrorMessage('This browser does not support microphone access.');
      return;
    }

    setStatus('testing');
    setErrorMessage('');

    try {
      const { stream } = await requestMicrophoneStream();
      if (!mountedRef.current) {
        stopStreamTracks(stream);
        return;
      }
      streamRef.current = stream;
      setStatus('ok');
      meterRef.current = createLevelMeter(stream, (rms) => {
        if (mountedRef.current) setLevel(rms);
      });
    } catch (err) {
      if (!mountedRef.current) return;
      setStatus(err.reason === 'NotAllowedError' || err.reason === 'PermissionDeniedError' ? 'denied' : 'error');
      setErrorMessage(err.message);
    }
  }, []);

  return { status, level, errorMessage, startTest, stopTest };
}
