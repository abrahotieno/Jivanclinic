# Jivan Wellness Clinic —

Static site for **Jivan Wellness Clinic** (Nairobi): wellness and neuro-therapy positioning, MindSpring and Synaptech divisions, waitlist and opening information. Built as plain **HTML, CSS, and JavaScript** with no bundler or app framework.

## Stack

- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting) — project `jivan-wellness`
- **CI/CD:** GitHub Actions — [Firebase Hosting deploy action](https://github.com/FirebaseExtended/action-hosting-deploy)
- **Content:** `public/` is the deploy root (see `firebase.json`)

## Repository layout

| Path | Purpose |
|------|--------|
| `public/index.html` | Main page |
| `public/assets/jivan-wellness.css` | Styles |
| `public/assets/jivan-wellness.js` | Mobile nav, smooth scroll, footer year |
| `public/assets/*` | Images (logos, photos) and other static assets |
| `firebase.json` / `.firebaserc` | Firebase Hosting config and default project |
| `.github/workflows/firebase-hosting.yml` | Deploy workflow |

## Local preview

There is no `package.json`; the site is static files only.

**Option A — Firebase (closest to production)**

```bash
npm install -g firebase-tools
firebase login
firebase serve --only hosting
```

Open the URL shown (typically `http://localhost:5000`).

**Option B — any static server from `public/`**

```bash
cd public && python3 -m http.server 8080
```

Or: `npx --yes serve public` (downloads `serve` on the fly).

**Option C — open `index.html` in your browser**

From Finder (macOS) or File Explorer (Windows), open `public/index.html`, or drag that file into a browser window. Paths like `assets/jivan-wellness.css` resolve relative to that file, so keep the `public/` folder layout intact.

This is the quickest check for layout and copy. It does not match production exactly (you are using a `file://` URL). Prefer Option A or B if something behaves oddly or if you want the same origin and URL shape as the live site.

## Deployment

| Event | What runs |
|-------|-----------|
| **Pull request** (same-repo branches only) | Preview channel + PR comment with preview URL |
| **Push to `main`** | Live site (`channelId: live`) |

Workflow: `.github/workflows/firebase-hosting.yml`.

### GitHub secret

The workflow expects a Firebase service account JSON in:

`FIREBASE_SERVICE_ACCOUNT_JIVAN_WELLNESS`

Configure this in the repository **Settings → Secrets and variables → Actions**. PR previews from forks are skipped by design (`preview` job `if` condition) because secrets are not available to untrusted forks.

### Manual deploy

With Firebase CLI and credentials:

```bash
firebase deploy --only hosting
```

## Contributing

- Edit files under `public/` for anything that ships to the website.
- Put new images and static files under `public/assets/` and reference them from `index.html` as `assets/…`.

## License

If this repository is private or public, add your license here when you choose one.
