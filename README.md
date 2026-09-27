# Perfect Flow v0.1

**Tagline:** Your Song. Your Flow.

A web-based performance tool for worship bands, live performers, solo musicians, and practice groups. Manage song libraries, edit chords and lyrics, queue up sets, and perform with full-screen mode featuring live transpose, font controls, and metronome.

## Features (v0.1)

### Core
- **Library** — Browse all songs with title, artist, key, BPM, time signature, section count
- **Search** — Filter by title or artist
- **Line-Up** — Queue songs for a live set, reorder, start performance in one tap
- **Editor**
  - Word-by-word chord assignment with diatonic suggestions per key
  - Section management (add, name, reorder, delete)
  - Drum cues (green) and accent/pause/stop/break marks (purple)
  - Paste raw lyrics → auto-parse to word grid
  - Full undo/redo history (50 steps)
- **Performance Mode**
  - Full-screen, no distractions
  - Vertical glowing progress bar (purple → blue → cyan)
  - Live transpose (semitones up/down)
  - Font size slider
  - Auto-scroll (off / slow / medium / fast)
  - Speaker-only metronome (Web Audio API)
  - Prev/Next navigation within a set + "Next: [title]" preview
- **Data Persistence** — All song data stored in browser localStorage
- **Brand** — Navy background, purple/blue/cyan gradient accents, Poppins font, embedded logo

## Deployment

### Web (Vercel)

1. Create free account at https://vercel.com
2. Connect your GitHub repo (or push this folder to GitHub)
3. Import project to Vercel — auto-deploys on every push
4. Live at `perfectflow.vercel.app`

**Or via Vercel CLI:**
```bash
npm i -g vercel
cd perfect-flow-workspace
vercel
```

Poppins font loads from Google Fonts (HTTPS only — works on Vercel).

### Mobile (Android Play Store)

Requires Capacitor scaffolding (included in plan, not in this repo yet). See [Roadmap](#roadmap).

## Development

### Setup

```bash
npm install
npm run build      # Build bundle
npm run watch      # Watch mode
npm run dev        # Build + serve on localhost:3000
```

### Build Output

- `public/index.html` — Shell with Poppins font, root div
- `public/bundle.js` — Full app (~1.2MB, minified)
- `public/manifest.json` — PWA config (Add to Home Screen on Android)
- `vercel.json` — SPA routing (all paths → index.html)

### Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 19 | Simple, fast, esbuild bundles to one file |
| Build | esbuild | 10x faster than webpack, zero config |
| Icons | lucide-react | Consistent, lightweight |
| Font | Poppins (Google Fonts) | Matches brand |
| Storage | localStorage | Zero backend, works offline |
| Audio | Web Audio API | Metronome, no dependencies |

### Project Structure

```
src/
  index.jsx                 ← Entry point
  App.jsx                   ← Main router & state
  components/
    Library.jsx             ← Song library + search
    LineUp.jsx              ← Set queue manager
    Editor.jsx              ← Chord/lyric editor
    Performance.jsx         ← Full-screen performance mode
  utils/
    chordUtils.js           ← Chord transposition
  styles.css                ← Brand colors, layout

public/
  index.html                ← HTML shell
  manifest.json             ← PWA config
  bundle.js                 ← Bundled app (generated)
  bundle.css                ← Bundled styles (generated)

vercel.json                 ← Vercel SPA routing
```

## Usage

1. **Create Songs** — Library tab → "New Song" → enter title, artist, key, BPM, time sig
2. **Edit Songs** — Click edit icon → add sections, paste/edit lyrics, assign chords
3. **Build Line-Up** — Library tab → click play icon next to each song to add to queue
4. **Perform** — Line-Up tab → "Start Set" → full-screen mode with all controls
5. **Live Transpose** — Use +/− buttons to shift chords in real time
6. **Auto-Scroll** — Choose speed, or manually scroll with finger/mouse

## Roadmap

### v0.2 — Quality of Life
- [ ] Capo field on song (shows "Capo 2" in performance header)
- [ ] Section bar counts (e.g., "8 bars") per section
- [ ] Dark/light theme toggle
- [ ] Swipe left/right between songs in performance mode
- [ ] BPM tap tempo button in editor

### v0.3 — Import / Export
- [ ] Export song as JSON (share between devices)
- [ ] Import JSON song file
- [ ] Export song as plain text (printable)
- [ ] Export set list as PDF

### v0.4 — Cloud Sync (requires backend)
- [ ] User accounts + cloud backup
- [ ] Multi-device sync
- [ ] Share songs via link (read-only view)
- [ ] Band workspace (multiple members, shared library)

### v0.5 — Community (requires backend)
- [ ] Public song pool (browse, rate, clone)
- [ ] Musician profiles + gig board
- [ ] Ratings and reviews

## Notes

- **No Analytics** — All data stays on-device; no tracking or data collection
- **App ID** — `com.perfectflow.app` (locked once published to Play Store)
- **Privacy** — Zero backend storage until v0.4; songs never leave your device
- **Offline** — Works completely offline; localStorage persists across sessions
- **PWA** — "Add to Home Screen" on Android Chrome gives app-like experience

## Questions?

For issues or feature requests, open an issue on GitHub or contact the dev team.

---

**Built with ❤️ for worship leaders and musicians.**
