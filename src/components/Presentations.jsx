import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Upload, Link2, ExternalLink, Trash2, MonitorPlay } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export default function Presentations({ profile, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('presentations')
      .select('*')
      .eq('owner_id', profile.id)
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.type !== 'application/pdf') { window.alert('Please upload a PDF file. Export your slides as PDF from PowerPoint, Keynote, or Google Slides.'); return; }

    setUploading(true);
    const path = `${profile.id}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('presentations').upload(path, file);
    if (uploadError) {
      window.alert('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }
    const { error: insertError } = await supabase.from('presentations').insert({
      owner_id: profile.id,
      title: title.trim() || file.name.replace(/\.pdf$/i, ''),
      file_path: path,
    });
    if (insertError) window.alert('Could not save: ' + insertError.message);
    setTitle('');
    setUploading(false);
    load();
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
    await supabase.storage.from('presentations').remove([item.file_path]);
    await supabase.from('presentations').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
  };

  const presentUrl = (id) => `${window.location.origin}/?present=${id}`;

  const handleCopyLink = (id) => {
    navigator.clipboard?.writeText(presentUrl(id));
    window.alert('Link copied. Add it as a Browser Source in OBS.');
  };

  return (
    <div className="view">
      <div className="view-header">
        <button className="btn-icon" onClick={onBack} title="Back">
          <ArrowLeft size={20} />
        </button>
        <h1>Presentations</h1>
      </div>

      <p className="section-hint">
        Upload slides as a PDF (export from PowerPoint, Keynote, or Google Slides). You'll get a link to add as an OBS
        Browser Source — click the left/right half of it (or use arrow keys) to step through slides live.
      </p>

      <div className="form-new-song">
        <input
          type="text" placeholder="Title (optional — defaults to file name)" value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn-primary btn-block" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload size={16} /> {uploading ? 'Uploading…' : 'Upload PDF'}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf" hidden onChange={handleUpload} />
      </div>

      <div className="song-list">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">No presentations yet. Upload a PDF to get started.</div>
        ) : (
          items.map(item => (
            <div key={item.id} className="song-card">
              <div className="practice-icon"><MonitorPlay size={18} /></div>
              <div className="song-info">
                <h3>{item.title}</h3>
                <p>{new Date(item.created_at).toLocaleDateString()}</p>
              </div>
              <div className="song-actions">
                <button className="btn-icon" onClick={() => handleCopyLink(item.id)} title="Copy OBS link">
                  <Link2 size={16} />
                </button>
                <a className="btn-icon" href={presentUrl(item.id)} target="_blank" rel="noreferrer" title="Open presenter view">
                  <ExternalLink size={16} />
                </a>
                <button className="btn-icon btn-danger" onClick={() => handleDelete(item)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
