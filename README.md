# Tummy Trouble Tool v10: source

A static web app with no build step and no server. Open `index.html` in a browser, or host the folder on any static web server.

## Structure

| Path | What it holds |
|---|---|
| `index.html` | Page markup: header, tabs (Case lab, Tummy check, KOL finder), Tummy check stage and question rail, Clinician lens, footer. Loads the files below in order. |
| `css/styles.css` | All styles: design tokens (light and dark), Tummy check, Clinician lens, Case lab, KOL finder, the baby scene palettes (`--bf-*`) and the mobile layout (breakpoints at 960, 760 and 520 px). |
| `js/baby-front.js` | `BABYFRONT`: the front-facing baby, painted in SVG, used in the Case lab, its hero and the Tummy check. Settings: `nicu` (incubator with ECG leads, feeding tube, temperature probe, pulse-oximeter, cannula), `home` (examination mattress) and `cot` (home cot, no equipment, for parents). Variants: term newborn, infant and preterm. States: crying, stress, sleepiness, distension, duskiness, jaundice, rash, posseting and vomiting, feeding, stomach fill, gas, stool (with a nappy-check card). Views: outside, inside and gut. API: `create`, `set`, `now`, `flash`, `highlight`, `view`, `dispose`. |
| `js/cases.js` | `CASE_TRACKS` and `CASES`: the 6 Case lab cases, all from published case reports. Each case has steps, options, evidence, references and a `pub` citation. |
| `js/app.js` | The app: the 8 questions, parent and clinician content, the report, the Clinician lens, the Case lab (case list with live hero, case sheet, bedside monitor, discharge summary, nutrition worksheet), the KOL finder, and the reference-link table `REFLINKS`. |
| `data/kol-data.json` | KOL finder data: 364 profiles. The top 6 by score are full profiles with verified source links; the other 358 are locked teasers (specialty, place, band, trial/guideline/international flags only). Each link has `v`: 1 = checked, 3 = could not be checked automatically. |
| `data/kol-data.js` | The same data as a script (`window.KOL_DATA`), so the page also works when opened from disk. |
| `tools/build_kol_data_js.py` | Regenerates `data/kol-data.js` after you edit `kol-data.json`. |
| `tools/build_single_file.py` | Bundles everything into one self-contained HTML file. |
| `tools/verification/` | Scripts and logs from the source verification: link checks (PubMed, ClinicalTrials.gov, Crossref, Europe PMC, ORCID, web pages), the browser fetch, archive lookups, the publication check, the data build, manual decisions, the report and the change log. |

## Common edits

- **Receive KOL access requests by email:** set `REQUEST_TO` near the top of the KOL finder section in `js/app.js`. When empty, the request form shows the request for the user to copy.
- **Change how many KOL profiles are open:** the locked file is generated from the full dataset (kept privately, not in this package); ask Mediception to regenerate it.

- **Add or change a case:** edit `js/cases.js`. A step's `g` entries and a case's `refs` are linked automatically when they match a pattern in `REFLINKS` in `js/app.js`; add a pattern and URL there for any new source.
- **Update KOL data:** edit `data/kol-data.json`, then run `python3 tools/build_kol_data_js.py`.
- **Ship one file:** run `python3 tools/build_single_file.py dist.html`.

External dependencies: Google Fonts only. No frameworks or libraries are used.
