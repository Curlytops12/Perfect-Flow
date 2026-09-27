import React, { useState } from 'react';
import { Plus, Trash2, Play, ChevronLeft, GripVertical, X, Share2, Edit2 } from 'lucide-react';

export default function Setlists({ setlists, songs, onCreate, onDelete, onRename, onAddSong, onRemoveSong, onReorder, onStart }) {
  const [selectedId, setSelectedId] = useState(null);
  const [showAddSongs, setShowAddSongs] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const selected = setlists.find(sl => sl.id === selectedId) || null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setCreating(false);
    }
  };

  const songsInSetlist = (sl) => sl.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean);

  const handleShare = (sl) => {
    const list = songsInSetlist(sl);
    const text = `${sl.name}\n${list.map((s, i) => `${i + 1}. ${s.title} — ${s.artist} (${s.key}, ${s.bpm} BPM)`).join('\n')}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  if (selected) {
    const list = songsInSetlist(selected);
    const availableSongs = songs.filter(s => !selected.songIds.includes(s.id));

    return (
      <div className="view">
        <div className="view-header">
          <button className="btn-icon" onClick={() => setSelectedId(null)} title="Back">
            <ChevronLeft size={20} />
          </button>
          <input
            className="setlist-name-input"
            value={selected.name}
            onChange={(e) => onRename(selected.id, e.target.value)}
          />
          <div className="header-actions">
            <button className="btn-icon" onClick={() => handleShare(selected)} title="Share">
              <Share2 size={18} />
            </button>
            <button className="btn-icon btn-danger" onClick={() => { onDelete(selected.id); setSelectedId(null); }} title="Delete Setlist">
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        <div className="lineup-list">
          {list.length === 0 ? (
            <div className="empty-state">No songs yet. Add some below.</div>
          ) : (
            list.map((song, idx) => (
              <div
                key={song.id}
                className={`lineup-item ${dragIndex === idx ? 'dragging' : ''}`}
                draggable
                onDragStart={() => setDragIndex(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== idx) onReorder(selected.id, dragIndex, idx);
                  setDragIndex(null);
                }}
                onDragEnd={() => setDragIndex(null)}
              >
                <span className="drag-handle"><GripVertical size={16} /></span>
                <div className="lineup-number">{idx + 1}</div>
                <div className="lineup-info">
                  <h3>{song.title}</h3>
                  <p>{song.artist} • {song.key} • {song.bpm} BPM</p>
                </div>
                <div className="lineup-actions">
                  <button className="btn-icon btn-danger" onClick={() => onRemoveSong(selected.id, song.id)} title="Remove">
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <button className="btn-secondary btn-block" onClick={() => setShowAddSongs(true)}>
          <Plus size={16} /> Add Songs
        </button>

        {list.length > 0 && (
          <button className="btn-start-set" onClick={() => onStart(selected.id)}>
            <Play size={18} fill="currentColor" /> Start Setlist
          </button>
        )}

        {showAddSongs && (
          <div className="modal" onClick={() => setShowAddSongs(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Add Songs</h2>
              <div className="picker-list">
                {availableSongs.length === 0 ? (
                  <div className="empty-state">All songs are already in this setlist.</div>
                ) : (
                  availableSongs.map(s => (
                    <button key={s.id} className="picker-item" onClick={() => onAddSong(selected.id, s.id)}>
                      <div>
                        <div className="picker-title">{s.title}</div>
                        <div className="picker-sub">{s.artist} • {s.key}</div>
                      </div>
                      <Plus size={16} />
                    </button>
                  ))
                )}
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setShowAddSongs(false)}>Done</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="view">
      <div className="view-header">
        <h1>Setlists</h1>
        <button className="btn-primary" onClick={() => setCreating(!creating)}>
          <Plus size={18} /> New Setlist
        </button>
      </div>

      {creating && (
        <form className="form-new-song" onSubmit={handleCreate}>
          <input
            type="text" placeholder="Setlist name (e.g. Sunday Service)" value={newName} autoFocus
            onChange={(e) => setNewName(e.target.value)}
          />
          <div className="form-actions">
            <button type="submit" className="btn-primary">Create</button>
            <button type="button" className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </form>
      )}

      {setlists.length === 0 ? (
        <div className="empty-state">No setlists yet. Create one to start organizing a performance.</div>
      ) : (
        <div className="song-list">
          {setlists.map(sl => (
            <div key={sl.id} className="setlist-card">
              <div className="song-info" onClick={() => setSelectedId(sl.id)}>
                <h3>{sl.name}</h3>
                <p>{sl.songIds.length} song{sl.songIds.length === 1 ? '' : 's'}</p>
              </div>
              <div className="song-actions">
                <button className="btn-icon" onClick={() => setSelectedId(sl.id)} title="Edit">
                  <Edit2 size={16} />
                </button>
                <button
                  className="btn-icon active"
                  onClick={() => onStart(sl.id)}
                  title="Start"
                  disabled={sl.songIds.length === 0}
                >
                  <Play size={16} fill="currentColor" />
                </button>
                <button
                  className="btn-icon btn-danger"
                  onClick={() => onDelete(sl.id)}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
