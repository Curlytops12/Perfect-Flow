import React, { useState, useEffect, useCallback } from 'react';
import { Search, LogIn, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { CATEGORIES } from '../utils/constants';

const FILTERS = ['All', ...CATEGORIES.filter(c => c !== 'Other')];

const mapRow = (row) => ({
  id: row.id,
  title: row.title,
  artist: row.artist || '',
  key: row.key || 'C',
  bpm: row.bpm || 120,
  timeSignature: row.time_signature || '4/4',
  category: row.category || 'Worship',
  sections: row.sections || [],
});

export default function Guest({ onSignInClick }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [viewingSong, setViewingSong] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (!error && data) setSongs(data.map(mapRow));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = songs.filter(s => {
    if (filter !== 'All' && s.category !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
    }
    return true;
  });

  if (viewingSong) {
    return (
      <div className="app">
        <div className="view">
          <div className="view-header">
            <button className="btn-icon" onClick={() => setViewingSong(null)} title="Back">
              <ArrowLeft size={20} />
            </button>
            <div className="song-view-title">
              <h1>{viewingSong.title}</h1>
              <p>{viewingSong.artist || 'Unknown artist'}</p>
            </div>
            <button className="btn-primary" onClick={onSignInClick}>
              <LogIn size={16} /> Sign In
            </button>
          </div>
          <div className="song-meta" style={{ marginBottom: 'var(--sp-5)' }}>
            <span className="meta-chip">{viewingSong.key}</span>
            <span className="meta-chip">{viewingSong.bpm} BPM</span>
            <span className="meta-chip">{viewingSong.timeSignature}</span>
          </div>
          {viewingSong.sections.map(section => section.lines?.length > 0 && (
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
          ))}
          <p className="section-hint" style={{ marginTop: 'var(--sp-6)', textAlign: 'center' }}>
            Sign in to save this, build a setlist, or perform it live.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <img src="/logo-header.png" alt="Perfect Flow" className="app-logo" />
        <div className="app-title-section">
          <h1>Perfect Flow</h1>
          <p>Your Song. Your Flow.</p>
        </div>
        <button className="btn-primary" onClick={onSignInClick}>
          <LogIn size={16} /> Sign In
        </button>
      </div>

      <div className="view-container">
        <div className="view">
          <div className="view-header">
            <h1>Community Songs</h1>
          </div>
          <p className="section-hint">Browsing is open to everyone. Sign in to create songs, save favorites, and build setlists.</p>

          <div className="search-box">
            <Search size={16} />
            <input
              type="text" placeholder="Search title or artist…" value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-chips">
            {FILTERS.map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>

          <div className="song-list">
            {loading ? (
              <div className="empty-state">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">No published songs yet.</div>
            ) : (
              filtered.map(song => (
                <div key={song.id} className="song-card" onClick={() => setViewingSong(song)}>
                  <div className="song-info">
                    <h3>{song.title}</h3>
                    <p>{song.artist || 'Unknown artist'}</p>
                    <div className="song-meta">
                      <span className="meta-chip">{song.key}</span>
                      <span className="meta-chip">{song.bpm} BPM</span>
                      <span className="meta-chip">{song.category}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
