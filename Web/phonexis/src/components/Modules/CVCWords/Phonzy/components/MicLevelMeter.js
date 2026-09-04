/** Small animated bar meter that visualizes live microphone RMS level (0-1). */
export default function MicLevelMeter({ level = 0, bars = 12 }) {
  const active = Math.round(clamp01(level * 3.2) * bars);

  return (
    <div className="phonzy-level-meter" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className={i < active ? 'phonzy-level-bar active' : 'phonzy-level-bar'}
          style={{ '--bar-index': i }}
        />
      ))}
    </div>
  );
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}
