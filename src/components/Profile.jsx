import React, { useState, useEffect, useCallback } from 'react';
import { Music2, LogOut, Inbox, Check, X, Download, Upload, Trash2, Edit2, Bug, Camera, ImagePlus } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function Profile({ profile, songs, setlists, onSignOut, onCopySong, onUpdateProfile }) {
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(true);
  const [message, setMessage] = useState('');
  const fileRef = React.useRef(null);
  const avatarFileRef = React.useRef(null);
  const bugPhotoRef = React.useRef(null);

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.display_name || '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [showBugReport, setShowBugReport] = useState(false);
  const [bugText, setBugText] = useState('');
  const [bugPhoto, setBugPhoto] = useState(null);
  const [bugPhotoPreview, setBugPhotoPreview] = useState(null);
  const [submittingBug, setSubmittingBug] = useState(false);

  const flash = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2500);
  };

  const loadShares = useCallback(async () => {
    setLoadingShares(true);
    const { data, error } = await supabase
      .from('shares')
      .select('*, songs(title, artist, key, bpm, time_signature, category, sections)')
      .order('created_at', { ascending: false });
    if (!error && data) setShares(data);
    setLoadingShares(false);
  }, []);

  useEffect(() => { loadShares(); }, [loadShares]);

  const handleAccept = async (share) => {
    if (!share.songs) { flash('That song is no longer available.'); return; }
    const s = share.songs;
    const { error } = await onCopySong({
      id: share.song_id,
      title: s.title,
      artist: s.artist,
      key: s.key,
      bpm: s.bpm,
      timeSignature: s.time_signature,
      category: s.category,
      sections: s.sections || [],
    });
    if (!error) {
      await supabase.from('shares').delete().eq('id', share.id);
      setShares(prev => prev.filter(s => s.id !== share.id));
      flash(`Added "${share.songs.title}" to your library.`);
    }
  };

  const handleDecline = async (share) => {
    await supabase.from('shares').delete().eq('id', share.id);
    setShares(prev => prev.filter(s => s.id !== share.id));
  };

  const handleExport = () => {
    const data = { setlists, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perfect-flow-setlists-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (Array.isArray(data.setlists)) {
          localStorage.setItem('perfectflow_setlists', JSON.stringify(data.setlists));
          window.location.reload();
        }
      } catch (err) {
        flash('Could not read that file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSaveName = async () => {
    setSavingName(true);
    const { error } = await onUpdateProfile({ display_name: nameInput.trim() || profile.username });
    setSavingName(false);
    if (error) { flash('Could not update name: ' + error.message); return; }
    setEditingName(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash('Please choose an image file.'); return; }

    setUploadingAvatar(true);
    const path = `${profile.id}/avatar`;
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) {
      setUploadingAvatar(false);
      flash('Could not upload photo: ' + uploadError.message);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error: updateError } = await onUpdateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
    setUploadingAvatar(false);
    if (updateError) { flash('Could not save photo: ' + updateError.message); return; }
    flash('Profile photo updated.');
  };

  const handleBugPhotoChange = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { flash('Please choose an image file.'); return; }
    setBugPhoto(file);
    setBugPhotoPreview(URL.createObjectURL(file));
  };

  const removeBugPhoto = () => {
    setBugPhoto(null);
    setBugPhotoPreview(null);
  };

  const handleSubmitBug = async () => {
    if (!bugText.trim()) return;
    setSubmittingBug(true);

    let photoPath = null;
    if (bugPhoto) {
      const path = `${profile.id}/${Date.now()}-${bugPhoto.name}`;
      const { error: uploadError } = await supabase.storage
        .from('bug-photos')
        .upload(path, bugPhoto, { contentType: bugPhoto.type });
      if (uploadError) {
        setSubmittingBug(false);
        flash('Could not attach photo: ' + uploadError.message);
        return;
      }
      photoPath = path;
    }

    const { error } = await supabase.from('bug_reports').insert({
      reporter_id: profile.id,
      description: bugText.trim(),
      photo_path: photoPath,
    });
    setSubmittingBug(false);
    if (error) { flash('Could not submit: ' + error.message); return; }
    setBugText('');
    removeBugPhoto();
    setShowBugReport(false);
    flash('Thanks — bug report sent.');
  };

  const handleResetLocal = () => {
    if (window.confirm('This clears setlists and favorites stored on this device. Your songs stay safe in the cloud. Continue?')) {
      localStorage.removeItem('perfectflow_setlists');
      localStorage.removeItem('perfectflow_song_meta');
      localStorage.removeItem('perfectflow_last_setlist');
      window.location.reload();
    }
  };

  return (
    <div className="view">
      <div className="view-header">
        <h1>Profile</h1>
      </div>

      <div className="profile-card">
        <button
          className="profile-brand profile-avatar-btn"
          onClick={() => avatarFileRef.current?.click()}
          disabled={uploadingAvatar}
          title="Change profile photo"
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="profile-avatar-img" />
          ) : (
            <Music2 size={28} />
          )}
          <span className="profile-avatar-edit"><Camera size={13} /></span>
        </button>
        <input ref={avatarFileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {editingName ? (
            <div className="profile-name-edit">
              <input
                type="text" value={nameInput} autoFocus placeholder="Display name"
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
              />
              <button className="btn-icon" onClick={handleSaveName} disabled={savingName} title="Save">
                <Check size={14} />
              </button>
              <button className="btn-icon" onClick={() => { setEditingName(false); setNameInput(profile.display_name || ''); }} title="Cancel">
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="profile-name">
              {profile.display_name || profile.username}
              <button className="btn-icon" onClick={() => setEditingName(true)} title="Edit name">
                <Edit2 size={13} />
              </button>
            </div>
          )}
          <div className="profile-tagline">@{profile.username}</div>
        </div>
        <button className="btn-icon" onClick={onSignOut} title="Sign out">
          <LogOut size={18} />
        </button>
      </div>

      <div className="profile-stats">
        <div className="profile-stat"><span>{songs.length}</span>Songs</div>
        <div className="profile-stat"><span>{setlists.length}</span>Setlists</div>
        <div className="profile-stat"><span>{songs.filter(s => s.favorite).length}</span>Favorites</div>
      </div>

      <div className="section-group">
        <h3><Inbox size={13} /> Shared With You</h3>
        {loadingShares ? (
          <p className="section-hint">Loading…</p>
        ) : shares.length === 0 ? (
          <p className="section-hint">Nothing pending. Songs other musicians share with you show up here.</p>
        ) : (
          shares.map(share => (
            <div key={share.id} className="share-item">
              <div>
                <div className="picker-title">{share.songs?.title || 'Untitled song'}</div>
                <div className="picker-sub">{share.songs?.artist} {share.songs?.key ? `• ${share.songs.key}` : ''}</div>
              </div>
              <div className="share-actions">
                <button className="btn-icon" onClick={() => handleAccept(share)} title="Add to my library">
                  <Check size={16} />
                </button>
                <button className="btn-icon btn-danger" onClick={() => handleDecline(share)} title="Decline">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="section-group">
        <h3>Local Data</h3>
        <p className="section-hint">Songs sync to the cloud automatically. Setlists and favorites stay on this device.</p>
        <button className="btn-secondary btn-block" onClick={handleExport}>
          <Download size={16} /> Export Setlists
        </button>
        <button className="btn-secondary btn-block" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Import Setlists
        </button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={handleImport} />
        <button className="btn-icon btn-danger btn-block" onClick={handleResetLocal}>
          <Trash2 size={16} /> Reset Local Data
        </button>
        {message && <p className="section-hint">{message}</p>}
      </div>

      <div className="section-group">
        <h3>Feedback</h3>
        <button className="btn-secondary btn-block" onClick={() => setShowBugReport(true)}>
          <Bug size={16} /> Report a Bug
        </button>
      </div>

      <p className="version-tag">Perfect Flow v0.3 · Cloud-synced songs · Setlists stored on this device</p>

      {showBugReport && (
        <div className="modal" onClick={() => setShowBugReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Report a Bug</h2>
            <p className="section-hint">What happened, and what were you doing right before it? The more detail, the faster it gets fixed.</p>
            <textarea
              rows="6" value={bugText} autoFocus placeholder="Describe the issue…"
              onChange={(e) => setBugText(e.target.value)}
            />

            {bugPhotoPreview ? (
              <div className="bug-photo-preview">
                <img src={bugPhotoPreview} alt="Attached screenshot" />
                <button className="btn-icon btn-danger" onClick={removeBugPhoto} title="Remove photo">
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <button className="btn-secondary btn-block" onClick={() => bugPhotoRef.current?.click()}>
                <ImagePlus size={16} /> Attach a Photo
              </button>
            )}
            <input ref={bugPhotoRef} type="file" accept="image/*" hidden onChange={handleBugPhotoChange} />

            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSubmitBug} disabled={submittingBug || !bugText.trim()}>
                {submittingBug ? 'Sending…' : 'Send Report'}
              </button>
              <button className="btn-secondary" onClick={() => { setShowBugReport(false); removeBugPhoto(); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
