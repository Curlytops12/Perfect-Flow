# Perfect Flow — Development Notes

## Architecture

### State Management
- **App.jsx** is the root; holds all state: `songs`, `lineUp`, current view, performance mode
- No external state library (Redux, Zustand) — simple `useState` hooks
- Components receive props and callbacks; unidirectional data flow

### Persistence
- **localStorage** only — no backend
- `songs` array serialized to `perfectflow_songs` key
- `lineUp` array serialized to `perfectflow_lineup` key
- Auto-save on every state change (via `useEffect` with dependency tracking)

### Components

| Component | Role | Key Props |
|---|---|---|
| `Library.jsx` | Song browser + search | `songs`, `onAddSong`, `onEditSong`, `onDeleteSong`, `onAddToLineUp` |
| `LineUp.jsx` | Set queue | `songs`, `onRemove`, `onReorder`, `onStartSet` |
| `Editor.jsx` | Chord/lyric editor | `song`, `onSave`, `onCancel` + history state |
| `Performance.jsx` | Full-screen mode | `lineUp`, `currentIndex`, `onNextSong`, `onPrevSong`, `onExit` |

### Styling
- **CSS variables** in `:root` for brand colors
- **No CSS-in-JS** — keeps bundle small
- **Responsive grid** for editor layout
- Smooth gradients on buttons (purple → blue → cyan)

---

## Song Data Structure

```javascript
{
  id: 1234567890,
  title: "Amazing Grace",
  artist: "John Newton",
  key: "G",
  bpm: 90,
  timeSignature: "4/4",
  sections: [
    {
      id: 1234567891,
      name: "Verse",
      lines: [
        {
          id: 1234567892,
          words: [
            {
              id: 1234567893,
              text: "Amazing",
              chord: "G",
              cue: ""
            },
            {
              id: 1234567894,
              text: "grace",
              chord: "D",
              cue: "drum"
            }
          ]
        }
      ]
    }
  ]
}
```

**Notes:**
- `cue` values: `"drum"` (green), `"accent"` / `"pause"` / `"stop"` / `"break"` (purple), or `""` (none)
- `chord` is user input; suggestions come from diatonic chords per key
- Each entity has a unique `id` (timestamp-based) for React keys

---

## Build & Bundle

### esbuild
- Single-pass bundler; no plugins needed
- Outputs to `public/bundle.js` (~1.2MB minified)
- Includes React + lucide-react + all components in one file
- `--platform=browser` removes Node.js API usage

### CSS
- Bundled into `public/bundle.css` by esbuild
- Google Fonts loaded via `@import` in `src/styles.css`
- CSS variables for theming (could be theme-switchable in v0.2)

### No Code Splitting
- Single bundle is simpler for PWA / mobile apps
- 1.2MB is acceptable for modern connections

---

## Chord Transposition

**File:** `src/utils/chordUtils.js`

```javascript
transposeChord("G", 2)  // → "A"
transposeChord("C#m", -1)  // → "Cm"
```

- Chromatic scale: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
- Handles sharps/flats; preserves suffix (m, 7, maj7, etc.)
- Wraps at octave boundary (modulo 12)

---

## Performance Mode

### Controls
- **Transpose:** Semitone up/down; lives in component state, not persisted
- **Font Size:** 12–32px slider
- **Auto-Scroll:** 0 (off), 1, 2, 4 px per 100ms
- **Metronome:** Web Audio API; plays 1kHz beep at song BPM

### UI Elements
- Vertical progress bar (left side) — glows with animation
- Song info header (artist, key, BPM)
- Full-screen lyrics/chords grid
- Footer with prev/next, song counter, "Next: [title]" preview

### Responsive
- Touch-friendly on mobile
- Swipe not yet implemented (v0.2 feature)
- Font size slider adjusts readability on any device

---

## Editor Features

### Undo/Redo
- Maintains 50-step history array
- Each edit creates a new state snapshot
- `historyIndex` tracks current position
- Undo/redo buttons disabled at boundaries

### Lyrics Import
- Paste raw lyrics → split on newlines
- Each line → split on whitespace → word array
- Modal input; appends to first section

### Diatonic Chords
- 6-chord suggestions per key (I, ii, iii, IV, V, vi)
- Hardcoded in `Editor.jsx` for C, D, E, F, G, A, Bb
- Could be expanded to all 12 keys + minor (future)

---

## Known Limitations (v0.1)

- ❌ No multi-user sync (local device only)
- ❌ No cloud backup (localStorage only)
- ❌ No swipe gestures in performance mode
- ❌ No PDF export
- ❌ No capo field
- ❌ No bar counts per section
- ❌ No dark/light theme toggle

See `README.md` Roadmap for v0.2–v0.5 plans.

---

## Testing Checklist

Before shipping:

- [ ] Create a song (verify sections appear)
- [ ] Edit lyrics (paste raw lyrics, auto-parse works)
- [ ] Assign chords (suggestions appear for key)
- [ ] Add drum cue + accent marks
- [ ] Undo/redo works (full 50-step history)
- [ ] Add song to line-up
- [ ] Reorder line-up
- [ ] Start performance mode
- [ ] Transpose works (chords shift correctly)
- [ ] Font size slider works
- [ ] Auto-scroll works (all speeds)
- [ ] Metronome plays (check speaker only, not phone speaker)
- [ ] Prev/next navigation
- [ ] Exit performance → back to line-up
- [ ] Refresh page → data persisted in localStorage
- [ ] Mobile browser: "Add to Home Screen" works (PWA)

---

## Performance Tips

- **Bundle size:** ~1.2MB is large; consider splitting for v0.5 if users on slow networks
- **Re-renders:** App re-renders on every state change; could optimize with `useMemo` / `useCallback` if performance issues arise
- **localStorage:** Serialization/deserialization on every change; fine for <100 songs, but slow for 1000+
- **MetronomeRef:** Web Audio Context created on-demand; persists for multiple plays (efficient)

---

## Future Work

1. **v0.2** — Capo, bar counts, theme toggle, swipes, tap tempo
2. **v0.3** — JSON/PDF export, plain-text export
3. **v0.4** — Cloud backend (Firebase/Supabase), user accounts, sync
4. **v0.5** — Public song pool, community features
5. **Mobile** — Capacitor wrapper for Play Store / App Store

See `README.md` for detailed roadmap.

---

## External Dependencies

| Lib | Version | Why | License |
|---|---|---|---|
| React | ^19.3.0 | UI library | MIT |
| React-DOM | ^19.3.0 | Browser rendering | MIT |
| lucide-react | ^1.48.0 | Icons | ISC |
| esbuild | ^0.28.2 | Bundler (dev only) | MIT |
| Poppins font | — | Google Fonts | OFL |

No other dependencies. Minimal attack surface.

---

## Git Workflow

```bash
# Create new feature branch
git checkout -b feature/new-feature

# Make changes, test locally
npm run watch  # or `npm run dev`

# Commit
git add src/
git commit -m "feat: add new feature"

# Push and open PR
git push origin feature/new-feature
```

Commits pushed to `main` auto-deploy via Vercel.

---

## Questions?

Refer to `README.md` for user-facing docs and `DEPLOY.md` for deployment steps.
