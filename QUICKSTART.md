# Perfect Flow — Quick Start

## 🚀 Deploy in 3 Steps

### 1. Push to GitHub

```bash
cd ~/Downloads/Perfect\ Flow\ Workspace
git init
git add .
git commit -m "Initial commit: Perfect Flow v0.1 built"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/perfect-flow.git
git push -u origin main
```

### 2. Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `perfect-flow` repo
4. Framework: **"Other"**
5. Build Command: **`npm run build`**
6. Output Directory: **`public`**
7. Click **"Deploy"**

### 3. Done! 🎉

Your app is live at `https://perfectflow.vercel.app`

---

## 📱 Local Testing

```bash
# Install dependencies
npm install

# Build the app
npm run build

# Start dev server (with auto-reload)
npm run watch

# Serve on localhost:3000
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🎵 First Song

1. Click **Library** tab
2. Click **New Song**
3. Enter:
   - Title: "Amazing Grace"
   - Artist: "John Newton"
   - Key: "G"
   - BPM: 90
   - Time Signature: "4/4"
4. Click **Save Song**

---

## ✍️ Edit the Song

1. Click the **edit icon** next to "Amazing Grace"
2. In the Editor, click **Import Lyrics**
3. Paste:
   ```
   Amazing grace how sweet the sound
   That saved a wretch like me
   I once was lost but now am found
   Was blind but now I see
   ```
4. Click **Import**
5. Click on each word to assign chords (or leave blank)
6. Click **Save**

---

## 🎤 Perform

1. Click **Line-Up** tab
2. Go back to **Library** and click the **play icon** next to "Amazing Grace"
3. Back to **Line-Up**, click **Start Set**
4. **Full-screen performance mode!**
   - Use +/− to transpose (shift chords)
   - Drag slider to change font size
   - Choose auto-scroll speed
   - Click volume icon for metronome
   - Use arrow buttons to go to next/prev song

---

## 📖 What's Built?

✅ **Complete v0.1 app:**
- Song library with search
- Chord + lyric editor with undo/redo
- Line-up queue manager
- Full-screen performance mode
- Live transpose
- Auto-scroll + metronome
- Offline-first (localStorage)
- PWA (Add to Home Screen)

❌ **Not yet:**
- Cloud sync (v0.4)
- Mobile app store (Android/iOS)
- Community features (v0.5)

---

## 📚 Documentation

- **README.md** — Features, roadmap, tech stack
- **DEPLOY.md** — Detailed deployment guide
- **CLAUDE.md** — Architecture, data structures, development notes

---

## 🔗 Next Steps

1. **Deploy to Vercel** → share URL with friends
2. **Test on mobile** → Android Chrome supports PWA ("Add to Home Screen")
3. **Customize domain** → add `perfectflow.app` in Vercel settings
4. **Build Android app** → (Capacitor scaffolding in roadmap)

---

## ❓ Troubleshooting

| Issue | Fix |
|---|---|
| `npm run build` fails | Run `npm install` first |
| "Can't find localhost:3000" | Make sure no other app is on port 3000 |
| Bundle is old | Run `npm run build` again before deploying |
| Data not persisting | Check browser's localStorage (enable in settings) |
| Fonts look wrong | Clear browser cache |

---

**Questions?** See README.md or DEPLOY.md for more details.

**Ready to ship!** 🚀
