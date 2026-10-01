import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, ArrowLeft, Play, Pause,
  Volume2, VolumeX, Type, Gauge, Guitar, Drum,
} from 'lucide-react';
import { transposeChord } from '../utils/chordUtils';
import { KNOWN_CUES } from '../utils/constants';

export default function Performance({ lineUp, currentIndex, onNextSong, onPrevSong, onExit }) {
  const [transpose, setTranspose] = useState(0);
  const [fontSize, setFontSize] = useState(18);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [isPlaying, setIsPlaying] = useState(false);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [showCues, setShowCues] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [toast, setToast] = useState('');

  const containerRef = useRef(null);
  const audioContextRef = useRef(null);
  const sectionNodeRefs = useRef({});

  const currentSong = lineUp[currentIndex];
  const nextSong = currentIndex < lineUp.length - 1 ? lineUp[currentIndex + 1] : null;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 1600);
    return () => clearTimeout(t);
  }, [toast]);

  const togglePlay = () => {
    setIsPlaying(p => {
      const next = !p;
      setToast(next ? 'Auto-scroll on' : 'Auto-scroll paused');
      return next;
    });
  };

  // Reset per-song state on song change
  useEffect(() => {
    setTranspose(0);
    setIsPlaying(false);
    setScrollProgress(0);
    setAtEnd(false);
    setActiveSectionId(currentSong?.sections?.[0]?.id ?? null);
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [currentSong?.id]);

  useEffect(() => {
    if (isPlaying && containerRef.current) {
      const interval = setInterval(() => {
        containerRef.current.scrollTop += scrollSpeed;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying, scrollSpeed]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const max = scrollHeight - clientHeight;
      const progress = max > 0 ? Math.min(100, (scrollTop / max) * 100) : 100;
      setScrollProgress(progress);
      setAtEnd(progress >= 98);
    };
    handleScroll();
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [currentSong?.id]);

  // Track which section is active based on scroll position
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !currentSong) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSectionId(Number(entry.target.dataset.sectionId));
        });
      },
      { root: el, rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );
    Object.values(sectionNodeRefs.current).forEach(node => node && observer.observe(node));
    return () => observer.disconnect();
  }, [currentSong?.id]);

  const scrollToSection = (sectionId) => {
    const node = sectionNodeRefs.current[sectionId];
    if (node && containerRef.current) {
      containerRef.current.scrollTo({ top: node.offsetTop - 12, behavior: 'smooth' });
      setActiveSectionId(sectionId);
    }
  };

  const playMetronome = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }, []);

  useEffect(() => {
    if (metronomeOn && currentSong?.bpm) {
      const beatDuration = (60 / currentSong.bpm) * 1000;
      const interval = setInterval(playMetronome, beatDuration);
      return () => clearInterval(interval);
    }
  }, [metronomeOn, currentSong?.bpm, playMetronome]);

  if (!currentSong) return null;

  const hasNext = currentIndex < lineUp.length - 1;

  return (
    <div className="performance-container">
      {toast && <div className="toast">{toast}</div>}

      <div className="performance-header">
        <button className="btn-icon" onClick={onExit} title="Exit">
          <ArrowLeft size={22} />
        </button>
        <div className="performance-title">
          <h1>{currentSong.title}</h1>
          <p>{currentSong.artist} • Key {transpose !== 0 ? (
            <span className="transposed-key">{transposeChord(currentSong.key, transpose)}</span>
          ) : currentSong.key} • {currentSong.bpm} BPM</p>
        </div>
        <button className="btn-play" onClick={togglePlay} title={isPlaying ? 'Pause auto-scroll' : 'Play auto-scroll'}>
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
      </div>

      {currentSong.sections?.length > 1 && (
        <div className="section-nav">
          {currentSong.sections.map(section => (
            <button
              key={section.id}
              className={`section-pill ${activeSectionId === section.id ? 'active' : ''}`}
              onClick={() => scrollToSection(section.id)}
            >
              {section.name}
            </button>
          ))}
        </div>
      )}

      <div className="performance-main">
        <div className="progress-track">
          <div className="progress-dot" style={{ top: `${scrollProgress}%` }} />
        </div>

        <div className="performance-content" ref={containerRef} style={{ fontSize: `${fontSize}px` }}>
          {currentSong.sections?.map(section => (
            <div
              key={section.id}
              className="perf-section"
              data-section-id={section.id}
              ref={(node) => { sectionNodeRefs.current[section.id] = node; }}
            >
              <h2 className="perf-section-title">{section.name}</h2>
              {section.lines?.length === 0 && <p className="empty-state">No lyrics in this section.</p>}
              {section.lines?.map(line => (
                <div key={line.id} className={`perf-line ${line.gapBefore ? 'perf-line-gap' : ''}`}>
                  <div className="perf-words">
                    {line.words?.map(word => (
                      <div key={word.id} className="perf-word">
                        <div className="perf-word-top">
                          {showCues && word.cue && (
                            KNOWN_CUES.includes(word.cue)
                              ? <span className={`cue-dot cue-${word.cue}`} />
                              : <span className="cue-custom">{word.cue}</span>
                          )}
                          {showChords && word.chord && <span className="chord">{transposeChord(word.chord, transpose)}</span>}
                        </div>
                        <div className="lyric">{word.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="performance-controls">
        <div className="control-group control-slider">
          <label><Gauge size={13} /></label>
          <input
            type="range" min="1" max="8" step="0.5" value={scrollSpeed}
            onChange={(e) => setScrollSpeed(parseFloat(e.target.value))}
          />
        </div>

        <div className="control-group control-slider">
          <button className="btn-flat" onClick={() => setTranspose(t => Math.max(-11, t - 1))}>♭</button>
          <input
            type="range" min="-11" max="11" step="1" value={transpose}
            onChange={(e) => setTranspose(parseInt(e.target.value))}
          />
          <button className="btn-sharp" onClick={() => setTranspose(t => Math.min(11, t + 1))}>♯</button>
        </div>

        <div className="control-group control-slider">
          <label><Type size={13} /></label>
          <input
            type="range" min="12" max="36" step="1" value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
          />
        </div>

        <button
          className={`btn-icon ${metronomeOn ? 'active' : ''}`}
          onClick={() => setMetronomeOn(!metronomeOn)}
          title="Metronome"
        >
          {metronomeOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          className={`btn-icon ${showChords ? 'active' : ''}`}
          onClick={() => setShowChords(v => !v)}
          title={showChords ? 'Hide chords' : 'Show chords'}
        >
          <Guitar size={18} />
        </button>

        <button
          className={`btn-icon ${showCues ? 'active' : ''}`}
          onClick={() => setShowCues(v => !v)}
          title={showCues ? 'Hide cues' : 'Show cues'}
        >
          <Drum size={18} />
        </button>
      </div>

      <div className="performance-footer">
        <button className="btn-icon" onClick={onPrevSong} disabled={currentIndex === 0}>
          <ChevronLeft size={22} />
        </button>
        <div className="song-counter">{currentIndex + 1} / {lineUp.length}</div>
        <div className="next-song-preview">{nextSong ? `Next: ${nextSong.title}` : 'Last song'}</div>
        <button
          className={`btn-icon ${atEnd && hasNext ? 'flash' : ''}`}
          onClick={onNextSong}
          disabled={!hasNext}
        >
          <ChevronRight size={22} />
        </button>
      </div>
    </div>
  );
}
