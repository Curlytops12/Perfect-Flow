import React, { useState, useEffect, useCallback } from 'react';
import Library from './components/Library';
import Setlists from './components/Setlists';
import Practice from './components/Practice';
import Live from './components/Live';
import Profile from './components/Profile';
import Presentations from './components/Presentations';
import Editor from './components/Editor';
import SongView from './components/SongView';
import Performance from './components/Performance';
import { SignIn, CreateProfile, ResetPassword, SupabaseNotConfigured } from './components/Auth';
import Guest from './components/Guest';
import { useAuth } from './hooks/useAuth';
import { supabase, supabaseReady } from './utils/supabaseClient';
import { Music, ListMusic, Headphones, Radio, User } from 'lucide-react';

const mapSetlistRow = (row) => ({ id: row.id, name: row.name, songIds: row.song_ids || [] });

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

export default function App() {
  const {
    session, profile, loading: authLoading, recoveryMode,
    signInWithEmail, signUpWithPassword, signInWithPassword, signInWithGoogle,
    resetPasswordForEmail, updatePassword,
    signOut, createProfile,
  } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  const [view, setView] = useState('songs');
  const [songs, setSongs] = useState([]);
  const [songMeta, setSongMeta] = useState({});
  const [setlists, setSetlists] = useState([]);
  const [lastSetlistId, setLastSetlistId] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);

  const [perfQueue, setPerfQueue] = useState([]);
  const [perfIndex, setPerfIndex] = useState(0);
  const [perfReturnView, setPerfReturnView] = useState('songs');
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  // Load local (per-device only) data on mount — favorites/last-used stay on-device
  useEffect(() => {
    try {
      const savedMeta = localStorage.getItem('perfectflow_song_meta');
      if (savedMeta) setSongMeta(JSON.parse(savedMeta));
    } catch (e) { console.error('Failed to load song meta', e); }

    try {
      const savedLast = localStorage.getItem('perfectflow_last_setlist');
      if (savedLast) setLastSetlistId(JSON.parse(savedLast));
    } catch (e) { console.error('Failed to load last setlist', e); }
  }, []);

  useEffect(() => {
    localStorage.setItem('perfectflow_song_meta', JSON.stringify(songMeta));
  }, [songMeta]);

  useEffect(() => {
    localStorage.setItem('perfectflow_last_setlist', JSON.stringify(lastSetlistId));
  }, [lastSetlistId]);

  // ---- Fetch my songs + setlists from Supabase (account-bound) ----
  const fetchMySongs = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: true });
    if (!error && data) setSongs(data.map(mapRow));
  }, [profile]);

  const fetchMySetlists = useCallback(async () => {
    if (!profile) return;
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: true });
    if (!error && data) setSetlists(data.map(mapSetlistRow));
  }, [profile]);

  useEffect(() => { fetchMySongs(); }, [fetchMySongs]);
  useEffect(() => { fetchMySetlists(); }, [fetchMySetlists]);

  // Merge local per-device meta (favorite / lastUsed) onto cloud song rows
  const songsWithMeta = songs.map(s => ({
    ...s,
    favorite: songMeta[s.id]?.favorite || false,
    lastUsed: songMeta[s.id]?.lastUsed || null,
  }));

  // ---- Songs ----
  const startNewSong = () => {
    setCurrentSong({
      title: '', artist: '', key: 'C', bpm: 120, timeSignature: '4/4', category: 'Worship',
      isPublished: false, sections: [],
    });
    setView('editor');
  };

  const handleSaveSong = async (song) => {
    const payload = {
      title: song.title,
      artist: song.artist,
      key: song.key,
      bpm: song.bpm,
      time_signature: song.timeSignature,
      category: song.category,
      sections: song.sections,
      is_published: song.isPublished || false,
    };
    if (song.id) {
      const { data, error } = await supabase.from('songs').update(payload).eq('id', song.id).select().single();
      if (!error) setSongs(prev => prev.map(s => s.id === data.id ? mapRow(data) : s));
      else window.alert('Could not save: ' + error.message);
    } else {
      const { data, error } = await supabase.from('songs').insert({ ...payload, owner_id: profile.id }).select().single();
      if (!error) setSongs(prev => [...prev, mapRow(data)]);
      else window.alert('Could not save: ' + error.message);
    }
    setView('songs');
  };

  const handleDeleteSong = async (id) => {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) { window.alert('Could not delete: ' + error.message); return; }
    setSongs(prev => prev.filter(s => s.id !== id));
    setSetlists(prev => prev.map(sl => ({ ...sl, songIds: sl.songIds.filter(sid => sid !== id) })));
    setSongMeta(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleTogglePublish = async (song) => {
    const { data, error } = await supabase
      .from('songs').update({ is_published: !song.isPublished }).eq('id', song.id).select().single();
    if (!error) setSongs(prev => prev.map(s => s.id === data.id ? mapRow(data) : s));
  };

  const handleShareToProfile = async (song, username) => {
    const clean = username.trim().toLowerCase();
    const { data: target } = await supabase.from('profiles').select('id').eq('username', clean).maybeSingle();
    if (!target) return { error: { message: `No profile found with username "${clean}".` } };
    const { error } = await supabase.from('shares').insert({
      song_id: song.id, from_profile: profile.id, to_username: clean,
    });
    return { error };
  };

  const handleCopySong = async (song) => {
    const payload = {
      title: song.title, artist: song.artist, key: song.key, bpm: song.bpm,
      time_signature: song.timeSignature, category: song.category, sections: song.sections,
      is_published: false, owner_id: profile.id, origin_song_id: song.id,
    };
    const { data, error } = await supabase.from('songs').insert(payload).select().single();
    if (!error) setSongs(prev => [...prev, mapRow(data)]);
    return { data, error };
  };

  const handleToggleFavorite = (id) => {
    setSongMeta(prev => ({ ...prev, [id]: { ...prev[id], favorite: !prev[id]?.favorite } }));
  };

  const handleEditSong = (song) => {
    setCurrentSong(song);
    setView('editor');
  };

  const handleViewSong = (song) => {
    setCurrentSong(song);
    setView('view-song');
  };

  const markSongUsed = (songId) => {
    setSongMeta(prev => ({ ...prev, [songId]: { ...prev[songId], lastUsed: Date.now() } }));
  };

  // ---- Setlists (cloud, per account) ----
  // Awaits the real DB row before returning its id — callers that immediately
  // add a song to a brand-new setlist need a real id, not a placeholder.
  const createSetlist = async (name) => {
    const { data, error } = await supabase
      .from('setlists')
      .insert({ owner_id: profile.id, name: name || 'New Setlist', song_ids: [] })
      .select().single();
    if (error) { window.alert('Could not create setlist: ' + error.message); return null; }
    const setlist = mapSetlistRow(data);
    setSetlists(prev => [...prev, setlist]);
    return setlist.id;
  };

  const deleteSetlist = async (id) => {
    setSetlists(prev => prev.filter(sl => sl.id !== id));
    if (lastSetlistId === id) setLastSetlistId(null);
    await supabase.from('setlists').delete().eq('id', id);
  };

  const renameSetlist = async (id, name) => {
    setSetlists(prev => prev.map(sl => sl.id === id ? { ...sl, name } : sl));
    await supabase.from('setlists').update({ name }).eq('id', id);
  };

  const persistSongIds = async (setlistId, songIds) => {
    await supabase.from('setlists').update({ song_ids: songIds }).eq('id', setlistId);
  };

  const addSongToSetlist = (setlistId, songId) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id !== setlistId || sl.songIds.includes(songId)) return sl;
      const songIds = [...sl.songIds, songId];
      persistSongIds(setlistId, songIds);
      return { ...sl, songIds };
    }));
  };

  const removeSongFromSetlist = (setlistId, songId) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id !== setlistId) return sl;
      const songIds = sl.songIds.filter(id => id !== songId);
      persistSongIds(setlistId, songIds);
      return { ...sl, songIds };
    }));
  };

  const reorderSetlistSongs = (setlistId, fromIdx, toIdx) => {
    setSetlists(prev => prev.map(sl => {
      if (sl.id !== setlistId) return sl;
      const songIds = [...sl.songIds];
      const [moved] = songIds.splice(fromIdx, 1);
      songIds.splice(toIdx, 0, moved);
      persistSongIds(setlistId, songIds);
      return { ...sl, songIds };
    }));
  };

  // ---- Performance ----
  const resolveSetlistSongs = (setlist) =>
    setlist.songIds.map(id => songsWithMeta.find(s => s.id === id)).filter(Boolean);

  const startSetlist = (setlistId) => {
    const setlist = setlists.find(sl => sl.id === setlistId);
    if (!setlist) return;
    const queue = resolveSetlistSongs(setlist);
    if (queue.length === 0) return;
    setPerfQueue(queue);
    setPerfIndex(0);
    setPerfReturnView(view === 'live' ? 'live' : 'setlists');
    setLastSetlistId(setlistId);
    markSongUsed(queue[0].id);
    setIsPerformanceMode(true);
  };

  const startPractice = (song) => {
    setPerfQueue([song]);
    setPerfIndex(0);
    setPerfReturnView('practice');
    markSongUsed(song.id);
    setIsPerformanceMode(true);
  };

  const handleNextSong = () => {
    setPerfIndex(i => {
      const next = Math.min(i + 1, perfQueue.length - 1);
      if (perfQueue[next]) markSongUsed(perfQueue[next].id);
      return next;
    });
  };

  const handlePrevSong = () => {
    setPerfIndex(i => {
      const prev = Math.max(i - 1, 0);
      if (perfQueue[prev]) markSongUsed(perfQueue[prev].id);
      return prev;
    });
  };

  const handleExitPerformance = () => {
    setIsPerformanceMode(false);
    setView(perfReturnView);
  };

  const handleSignOut = () => {
    setShowSignIn(false);
    setView('songs');
    signOut();
  };

  if (!supabaseReady) {
    return <SupabaseNotConfigured />;
  }

  if (authLoading) {
    return <div className="auth-screen"><p className="section-hint">Loading…</p></div>;
  }

  if (!session) {
    return showSignIn
      ? (
        <SignIn
          onSignInWithMagicLink={signInWithEmail}
          onSignUpWithPassword={signUpWithPassword}
          onSignInWithPassword={signInWithPassword}
          onSignInWithGoogle={signInWithGoogle}
          onResetPassword={resetPasswordForEmail}
        />
      )
      : <Guest onSignInClick={() => setShowSignIn(true)} />;
  }

  if (recoveryMode) {
    return <ResetPassword onUpdatePassword={updatePassword} />;
  }

  if (!profile) {
    return <CreateProfile onCreate={createProfile} />;
  }

  if (isPerformanceMode && perfQueue.length > 0) {
    return (
      <Performance
        lineUp={perfQueue}
        currentIndex={perfIndex}
        onNextSong={handleNextSong}
        onPrevSong={handlePrevSong}
        onExit={handleExitPerformance}
      />
    );
  }

  const activeSetlist = setlists.find(sl => sl.id === lastSetlistId) || null;

  return (
    <div className="app">
      <div className="app-header">
        <img src="/logo-header.png" alt="Perfect Flow" className="app-logo" />
        <div className="app-title-section">
          <h1>Perfect Flow</h1>
          <p>Your Song. Your Flow.</p>
        </div>
      </div>

      <div className="view-container">
        {view === 'songs' && (
          <Library
            songs={songsWithMeta}
            profile={profile}
            onNewSong={startNewSong}
            onEditSong={handleEditSong}
            onViewSong={handleViewSong}
            onDeleteSong={handleDeleteSong}
            onToggleFavorite={handleToggleFavorite}
            onTogglePublish={handleTogglePublish}
            onShareToProfile={handleShareToProfile}
            onCopySong={handleCopySong}
            setlists={setlists}
            onAddSongToSetlist={addSongToSetlist}
            onCreateSetlist={createSetlist}
          />
        )}
        {view === 'setlists' && (
          <Setlists
            setlists={setlists}
            songs={songsWithMeta}
            onCreate={createSetlist}
            onDelete={deleteSetlist}
            onRename={renameSetlist}
            onAddSong={addSongToSetlist}
            onRemoveSong={removeSongFromSetlist}
            onReorder={reorderSetlistSongs}
            onStart={startSetlist}
          />
        )}
        {view === 'practice' && (
          <Practice songs={songsWithMeta} onStartPractice={startPractice} />
        )}
        {view === 'live' && (
          <Live
            setlists={setlists}
            songs={songsWithMeta}
            activeSetlist={activeSetlist}
            onStart={startSetlist}
          />
        )}
        {view === 'profile' && (
          <Profile
            profile={profile}
            songs={songsWithMeta}
            setlists={setlists}
            onSignOut={handleSignOut}
            onCopySong={handleCopySong}
          />
        )}
        {view === 'presentations' && (
          <Presentations profile={profile} onBack={() => setView('profile')} />
        )}
        {view === 'editor' && currentSong && (
          <Editor
            song={currentSong}
            onSave={handleSaveSong}
            onCancel={() => setView('songs')}
          />
        )}
        {view === 'view-song' && currentSong && (
          <SongView
            song={currentSong}
            onEdit={() => setView('editor')}
            onBack={() => setView('songs')}
          />
        )}
      </div>

      <nav className="nav-bar">
        <button className={`nav-btn ${view === 'songs' ? 'active' : ''}`} onClick={() => setView('songs')}>
          <Music size={20} />
          <span className="nav-label">Songs</span>
        </button>
        <button className={`nav-btn ${view === 'setlists' ? 'active' : ''}`} onClick={() => setView('setlists')}>
          <ListMusic size={20} />
          <span className="nav-label">Setlists</span>
        </button>
        <button className={`nav-btn ${view === 'practice' ? 'active' : ''}`} onClick={() => setView('practice')}>
          <Headphones size={20} />
          <span className="nav-label">Practice</span>
        </button>
        <button className={`nav-btn ${view === 'live' ? 'active' : ''}`} onClick={() => setView('live')}>
          <Radio size={20} />
          <span className="nav-label">Live</span>
        </button>
        <button className={`nav-btn ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')}>
          <User size={20} />
          <span className="nav-label">Profile</span>
        </button>
      </nav>
    </div>
  );
}
