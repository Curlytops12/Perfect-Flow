import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function TuningForkIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v7a4 4 0 0 0 8 0V2" />
      <line x1="12" y1="13" x2="12" y2="22" />
    </svg>
  );
}

function frequencyFromNoteNumber(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function noteFromPitch(frequency) {
  return Math.round(12 * (Math.log(frequency / 440) / Math.log(2))) + 69;
}

function centsOffFromPitch(frequency, note) {
  return Math.floor(1200 * (Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2)));
}

// Autocorrelation-based pitch detection (ACF2+)
function autoCorrelate(buf, sampleRate) {
  const SIZE = buf.length;
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  const thresh = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thresh) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thresh) { r2 = SIZE - i; break; }
  }
  const trimmed = buf.slice(r1, r2);
  const newSize = trimmed.length;

  const c = new Array(newSize).fill(0);
  for (let i = 0; i < newSize; i++) {
    for (let j = 0; j < newSize - i; j++) c[i] += trimmed[j] * trimmed[j + i];
  }

  let d = 0;
  while (d < newSize - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < newSize; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  if (T0 <= 0) return -1;

  const x1 = c[T0 - 1] || 0, x2 = c[T0] || 0, x3 = c[T0 + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

export default function Tuner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [reading, setReading] = useState(null);

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const bufRef = useRef(null);
  const lastUpdateRef = useRef(0);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    setReading(null);
  }, []);

  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const audioCtx = audioCtxRef.current;
    if (!analyser || !audioCtx) return;
    analyser.getFloatTimeDomainData(bufRef.current);
    const freq = autoCorrelate(bufRef.current, audioCtx.sampleRate);
    const now = performance.now();
    if (now - lastUpdateRef.current > 100) {
      lastUpdateRef.current = now;
      if (freq && freq > 0) {
        const note = noteFromPitch(freq);
        const cents = centsOffFromPitch(freq, note);
        setReading({
          name: NOTE_STRINGS[((note % 12) + 12) % 12],
          octave: Math.floor(note / 12) - 1,
          cents,
          frequency: freq,
        });
      } else {
        setReading(null);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      setError('Microphone access was denied or unavailable. Allow mic access in your browser settings to use the tuner.');
    }
  }, [tick]);

  useEffect(() => {
    if (open) start();
    else stop();
    return stop;
  }, [open, start, stop]);

  const cents = reading ? reading.cents : 0;
  const inTune = !!reading && Math.abs(cents) <= 5;
  const needleDeg = Math.max(-45, Math.min(45, (cents / 50) * 45));

  return (
    <>
      <button className="tuner-fab" onClick={() => setOpen(true)} title="Tuner">
        <TuningForkIcon size={20} />
      </button>

      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-content tuner-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-icon donation-close" onClick={() => setOpen(false)} title="Close">
              <X size={18} />
            </button>
            <h2>Chromatic Tuner</h2>

            {error ? (
              <p className="tuner-error">{error}</p>
            ) : (
              <div className="tuner-display">
                <div className="tuner-needle-wrap">
                  <div className="tuner-needle" style={{ transform: `rotate(${needleDeg}deg)` }} />
                  <div className="tuner-needle-base" />
                </div>
                <div className={`tuner-note ${inTune ? 'in-tune' : ''}`}>
                  {reading ? `${reading.name}${reading.octave}` : '—'}
                </div>
                <div className="tuner-cents">
                  {reading ? `${cents > 0 ? '+' : ''}${cents} cents` : 'Play a note…'}
                </div>
                <div className="tuner-freq">{reading ? `${reading.frequency.toFixed(1)} Hz` : ' '}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
