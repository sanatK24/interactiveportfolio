# Sanat Karkhanis — Portfolio 2026

Static site: `index.html` + `style.css` + `main.js`. No build step, no backend.
Libraries load from jsDelivr: GSAP 3.13 (ScrollTrigger, SplitText, ScrambleText, Draggable, Inertia) and Lenis.

## Run locally
```
python -m http.server 5173
```
Then open http://localhost:5173

## Deploy
Drag the folder onto Netlify / Vercel / Cloudflare Pages, or push it to a GitHub repo and turn on GitHub Pages.

## Personalise
- **Link previews:** set to https://sanatkarkhanisportfolio-cha8.vercel.app — if the domain changes, update it in the og/twitter tags in `index.html`. The preview image is `assets/og-image.jpg` (1200×630). Test it with LinkedIn's Post Inspector (linkedin.com/post-inspector) or opengraph.xyz; LinkedIn and WhatsApp cache previews, so re-run the inspector after changes.
- **Portrait:** add `assets/portrait.jpg` (3:4, ideally a moody, high-contrast photo). Until then the site uses the GitHub avatar, and falls back to an "SK" monogram.
- **Resume:** replace `assets/Sanat_Karkhanis_Resume.pdf`.
- **Projects:** each `<article class="file">` in `index.html` is one project file (tab label, copy, metric, visual).
- **LinkedIn posts:** LinkedIn has no public API for a profile's posts, so the feed reads from the `POSTS` list in `main.js`. To add a post, copy the number from its URL (`linkedin.com/feed/update/urn:li:activity:<id>`) and add a row at the top with date, tag, title, a one-line summary and the reaction count.
- **Live builds:** each `<article class="lcard">` in the `#live` section shows one deployed site. Screenshots live in `assets/live/`; a card with `data-autoload` and no screenshot loads the real site when it scrolls into view.
- **Logos:** `assets/logos/`. Organisations without a usable logo get a burgundy monogram badge (`<span class="lg lg--mono">ACM</span>`).
- **Cache:** after editing `style.css` or `main.js`, bump the `?v=` number on their links in `index.html` so browsers load the new version.
- **GitHub feed:** the CODE_005 file pulls the latest public repos from `api.github.com/users/sanatK24` and falls back to the four resume projects.

## Sections → inspiration
| # | Section | Inspo |
|---|---------|-------|
| 01 | Aurora specimen hero, variable-font letters that react to the cursor, "0X OF 07" pill | "After" type specimen |
| 02 | Giant PORTFOLIO letters, script "Hello, I'm", portrait, stats, manifesto | Red portfolio + terminal |
| 03 | Black / Burgundy / White columns with HEX/RGB/CMYK specs, satin + smoke textures | CAESAR palette card |
| 04 | Pinned, scroll-driven file dividers with tabs and live project visuals | GRID DAILY file tabs |
| 05 | Experience, 5-step work process, burgundy quote panel, achievements, cert feed | Red portfolio + terminal |
| 06 | "After hours" draggable interest cards over the aurora glow | "After" + file cards |
| 07 | Contact, magnetic CTA, glitch "BUILD WITHOUT LIMITS.", barcode footer | Terminal "Break the grid" |

Press **⌘K / Ctrl+K** anywhere to open the command menu.
