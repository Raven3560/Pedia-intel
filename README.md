# AI Driven Nutritional Tool and Simulation: hosting package

Plain static website. No database, no Supabase, no Lovable, no accounts, no build step and no server code. Every file it needs is in this folder, including the font, so the site makes no requests to any other website. The only outside links are the references inside the cases, which open when a reader clicks them.

## Put it online

Upload **everything in this folder** (keep the folder structure) to any static web host:

- **Your own server or cPanel hosting:** upload the contents to `public_html/` (or a subfolder such as `public_html/nutrition/`).
- **Netlify:** drag this folder onto app.netlify.com/drop.
- **Vercel, Cloudflare Pages, GitHub Pages, AWS S3:** publish this folder as-is; no build command, output folder is the root.
- **GitHub Pages (pedia-intel.mediception.com):** `CNAME` keeps the custom domain and `.nojekyll` tells GitHub to serve the files as they are. Keep both when you push.

Then open `index.html` at your address. The home page is `index.html`; the case admin is `admin.html`.

Serve it from a web address (http or https), not by double-clicking the file: browsers block the 3D baby when a page is opened straight from disk, and the drawn baby is shown instead.

## What is in it

| Path | What it is |
|---|---|
| `index.html` | The tool: Case lab, Tummy check (clinician view) and KOL finder |
| `admin.html` | Case admin, behind a sign-in: upload or write a case, check it, preview it, publish it. The panel is stored encrypted inside this file (see "Admin sign-in") |
| `js/admin-gate.js` | The admin sign-in: checks the email and password and opens the encrypted panel |
| `css/` | Styles; `fonts.css` loads the font from `fonts/`; `mediception.css` is the Mediception theme (same look as OrthoSim Atlas), in dark and light, and loads last |
| `fonts/` | Inter, Outfit and Plus Jakarta Sans (SIL Open Font License) |
| `img/brand/` | Mediception logo: `-dark.png` (white wordmark, for the dark theme) and `-light.png` (navy wordmark, for the light theme), each with sharpened `-48.png` and `-96.png` copies sized for the header so the small lettering stays crisp |
| `js/theme.js` | The light / dark switch in the header of both pages |
| `js/cases.js` | The 6 built-in cases, the topic list and the reference links |
| `data/cases-extra.js` | The 5 cases added after the built-in set; this is the file the admin page writes |
| `data/kol-data.js`, `data/kol-data.json` | KOL finder data (the `.js` is what the page reads) |
| `js/` (other files) | The app, the 3D baby (`baby-scene.js`), the drawn baby and adult figures |
| `img/scene/` | The rendered NICU baby pictures |
| `cases/` | Every case as its own readable JSON file, with an index in `cases/README.md` (a copy for your records; the site does not read it) |

## Light and dark

First-time visitors see the light theme. The sun / moon switch at the top right of every page changes it to dark and back, and each browser remembers its visitor's choice for later visits; nothing is sent anywhere. To make first-time visitors see dark instead, change `data-theme="light"` to `data-theme="dark"` on the `<html>` line of `index.html` and `admin.html`.

## Adding a new case

1. Open `admin.html` on your site and sign in with the admin email and password.
2. Upload a case `.json` or fill in the form until it says "Ready to publish".
3. Click "Preview in Case lab" to check it.
4. Click "Download site file (cases-extra.js)" and replace `data/cases-extra.js` on your host with it. The case is then live for everyone.

"Add to the tool on this device" shows the case only in that one browser, for trying it before publishing.

The admin page cannot change the live site by itself: only a person who uploads a new `cases-extra.js` to the host can.

## Admin sign-in

`admin.html` opens on a sign-in screen that asks for one admin email and password. The admin panel (its form and its code) is not in this folder as readable files: it is stored inside `admin.html` encrypted (AES-256-GCM, with the key made from the email and password together by PBKDF2-SHA256, 600,000 rounds). The right email and password decrypt and open it in the browser; without them it cannot be read, not even from the page source. The email and password are not written anywhere in the site. This works on any static host and needs no server.

- **Signing in:** the email is not case-sensitive; the password is. A tab stays signed in until it is closed or "Sign out" is clicked.
- **Setting or changing the sign-in:** in the `admin-source` folder that sits next to this folder (not inside it), run `node build-admin.mjs` (needs Node.js 18 or later), enter the email and type the new password twice, then upload the new `admin.html` to the host. Everyone signed in before is signed out. The password needs at least 12 characters.
- **Editing the admin panel:** its readable source is `admin-source/admin-panel.html` and `admin-source/admin.js`. After editing them, run `node build-admin.mjs` again to rebuild `admin.html`.
- **Keep `admin-source` on your own computer.** Do not upload it, and do not put it inside this folder.
- **Limits:** there is no lockout after wrong guesses, because there is no server to count them; a long, hard-to-guess password and the slow key step are what make guessing impractical. There is one sign-in, not separate per-person accounts. For those, add your host's own protection in front of `admin.html` as well, for example cPanel "Directory Privacy" or Cloudflare Access.
- Sign-in needs `https://` (or `localhost`); browsers only allow the decryption on secure pages.
