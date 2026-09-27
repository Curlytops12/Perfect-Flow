# Deployment Guide

## Quick Start: Vercel (Recommended)

### Option 1: GitHub + Vercel (Auto-Deploy)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Perfect Flow v0.1"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/perfect-flow.git
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your `perfect-flow` repo
   - Framework: "Other"
   - Build Command: `npm run build`
   - Output Directory: `public`
   - Click "Deploy"

3. **Live** — your site is now live at `perfectflow.vercel.app`
   - Any push to `main` auto-redeploys in ~30 seconds
   - Users on the web see updates instantly

### Option 2: Vercel CLI (One-Click)

```bash
npm i -g vercel
vercel
```

Follow prompts. Choose:
- Framework: "Other"
- Build Command: `npm run build`
- Output Directory: `public`

Your URL will be shown. You can customize it in Vercel dashboard.

---

## Mobile: Android Play Store (Next Phase)

Scaffolding not included yet, but the plan is:

1. Unzip `perfect-flow-capacitor.zip` (separate download)
2. Copy new `bundle.js` from this build into Capacitor project
3. Open `android/` in Android Studio
4. Generate signed `.aab`
5. Upload to Google Play Console ($25 one-time)
6. Live in 1–3 days

---

## Local Testing

### Run Dev Server

```bash
npm run dev
```

Opens http://localhost:3000 in your browser. Auto-reloads on code changes.

### Just Rebuild

```bash
npm run build
```

Outputs `public/bundle.js` and `public/bundle.css`. Serve with any HTTP server:

```bash
npx http-server public -p 3000
```

---

## What Gets Deployed

Vercel serves the `public/` folder:

- `index.html` — Main page
- `bundle.js` — Full app (React + components + utilities)
- `bundle.css` — Styles
- `manifest.json` — PWA config

**No backend.** All data stays in browser localStorage.

---

## Update Workflow

1. Make code changes locally
2. Run `npm run build` to rebuild `bundle.js`
3. Commit and push to GitHub
4. Vercel auto-deploys in ~30 seconds
5. Users see the update on refresh (or PWA re-fetches)

---

## Custom Domain

### Add domain in Vercel

1. Go to project Settings → Domains
2. Add your domain (e.g., `perfectflow.app`)
3. Update DNS at your registrar (instructions in Vercel)

---

## Troubleshooting

| Issue | Fix |
|---|---|
| "bundle.js not found" | Run `npm run build` |
| Fonts not loading | Check Google Fonts URL in `public/index.html` (must be HTTPS) |
| Offline doesn't work | Clear browser cache, reload. Data is in localStorage |
| PWA won't install | Add to Home Screen from Android Chrome (not Safari) |

---

## Next Steps

1. **Deploy to Vercel** — Get a live URL
2. **Test on mobile** — PWA works on Android Chrome
3. **Set up custom domain** — `perfectflow.app`
4. **When ready:** Build Capacitor wrapper → Android Play Store
5. **Future:** Cloud sync backend, community features

---

See `README.md` for usage and `CLAUDE.md` for development notes.
