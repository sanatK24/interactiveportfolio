/* =========================================================
   SANAT KARKHANIS — self-heal from data/portfolio.json (written daily by
   .github/workflows/sync-portfolio.yml). The hand-made page stays as it is;
   this only marks dead live links, adds public repos the page doesn't show yet,
   and fills in skills, certificates and roles that are on the résumé but not here.
   If the file is missing or the fetch fails, nothing changes.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return ""; } };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = (iso) => { const d = new Date(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
  const day = (iso) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const words = (s) => (s || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const here = location.pathname.split("/").pop() || "index.html";
  const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  const refresh = () => { window.ScrollTrigger?.refresh(); dispatchEvent(new Event("resize")); };

  /* ---------- Project library: dead live links, and repos the page doesn't show yet ---------- */
  const healHome = (data) => {
    const byHost = new Map(data.repos.filter((r) => r.live).map((r) => [host(r.live.url), r]));
    $$(".lcard[data-url]").forEach((card) => {
      const r = byHost.get(host(card.dataset.url));
      if (!r || r.live.ok) return;
      card.classList.add("is-offline");
      const tag = document.createElement("span");
      tag.className = "lcard__offline";
      tag.textContent = `OFFLINE · ${r.live.status}`;
      card.prepend(tag);
    });

    const onPage = new Set($$('a[href*="github.com/"]').map((a) => a.getAttribute("href").replace(/\/+$/, "").toLowerCase()));
    const extra = data.repos
      .filter((r) => !r.featured && !onPage.has(r.url.toLowerCase()))
      .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));
    if (!extra.length || $("#more-repos")) return;
    const cards = extra.map((r) => `
        <article class="ghcard${r.live?.ok ? " has-live" : ""}">
          <div class="ghcard__top"><span>${esc(r.language || "Code")}</span><span>Updated ${month(r.pushedAt)}</span></div>
          <h3 class="ghcard__title">${esc(r.title)}</h3>
          <p class="ghcard__text">${esc(r.summary || "No write-up yet — the code is on GitHub.")}</p>
          ${r.tech.length ? `<div class="ghcard__tech">${r.tech.slice(0, 6).map((t) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}
          <div class="ghcard__links">
            <a href="${esc(r.url)}" target="_blank" rel="noopener" data-cursor="Repo">REPO ${ARROW}</a>
            ${r.live?.ok ? `<a class="is-live" href="${esc(r.live.url)}" target="_blank" rel="noopener" data-cursor="Live">LIVE ${ARROW}</a>` : ""}
          </div>
        </article>`).join("");
    const sec = document.createElement("section");
    sec.id = "more-repos";
    sec.className = "ghmore";
    sec.setAttribute("aria-label", "More public repositories");
    sec.innerHTML = `
      <div class="sec-head"><span>_ALSO_ON_GITHUB</span><i></i><span>${extra.length} REPO${extra.length > 1 ? "S" : ""} · SYNCED ${day(data.generatedAt).toUpperCase()}</span></div>
      <div class="ghmore__grid">${cards}</div>`;
    const after = $("#live") || $("#work");
    after?.after(sec);
    refresh();
  };

  /* ---------- Skills page: résumé skills and certificates missing from the page ---------- */
  const healSkills = (data) => {
    const res = data.resume;
    if (!res) return;
    const have = $$(".skill li, .fchip").map((li) => norm(li.textContent)).filter(Boolean);
    const known = (s) => { const n = norm(s); return n.length < 2 || have.some((h) => h === n || (n.length > 3 && (h.includes(n) || n.includes(h)))); };
    const missing = res.allSkills.filter((s) => !known(s));
    const grid = $(".skills-grid");
    if (missing.length && grid && !$("#resume-skills")) {
      const art = document.createElement("article");
      art.id = "resume-skills";
      art.innerHTML = `<div class="skill" data-spot>
          <div class="skill__top"><span class="skill__ic"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg></span><span class="skill__n">${String(missing.length).padStart(2, "0")}</span></div>
          <h2>New on my résumé</h2>
          <ul>${missing.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
        </div>`;
      grid.appendChild(art);
    }
    const certs = $(".certs2");
    if (certs) {
      const texts = $$("li", certs).map((li) => li.textContent.toLowerCase());
      res.certifications
        .filter((c) => { const w = words(c.name); return !texts.some((t) => w.filter((x) => t.includes(x)).length >= Math.ceil(w.length * 0.6)); })
        .forEach((c) => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="logo-chip mono">${esc(c.name.trim()[0] || "•")}</span><div><b>${esc(c.name)}</b><small>From my résumé</small></div><time>${esc(c.when)}</time>`;
          certs.appendChild(li);
        });
    }
  };

  /* ---------- About page: résumé roles missing from the experience list ---------- */
  const healAbout = (data) => {
    const list = $(".xp");
    if (!list || !data.resume) return;
    const text = list.textContent.toLowerCase();
    data.resume.experience
      .filter((e) => { const key = words(e.org)[0]; return key && !text.includes(key); })
      .forEach((e) => {
        const li = document.createElement("li");
        li.className = "panel xp__item";
        li.innerHTML = `<div class="xp__top"><div class="xp__who"><span class="logo-chip mono">${esc(e.org[0])}</span><div><b>${esc(e.role)}</b><span>${esc(e.org)}${e.place ? " · " + esc(e.place) : ""}</span></div></div><span class="xp__n"></span></div>
          <p class="xp__text">${esc(e.points.join(" "))}</p>
          <span class="chip xp__when">${esc(e.when)}</span>`;
        list.prepend(li); // the résumé lists newest first
      });
    $$(".xp__n", list).forEach((el, i) => (el.textContent = String(i + 1).padStart(2, "0")));
  };

  /* ---------- Footer stamp on every page ---------- */
  const stamp = (data) => {
    const spot = $(".subfoot__row > span:first-child") || $(".foot__l");
    if (!spot || $(".synced")) return;
    const s = document.createElement("span");
    s.className = "synced";
    s.title = `Checked against GitHub and the résumé on ${day(data.generatedAt)}`;
    s.textContent = `Synced ${day(data.generatedAt)}`;
    spot.appendChild(document.createElement("br"));
    spot.appendChild(s);
  };

  fetch("data/portfolio.json", { cache: "no-cache" })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (!data?.repos) return;
      if ($(".lcard") || $("#live")) healHome(data); // the project library
      if (here === "skills.html") healSkills(data);
      if (here === "about.html") healAbout(data);
      stamp(data);
    })
    .catch(() => {}); // offline or no data file yet: the static page is already complete
})();
