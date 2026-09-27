import React from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';

export default function SongView({ song, onEdit, onBack }) {
  const hasLyrics = song.sections?.some(s => s.lines?.length > 0);

  return (
    <div className="view">
      <div className="view-header">
        <button className="btn-icon" onClick={onBack} title="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="song-view-title">
          <h1>{song.title || 'Untitled'}</h1>
          <p>{song.artist || 'Unknown artist'}</p>
        </div>
        <button className="btn-primary" onClick={onEdit}>
          <Edit2 size={16} /> Edit
        </button>
      </div>

      <div className="song-meta" style={{ marginBottom: 'var(--sp-5)' }}>
        <span className="meta-chip">{song.key}</span>
        <span className="meta-chip">{song.bpm} BPM</span>
        <span className="meta-chip">{song.timeSignature}</span>
        <span className="meta-chip">{song.category}</span>
      </div>

      {!hasLyrics ? (
        <div className="empty-state">
          No lyrics yet. Tap Edit to add sections and chords.
        </div>
      ) : (
        song.sections.map(section => (
          section.lines?.length > 0 && (
            <div key={section.id} className="perf-section">
              <h2 className="perf-section-title">{section.name}</h2>
              {section.lines.map(line => (
                <div key={line.id} className="perf-line">
                  <div className="perf-words">
                    {line.words?.map(word => (
                      <div key={word.id} className={`perf-word ${word.cue ? `cue-${word.cue}` : ''}`}>
                        {word.chord && <div className="chord">{word.chord}</div>}
                        <div className="lyric">{word.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ))
      )}
    </div>
  );
}
