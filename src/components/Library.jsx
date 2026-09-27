import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, ListPlus, Search, Star, Check, Globe, Lock, Send, Copy } from 'lucide-react';
import { CATEGORIES } from '../utils/constants';
import { timeAgo } from '../utils/formatTime';
import { supabase } from '../utils/supabaseClient';

const FILTERS = ['All', 'Favorites', ...CATEGORIES.filter(c => c !== 'Other')];

const mapRow = (row) => ({
  id: row.id,
  ownerId: row.owner_id,
  title: row.title,
  artist: row.artist || '',
  key: row.key || 'C',
  bpm: row.bpm || 120,
  timeSignature: row.time_signature || '4/4',
  category: row.category || 'Worship',
  sections: row.sections || [],
  isPublished: row.is_published || false,
  originSongId: row.origin_song_id || null,
});

export default function Library({
  songs, profile, onNewSong, onEditSong, onViewSong, onDeleteSong, onToggleFavorite,
  onTogglePublish, onShareToProfile, onCopySong,
  setlists, onAddSongToSetlist, onCreateSetlist,
}) {
  const [mode, setMode] = useState('mine');
  const [communitySongs, setCommunitySongs] = useState([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [addMenuFor, setAddMenuFor] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setAddMenuFor(null);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const loadCommunity = useCallback(async () => {
    setCommunityLoading(true);
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });
    if (!error && data) setCommunitySongs(data.map(mapRow));
    setCommunityLoading(false);
  }, []);

  useEffect(() => {
    if (mode === 'community') loadCommunity();
  }, [mode, loadCommunity]);

  const activeList = mode === 'mine' ? songs : communitySongs;

  const filteredSongs = useMemo(() => {
    let list = activeList;
    if (filter === 'Favorites') list = list.filter(s => s.favorite);
    else if (filter !== 'All') list = list.filter(s => s.category === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeList, search, filter]);

  const handleShare = async (song) => {
    const username = window.prompt("Share to which username?");
    if (!username) return;
    const { error } = await onShareToProfile(song, username);
    window.alert(error ? error.message : `Sent "${song.title}" to @${username.trim().toLowerCase()}.`);
  };

  const handleCopy = async (song) => {
    const { error } = await onCopySong(song);
    window.alert(error ? 'Could not copy: ' + error.message : `Added "${song.title}" to your library.`);
  };

  return (
    <div className="view">
      <div className="view-header">
        <h1>Songs</h1>
        <button className="btn-primary" onClick={onNewSong}>
          <Plus size={18} /> New Song
        </button>
      </div>

      <div className="mode-toggle">
        <button className={mode === 'mine' ? 'active' : ''} onClick={() => setMode('mine')}>My Library</button>
        <button className={mode === 'community' ? 'active' : ''} onClick={() => setMode('community')}>Community</button>
      </div>

      <div className="search-box">
        <Search size={16} />
        <input
          type="text" placeholder="Search title or artist…" value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-chips">
        {FILTERS.map(f => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="song-list">
        {mode === 'community' && communityLoading ? (
          <div className="empty-state">Loading community songs…</div>
        ) : filteredSongs.length === 0 ? (
          <div className="empty-state">
            {mode === 'mine'
              ? (songs.length === 0 ? 'No songs yet. Create one to get started!' : 'No songs match this view.')
              : 'No published songs yet.'}
          </div>
        ) : (
          filteredSongs.map(song => {
            const isMine = mode === 'mine';
            return (
              <div key={song.id} className="song-card">
                <button
                  className={`fav-star ${song.favorite ? 'active' : ''}`}
                  onClick={() => onToggleFavorite(song.id)}
                  title="Favorite"
                >
                  <Star size={16} fill={song.favorite ? 'currentColor' : 'none'} />
                </button>

                <div className="song-info" onClick={() => onViewSong(song)}>
                  <h3>{song.title || 'Untitled'}</h3>
                  <p>{song.artist || 'Unknown artist'}</p>
                  <div className="song-meta">
                    <span className="meta-chip">{song.key}</span>
                    <span className="meta-chip">{song.bpm} BPM</span>
                    <span className="meta-chip">{song.category}</span>
                    <span className="meta-time">{timeAgo(song.lastUsed)}</span>
                  </div>
                </div>

                <div className="song-actions">
                  {isMine ? (
                    <>
                      <button className="btn-icon" onClick={() => onEditSong(song)} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button
                        className={`btn-icon ${song.isPublished ? 'active' : ''}`}
                        onClick={() => onTogglePublish(song)}
                        title={song.isPublished ? 'Published — tap to unpublish' : 'Publish to Community'}
                      >
                        {song.isPublished ? <Globe size={16} /> : <Lock size={16} />}
                      </button>
                      <button className="btn-icon" onClick={() => handleShare(song)} title="Share to a profile">
                        <Send size={16} />
                      </button>
                    </>
                  ) : (
                    <button className="btn-icon" onClick={() => handleCopy(song)} title="Copy to My Library">
                      <Copy size={16} />
                    </button>
                  )}
                  <div className="add-menu-wrap" ref={addMenuFor === song.id ? menuRef : null}>
                    <button
                      className="btn-icon"
                      onClick={() => setAddMenuFor(addMenuFor === song.id ? null : song.id)}
                      title="Add to Setlist"
                    >
                      <ListPlus size={16} />
                    </button>
                    {addMenuFor === song.id && (
                      <div className="add-menu">
                        {setlists.length === 0 && <div className="add-menu-empty">No setlists yet</div>}
                        {setlists.map(sl => {
                          const already = sl.songIds.includes(song.id);
                          return (
                            <button
                              key={sl.id}
                              className="add-menu-item"
                              disabled={already}
                              onClick={() => { onAddSongToSetlist(sl.id, song.id); setAddMenuFor(null); }}
                            >
                              <span>{sl.name}</span>
                              {already && <Check size={14} />}
                            </button>
                          );
                        })}
                        <button
                          className="add-menu-item add-menu-new"
                          onClick={async () => {
                            const id = await onCreateSetlist('New Setlist');
                            if (id) onAddSongToSetlist(id, song.id);
                            setAddMenuFor(null);
                          }}
                        >
                          <Plus size={13} /> New Setlist
                        </button>
                      </div>
                    )}
                  </div>
                  {isMine && (
                    <button className="btn-icon btn-danger" onClick={() => onDeleteSong(song.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
