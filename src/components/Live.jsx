import React from 'react';
import { Radio, Play } from 'lucide-react';

export default function Live({ setlists, songs, activeSetlist, onStart }) {
  const resolvedCount = (sl) => sl.songIds.filter(id => songs.some(s => s.id === id)).length;

  return (
    <div className="view">
      <div className="view-header">
        <h1>Live</h1>
      </div>

      {activeSetlist && resolvedCount(activeSetlist) > 0 ? (
        <div className="live-hero">
          <div className="live-hero-icon"><Radio size={22} /></div>
          <div className="live-hero-label">READY TO GO LIVE</div>
          <div className="live-hero-name">{activeSetlist.name}</div>
          <div className="live-hero-sub">{resolvedCount(activeSetlist)} song{resolvedCount(activeSetlist) === 1 ? '' : 's'} queued</div>
          <button className="btn-start-set" onClick={() => onStart(activeSetlist.id)}>
            <Play size={18} fill="currentColor" /> Go Live
          </button>
        </div>
      ) : (
        <p className="section-hint">Choose a setlist below to start performing.</p>
      )}

      <div className="song-list" style={{ marginTop: 'var(--sp-6)' }}>
        {setlists.length === 0 ? (
          <div className="empty-state">No setlists yet. Build one in the Setlists tab.</div>
        ) : (
          setlists.map(sl => (
            <div key={sl.id} className="setlist-card">
              <div className="song-info">
                <h3>{sl.name}</h3>
                <p>{resolvedCount(sl)} song{resolvedCount(sl) === 1 ? '' : 's'}</p>
              </div>
              <button
                className="btn-icon active"
                onClick={() => onStart(sl.id)}
                disabled={resolvedCount(sl) === 0}
                title="Start"
              >
                <Play size={16} fill="currentColor" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
