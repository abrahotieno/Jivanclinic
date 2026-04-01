# Jivan Wellness Clinic — Website

This repository holds the public website for **Jivan Wellness Clinic** in Nairobi: the main page, styling, images, and light interactivity (mobile menu, smooth scrolling). There is no backend in this repo—the site is a set of files we host on the web.

---

## For developers: day-to-day workflow

Follow these steps so everyone works from the same starting point and deploys in a predictable order.

### 1. Get the latest work from `sandbox`

Always base your work on **`sandbox`**, not on `main`, unless a maintainer tells you otherwise.

```bash
git checkout sandbox
git pull origin sandbox
```

### 2. Start a branch for your changes

```bash
git checkout -b your-branch-name
```

Use a short, clear name (for example `fix-hero-copy` or `add-team-photo`).

### 3. Make your edits

- The page people see is **`public/index.html`**.
- Styles live in **`public/assets/jivan-wellness.css`**.
- Small scripts (menu, scroll behavior) are in **`public/assets/jivan-wellness.js`**.
- New images or other files go in **`public/assets/`**, then link to them from `index.html` with paths like `assets/your-file.png`.

### 4. See the site on your computer

You do **not** need Node or a database for this project. Pick whichever option is easiest:

**Quickest — open the file**

- On Mac or Windows, open **`public/index.html`** in Chrome, Edge, or Safari (double-click or drag the file into the browser).

**Better match to the real site — tiny local server**

- Open a terminal, go to the project folder, then:

```bash
cd public
python3 -m http.server 8080
```

- In the browser, visit `http://localhost:8080`.

**Optional — same tooling as our hosting provider**

If you already use [Firebase](https://firebase.google.com/) for other work:

```bash
npm install -g firebase-tools
firebase login
firebase serve --only hosting
```

Use the URL the command prints (often `http://localhost:5000`).

### 5. Save and push your branch

```bash
git add .
git commit -m "Short description of what you changed"
git push -u origin your-branch-name
```

### 6. Deploy (through GitHub)

We do **not** deploy by hand from laptops for the shared environments. GitHub does it when code lands on the right branch.

1. Open a **pull request** on GitHub: your branch → **`sandbox`**.
2. After review, **merge** the PR into **`sandbox`**.  
   That updates our **staging / preview** site (Firebase preview channel named `sandbox`).
3. When staging looks good, open a PR from **`sandbox`** → **`main`** and merge it.  
   That updates the **live** public site.

If you are not sure who should merge or when to go to `main`, ask the project owner.

---

## First-time setup (new machine)

1. Install [Git](https://git-scm.com/downloads) if you do not already have it.
2. Clone the repository (use the URL from GitHub’s green **Code** button):

```bash
git clone <repository-url>
cd Jivanclinic
```

3. Continue with **step 1** above (`checkout sandbox`, `pull`).

---

## Repository owners (one-time GitHub setup)

Automated deploys need a secret in GitHub: **Settings → Secrets and variables → Actions** → name **`FIREBASE_SERVICE_ACCOUNT_JIVAN_WELLNESS`** (Firebase service account JSON). Only people who administer the repo need to configure this.

---

## License

Add a license here when the project has one.
