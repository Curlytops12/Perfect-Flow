import React, { useState } from 'react';
import {
  Save, X, Plus, Trash2, Copy, GripVertical, Undo2, Redo2,
  Scissors, CornerLeftUp, FileText, UnfoldVertical, ChevronUp, ChevronDown, PanelLeft,
} from 'lucide-react';
import { SECTION_TYPES, KEYS, KNOWN_CUES } from '../utils/constants';

const DIATONIC_CHORDS = {
  C: ['C', 'Dm', 'Em', 'F', 'G', 'Am'],
  D: ['D', 'Em', 'F#m', 'G', 'A', 'Bm'],
  E: ['E', 'F#m', 'G#m', 'A', 'B', 'C#m'],
  F: ['F', 'Gm', 'Am', 'Bb', 'C', 'Dm'],
  G: ['G', 'Am', 'Bm', 'C', 'D', 'Em'],
  A: ['A', 'Bm', 'C#m', 'D', 'E', 'F#m'],
  Bb: ['Bb', 'Cm', 'Dm', 'Eb', 'F', 'Gm'],
};

const uid = () => Date.now() + Math.random();

const nameForType = (sections, type, customName) => {
  if (type === 'Other') return (customName || '').trim() || 'Other';
  const count = sections.filter(s => s.type === type).length;
  return count === 0 ? type : `${type} ${count + 1}`;
};

