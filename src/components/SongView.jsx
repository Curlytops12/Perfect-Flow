import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Edit2, Star, Trash2 } from 'lucide-react';
import { KNOWN_CUES } from '../utils/constants';
import { supabase } from '../utils/supabaseClient';

export default function SongView({ song, profile, onEdit, onBack }) {
  const hasLyrics = song.sections?.some(s => s.lines?.length > 0);
  const isOwner = profile && song.ownerId === profile.id;

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');
  const [hoverStar, setHoverStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    if (!song.isPublished) return;
    setLoadingReviews(true);
    const { data, error } = await supabase
      .from('song_reviews')
      .select('*, profiles(username, display_name)')
      .eq('song_id', song.id)
      .order('created_at', { ascending: false });
    if (!error && data) {
      setReviews(data);
      const mine = data.find(r => r.reviewer_id === profile?.id);
      if (mine) {
        setMyRating(mine.rating);
        setMyComment(mine.comment || '');
      }
    }
    setLoadingReviews(false);
  }, [song.id, song.isPublished, profile?.id]);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  const handleSubmitReview = async () => {
    if (!profile || myRating < 1) return;
    setSubmitting(true);
    const { error } = await supabase.from('song_reviews').upsert({
      song_id: song.id,
      reviewer_id: profile.id,
      rating: myRating,
      comment: myComment.trim(),
    }, { onConflict: 'song_id,reviewer_id' });
    setSubmitting(false);
    if (error) { window.alert('Could not save review: ' + error.message); return; }
    loadReviews();
  };

  const handleDeleteReview = async () => {
    if (!profile) return;
    await supabase.from('song_reviews').delete().eq('song_id', song.id).eq('reviewer_id', profile.id);
    setMyRating(0);
    setMyComment('');
    loadReviews();
  };

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
        {isOwner && (
          <button className="btn-primary" onClick={onEdit}>
            <Edit2 size={16} /> Edit
          </button>
        )}
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
                      <div key={word.id} className="perf-word">
                        <div className="perf-word-top">
                          {word.cue && (
                            KNOWN_CUES.includes(word.cue)
                              ? <span className={`cue-dot cue-${word.cue}`} />
                              : <span className="cue-custom">{word.cue}</span>
                          )}
                          {word.chord && <span className="chord">{word.chord}</span>}
                        </div>
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

      {song.isPublished && (
        <div className="section-group review-section">
          <h3>Ratings & Reviews</h3>

          {reviews.length > 0 && (
            <div className="review-summary">
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={16} fill={n <= Math.round(avgRating) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span>{avgRating.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
            </div>
          )}

          {profile && !isOwner && (
            <div className="review-form">
              <div className="review-stars review-stars-input">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className="star-btn"
                    onMouseEnter={() => setHoverStar(n)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setMyRating(n)}
                  >
                    <Star size={22} fill={n <= (hoverStar || myRating) ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share a quick review (optional)…" rows="3" value={myComment}
                onChange={(e) => setMyComment(e.target.value)}
              />
              <div className="form-actions">
                <button className="btn-primary" disabled={myRating < 1 || submitting} onClick={handleSubmitReview}>
                  {submitting ? 'Saving…' : 'Save Review'}
                </button>
                {myRating > 0 && (
                  <button className="btn-icon btn-danger" onClick={handleDeleteReview} title="Remove my review">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {loadingReviews ? (
            <p className="section-hint">Loading reviews…</p>
          ) : reviews.filter(r => r.comment).length > 0 && (
            <div className="review-list">
              {reviews.filter(r => r.comment).map(r => (
                <div key={r.id} className="review-item">
                  <div className="review-item-head">
                    <span className="review-author">{r.profiles?.display_name || r.profiles?.username || 'Someone'}</span>
                    <span className="review-stars">
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} size={12} fill={n <= r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </span>
                  </div>
                  <p>{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
