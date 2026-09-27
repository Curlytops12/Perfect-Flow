import React, { useState, useMemo } from 'react';
import { Search, Headphones } from 'lucide-react';
import { timeAgo } from '../utils/formatTime';

export default function Practice({ songs, onStartPractice }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return songs;
    const q = search.toLowerCase();
    return songs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  }, [songs, search]);

  return (
    <div className="view">
      <div className="view-header">
        <h1>Practice</h1>
      </div>
      <p className="section-hint">Pick a song to rehearse solo — full lyrics, chords, and auto-scroll, no setlist required.</p>

      <div className="search-box">
        <Search size={16} />
        <input
          type="text" placeholder="Search title or artist…" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="song-list">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {songs.length === 0 ? 'Add a song in the Songs tab first.' : 'No songs match your search.'}
          </div>
        ) : (
          filtered.map(song => (
            <div key={song.id} className="song-card practice-card" onClick={() => onStartPractice(song)}>
              <div className="practice-icon"><Headphones size={18} /></div>
              <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artist || 'Unknown artist'}</p>
                <div className="song-meta">
                  <span className="meta-chip">{song.key}</span>
                  <span className="meta-chip">{song.bpm} BPM</span>
                  <span className="meta-time">{timeAgo(song.lastUsed)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