export default function Editor({ song, onSave, onCancel }) {
  const [edited, setEdited] = useState(song);
  const [history, setHistory] = useState([song]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lyricsSectionId, setLyricsSectionId] = useState(null);
  const [lyricsInput, setLyricsInput] = useState('');
  const [typePicker, setTypePicker] = useState(null); // { sectionId, lineIdx }
  const [wordPopup, setWordPopup] = useState(null); // { sectionId, lineIdx, wordId }
  const [dragIndex, setDragIndex] = useState(null);
  const [customNameRequest, setCustomNameRequest] = useState(null); // { onConfirm }
  const [customNameInput, setCustomNameInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const addToHistory = (newState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setEdited(newState);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setEdited(history[idx]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setEdited(history[idx]);
    }
  };

  const updateSongBasic = (updates) => addToHistory({ ...edited, ...updates });

  const updateSection = (sectionId, updates) => {
    const sections = edited.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s);
    addToHistory({ ...edited, sections });
  };

  const addSection = (type) => {
    if (type === 'Other') {
      setCustomNameInput('');
      setCustomNameRequest({
        onConfirm: (customName) => {
          const name = nameForType(edited.sections, type, customName);
          const sections = [...edited.sections, { id: uid(), name, type, lines: [] }];
          addToHistory({ ...edited, sections });
        },
      });
      return;
    }
    const name = nameForType(edited.sections, type, null);
    const sections = [...edited.sections, { id: uid(), name, type, lines: [] }];
    addToHistory({ ...edited, sections });
  };

  const duplicateSection = (sectionId) => {
    const idx = edited.sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const original = edited.sections[idx];
    const clone = {
      ...original,
      id: uid(),
      name: `${original.name} Copy`,
      lines: original.lines.map(line => ({
        ...line,
        id: uid(),
        words: line.words.map(w => ({ ...w, id: uid() })),
      })),
    };
    const sections = [...edited.sections];
    sections.splice(idx + 1, 0, clone);
    addToHistory({ ...edited, sections });
  };

  const deleteSection = (sectionId) => {
    const sections = edited.sections.filter(s => s.id !== sectionId);
    addToHistory({ ...edited, sections });
  };

  const reorderSections = (fromIdx, toIdx) => {
    const sections = [...edited.sections];
    const [moved] = sections.splice(fromIdx, 1);
    sections.splice(toIdx, 0, moved);
    addToHistory({ ...edited, sections });
  };

  const moveSection = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= edited.sections.length) return;
    reorderSections(idx, newIdx);
  };

  const joinWithPrevious = (sectionId) => {
    const idx = edited.sections.findIndex(s => s.id === sectionId);
    if (idx <= 0) return;
    const prev = edited.sections[idx - 1];
    const current = edited.sections[idx];
    const merged = { ...prev, lines: [...prev.lines, ...current.lines] };
    const sections = [...edited.sections];
    sections.splice(idx - 1, 2, merged);
    addToHistory({ ...edited, sections });
  };

  const splitSectionAt = (sectionId, lineIdx, type, customName) => {
    const idx = edited.sections.findIndex(s => s.id === sectionId);
    if (idx === -1) return;
    const section = edited.sections[idx];
    if (lineIdx <= 0 || lineIdx >= section.lines.length) return;
    const name = nameForType(edited.sections, type, customName);
    const firstLines = section.lines.slice(0, lineIdx);
    const secondLines = section.lines.slice(lineIdx);
    const sections = [...edited.sections];
    sections[idx] = { ...section, lines: firstLines };
    sections.splice(idx + 1, 0, { id: uid(), name, type, lines: secondLines });
    addToHistory({ ...edited, sections });
  };

  const handleTypePick = (type) => {
    if (!typePicker) return;
    const { sectionId, lineIdx } = typePicker;
    if (type === 'Other') {
      setCustomNameInput('');
      setCustomNameRequest({
        onConfirm: (customName) => splitSectionAt(sectionId, lineIdx, type, customName),
      });
      setTypePicker(null);
      return;
    }
    splitSectionAt(sectionId, lineIdx, type, null);
    setTypePicker(null);
  };

  const toggleLineGap = (sectionId, lineIdx) => {
    const sections = edited.sections.map(s => {
      if (s.id !== sectionId) return s;
      const lines = [...s.lines];
      lines[lineIdx] = { ...lines[lineIdx], gapBefore: !lines[lineIdx].gapBefore };
      return { ...s, lines };
    });
    addToHistory({ ...edited, sections });
  };

  const updateLine = (sectionId, lineIdx, updates) => {
    const sections = edited.sections.map(s => {
      if (s.id === sectionId) {
        const lines = [...s.lines];
        lines[lineIdx] = { ...lines[lineIdx], ...updates };
        return { ...s, lines };
      }
      return s;
    });
    addToHistory({ ...edited, sections });
  };

  const addLine = (sectionId) => {
    const sections = edited.sections.map(s =>
      s.id === sectionId ? { ...s, lines: [...s.lines, { id: uid(), words: [] }] } : s
    );
    addToHistory({ ...edited, sections });
  };

  const deleteLine = (sectionId, lineIdx) => {
    const sections = edited.sections.map(s =>
      s.id === sectionId ? { ...s, lines: s.lines.filter((_, i) => i !== lineIdx) } : s
    );
    addToHistory({ ...edited, sections });
  };

  const openLyricsModal = (sectionId) => {
    setLyricsSectionId(sectionId);
    setLyricsInput('');
  };

  const parseAndAddLyrics = () => {
    if (!lyricsInput.trim() || !lyricsSectionId) return;
    const newLines = lyricsInput.split('\n').filter(l => l.trim()).map(line => ({
      id: uid(),
      words: line.trim().split(/\s+/).map(word => ({ id: uid(), text: word, chord: '', cue: '' })),
    }));
    const sections = edited.sections.map(s =>
      s.id === lyricsSectionId ? { ...s, lines: [...s.lines, ...newLines] } : s
    );
    addToHistory({ ...edited, sections });
    setLyricsInput('');
    setLyricsSectionId(null);
  };

  const updateWord = (updates) => {
    if (!wordPopup) return;
    const { sectionId, lineIdx, wordId } = wordPopup;
    const section = edited.sections.find(s => s.id === sectionId);
    const line = section?.lines[lineIdx];
    if (!line) return;
    const words = line.words.map(w => w.id === wordId ? { ...w, ...updates } : w);
    updateLine(sectionId, lineIdx, { words });
  };

  const removeWord = () => {
    if (!wordPopup) return;
    const { sectionId, lineIdx, wordId } = wordPopup;
    const section = edited.sections.find(s => s.id === sectionId);
    const line = section?.lines[lineIdx];
    if (!line) return;
    const words = line.words.filter(w => w.id !== wordId);
    updateLine(sectionId, lineIdx, { words });
    setWordPopup(null);
  };

  const handleSave = () => {
    if (!edited.title.trim()) {
      window.alert('Please give this song a title before saving.');
      return;
    }
    onSave(edited);
  };

  const suggestedChords = DIATONIC_CHORDS[edited.key] || [];

  let wordPopupData = null;
  if (wordPopup) {
    const section = edited.sections.find(s => s.id === wordPopup.sectionId);
    const line = section?.lines[wordPopup.lineIdx];
    const word = line?.words.find(w => w.id === wordPopup.wordId);
    if (word) wordPopupData = word;
  }
  const isCustomCue = wordPopupData && wordPopupData.cue && !KNOWN_CUES.includes(wordPopupData.cue);

  return (
    <div className="view">
      <div className="view-header">
        <h1>{edited.title ? `Edit: ${edited.title}` : 'New Song'}</h1>
        <div className="header-actions">
          <button className="btn-icon" onClick={undo} disabled={historyIndex === 0} title="Undo">
            <Undo2 size={20} />
          </button>
          <button className="btn-icon" onClick={redo} disabled={historyIndex === history.length - 1} title="Redo">
            <Redo2 size={20} />
          </button>
          <button className="btn-primary" onClick={handleSave}>
            <Save size={20} /> Save
          </button>
          <button className="btn-secondary" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="editor-container">
        {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}

        <div className={`editor-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <button className="sidebar-close-btn btn-icon" onClick={() => setSidebarOpen(false)} title="Close">
            <X size={18} />
          </button>
          <div className="section-group">
            <h3>Song Info</h3>
            <label>
              Title
              <input
                type="text" value={edited.title} placeholder="Song title" autoFocus={!edited.title}
                onChange={(e) => updateSongBasic({ title: e.target.value })}
              />
            </label>
            <label>
              Artist
              <input
                type="text" value={edited.artist} placeholder="Artist"
                onChange={(e) => updateSongBasic({ artist: e.target.value })}
              />
            </label>
            <label>
              Key
              <select value={edited.key} onChange={(e) => updateSongBasic({ key: e.target.value })}>
                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </label>
            <label>
              BPM
              <input
                type="number" min="40" max="300" value={edited.bpm}
                onChange={(e) => updateSongBasic({ bpm: parseInt(e.target.value) || 0 })}
              />
            </label>
            <label>
              Time Signature
              <select value={edited.timeSignature} onChange={(e) => updateSongBasic({ timeSignature: e.target.value })}>
                {['2/4', '3/4', '4/4', '5/4', '6/8'].map(ts => <option key={ts} value={ts}>{ts}</option>)}
              </select>
            </label>
            <label>
              Category
              <select value={edited.category} onChange={(e) => updateSongBasic({ category: e.target.value })}>
                {['Worship', 'Band', 'Solo', 'Practice', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          {edited.sections.length > 0 && (
            <div className="section-group">
              <h3>Structure</h3>
              {edited.sections.map((section, idx) => (
                <div
                  key={section.id}
                  className={`section-item ${dragIndex === idx ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => setDragIndex(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragIndex !== null && dragIndex !== idx) reorderSections(dragIndex, idx);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                >
                  <span className="drag-handle"><GripVertical size={14} /></span>
                  <input
                    type="text" value={section.name} className="section-name-input"
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                  />
                  <div className="section-item-actions">
                    <button onClick={() => moveSection(idx, -1)} className="btn-icon" disabled={idx === 0} title="Move up">
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSection(idx, 1)} className="btn-icon"
                      disabled={idx === edited.sections.length - 1} title="Move down"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button onClick={() => duplicateSection(section.id)} className="btn-icon" title="Duplicate">
                      <Copy size={14} />
                    </button>
                    <button onClick={() => deleteSection(section.id)} className="btn-icon btn-danger" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="section-group">
            <h3>Add Section</h3>
            <div className="type-grid">
              {SECTION_TYPES.map(t => (
                <button key={t} className="type-btn" onClick={() => addSection(t)}>
                  <Plus size={12} /> {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="editor-main">
          <button className="song-info-toggle-btn" onClick={() => setSidebarOpen(true)}>
            <PanelLeft size={16} /> Song Info &amp; Structure
          </button>

          {edited.sections.length === 0 ? (
            <div className="editor-empty">
              <p>Start by adding a section — paste your full lyrics into it, then split it up wherever a new part begins.</p>
              <div className="type-grid type-grid-lg">
                {SECTION_TYPES.map(t => (
                  <button key={t} className="type-btn" onClick={() => addSection(t)}>
                    <Plus size={14} /> {t}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            edited.sections.map((section, idx) => (
              <div key={section.id} className="section-editor">
                {idx > 0 && (
                  <button className="join-btn" onClick={() => joinWithPrevious(section.id)}>
                    <CornerLeftUp size={13} /> Join with section above
                  </button>
                )}

                <div className="section-editor-header">
                  <input
                    type="text" value={section.name} className="section-title-input"
                    onChange={(e) => updateSection(section.id, { name: e.target.value })}
                  />
                  <button
                    className="btn-icon" onClick={() => moveSection(idx, -1)}
                    disabled={idx === 0} title="Move section up"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    className="btn-icon" onClick={() => moveSection(idx, 1)}
                    disabled={idx === edited.sections.length - 1} title="Move section down"
                  >
                    <ChevronDown size={16} />
                  </button>
                  <button className="btn-icon" onClick={() => duplicateSection(section.id)} title="Duplicate section">
                    <Copy size={16} />
                  </button>
                  <button className="btn-icon btn-danger" onClick={() => deleteSection(section.id)} title="Delete section">
                    <Trash2 size={16} />
                  </button>
                </div>

                {section.lines.length === 0 ? (
                  <button className="btn-secondary btn-block" onClick={() => openLyricsModal(section.id)}>
                    <FileText size={16} /> Add Lyrics
                  </button>
                ) : (
                  <>
                    {section.lines.map((line, lineIdx) => (
                      <React.Fragment key={line.id}>
                        <div className={`line-editor ${line.gapBefore ? 'line-editor-gap' : ''}`}>
                          <div className="words-grid">
                            {line.words.map(word => (
                              <button
                                key={word.id}
                                className="word-chip"
                                onClick={() => setWordPopup({ sectionId: section.id, lineIdx, wordId: word.id })}
                              >
                                {word.chord && <span className="chord-tag">{word.chord}</span>}
                                <span className="word-chip-text">{word.text}</span>
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => deleteLine(section.id, lineIdx)}
                            className="btn-icon btn-danger line-delete"
                            title="Delete line"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {lineIdx < section.lines.length - 1 && (
                          <div className="line-gap-actions">
                            <button
                              className="cut-btn"
                              onClick={() => setTypePicker({ sectionId: section.id, lineIdx: lineIdx + 1 })}
                            >
                              <Scissors size={12} /> Split section here
                            </button>
                            <button
                              className={`space-btn ${section.lines[lineIdx + 1]?.gapBefore ? 'active' : ''}`}
                              onClick={() => toggleLineGap(section.id, lineIdx + 1)}
                            >
                              <UnfoldVertical size={12} />
                              {section.lines[lineIdx + 1]?.gapBefore ? 'Remove space' : 'Add space'}
                            </button>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                    <div className="section-footer-actions">
                      <button onClick={() => openLyricsModal(section.id)} className="btn-secondary">
                        <Plus size={16} /> Add More Lyrics
                      </button>
                      <button onClick={() => addLine(section.id)} className="btn-secondary">
                        <Plus size={16} /> Add Blank Line
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {lyricsSectionId && (
        <div className="modal" onClick={() => setLyricsSectionId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add Lyrics</h2>
            <p className="section-hint">Paste the lyrics for this part of the song — one line per row. You can split it into separate sections afterward.</p>
            <textarea
              placeholder="Paste lyrics here…" value={lyricsInput} rows="10" autoFocus
              onChange={(e) => setLyricsInput(e.target.value)}
            />
            <div className="modal-actions">
              <button className="btn-primary" onClick={parseAndAddLyrics}>Add</button>
              <button className="btn-secondary" onClick={() => setLyricsSectionId(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {typePicker && (
        <div className="modal" onClick={() => setTypePicker(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>New section starts as…</h2>
            <div className="type-grid">
              {SECTION_TYPES.map(t => (
                <button key={t} className="type-btn" onClick={() => handleTypePick(t)}>{t}</button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setTypePicker(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {customNameRequest && (
        <div className="modal" onClick={() => setCustomNameRequest(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Name this section</h2>
            <input
              type="text" className="modal-text-input" value={customNameInput} autoFocus
              placeholder="e.g. Tag, Reprise, Testimony"
              onChange={(e) => setCustomNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  customNameRequest.onConfirm(customNameInput);
                  setCustomNameRequest(null);
                }
              }}
            />
            <div className="modal-actions">
              <button
                className="btn-primary"
                onClick={() => { customNameRequest.onConfirm(customNameInput); setCustomNameRequest(null); }}
              >
                Add
              </button>
              <button className="btn-secondary" onClick={() => setCustomNameRequest(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {wordPopupData && (
        <div className="modal" onClick={() => setWordPopup(null)}>
          <div className="modal-content word-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Word</h2>
            <label className="word-popup-label">
              Lyric
              <input
                type="text" value={wordPopupData.text} autoFocus
                onChange={(e) => updateWord({ text: e.target.value })}
              />
            </label>
            <label className="word-popup-label">
              Chord
              <input
                type="text" value={wordPopupData.chord || ''} placeholder="e.g. G, Am7"
                onChange={(e) => updateWord({ chord: e.target.value })}
              />
            </label>
            {suggestedChords.length > 0 && (
              <div className="chord-suggest-grid">
                {suggestedChords.map(c => (
                  <button key={c} className="chord-suggest-btn" onClick={() => updateWord({ chord: c })}>{c}</button>
                ))}
                <button className="chord-suggest-btn clear" onClick={() => updateWord({ chord: '' })}>Clear</button>
              </div>
            )}
            <label className="word-popup-label">
              Cue
              <select
                value={isCustomCue ? '__custom__' : (wordPopupData.cue || '')}
                onChange={(e) => {
                  const v = e.target.value;
                  updateWord({ cue: v === '__custom__' ? 'Custom' : v });
                }}
              >
                <option value="">—</option>
                <option value="drum">🟢 Drum</option>
                <option value="accent">🟣 Accent</option>
                <option value="pause">🟣 Pause</option>
                <option value="stop">🟣 Stop</option>
                <option value="break">🟣 Break</option>
                <option value="__custom__">✏️ Custom…</option>
              </select>
            </label>
            {isCustomCue && (
              <label className="word-popup-label">
                Custom Cue Label
                <input
                  type="text" value={wordPopupData.cue} autoFocus placeholder="e.g. Key Change, Shout"
                  onChange={(e) => updateWord({ cue: e.target.value })}
                />
              </label>
            )}
            <div className="modal-actions">
              <button className="btn-icon btn-danger" onClick={removeWord} title="Remove word">
                <Trash2 size={16} />
              </button>
              <button className="btn-primary" onClick={() => setWordPopup(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
