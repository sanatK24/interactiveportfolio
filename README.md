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
- **Portrait:** `assets/portrait.jpg` (About, AWS Future Builders Connect photo — the section's live crimson grid wall in `initWall()` is tuned to the wall in this photo) and `assets/portrait-badge.jpg` (leadership badge). The earlier formal headshot is kept, unused, as `assets/portrait-formal.jpg`. Images are cropped with `object-fit: cover`, never stretched.
- **Resume:** replace `assets/Sanat_Karkhanis_Resume.pdf`.
- **Projects:** each `<article class="file">` in `index.html` is one project file (tab label, copy, metric, visual).
- **LinkedIn posts:** LinkedIn has no public API for a profile's posts, so the feed reads from the `POSTS` list in `main.js`. To add a post, copy the number from its URL (`linkedin.com/feed/update/urn:li:activity:<id>`) and add a row at the top with date, tag, title, a one-line summary and the reaction count.
- **Live builds:** each `<article class="lcard">` in the `#live` section shows one deployed site. Screenshots live in `assets/live/`; a card with `data-autoload` and no screenshot loads the real site when it scrolls into view.
- **Hackathons & events:** each hackathon is an `<article class="ticket">` in the `#field` section; `data-cat` (`result`, `build`, `org`) drives the filter tabs, and `.stamp` holds the result. Events are rows in `.dep__list`; wrap a row in `<a class="dep__row" href=…>` to link it to a post.
- **Leadership:** each role is an `<article class="role">` in the `#lead` section (badge front/back, duties, stats, tenure timeline). Copy the whole article to add a role; the swing/flip physics attach automatically. Update the "ROLES HELD" count in the section header.
- **Logos:** `assets/logos/`. Organisations without a usable logo get a burgundy monogram badge (`<span class="lg lg--mono">ACM</span>`).
- **Sound:** all audio is synthesised in `main.js` (the `sfx` module, Web Audio API) — no audio files. It is off by default, toggled from the nav or ⌘K, and the visitor's choice is remembered. Calm, interaction-only sine tones with soft attacks and no background audio; tweak volumes via the `peak` values.
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
