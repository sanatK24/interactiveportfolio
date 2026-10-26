/* =========================================================
   SANAT KARKHANIS — sub-pages (About, Process). Needs shared.js.
   Reveal-on-scroll, counters, drag, photo lens, process path.
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  document.body.classList.remove("is-loading");

  /* ---------- Reveal on scroll ---------- */
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
    : null;
  $$(".rv, .grade").forEach((el) => (io ? io.observe(el) : el.classList.add("is-in")));

  /* ---------- Count-up numbers ---------- */
  const counters = $$("[data-count]");
  const fmt = (el, v) => {
    const dec = +(el.dataset.dec || 0);
    let s = el.hasAttribute("data-comma") ? Math.round(v).toLocaleString("en-US") : v.toFixed(dec);
    return s + (el.dataset.suffix || "");
  };
  const cio = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target, end = parseFloat(el.dataset.count), t0 = performance.now();
        cio.unobserve(el);
        const tick = (t) => {
          const p = reduced ? 1 : clamp((t - t0) / 1800, 0, 1);
          el.textContent = fmt(el, end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }), { threshold: 0.4 })
    : null;
  counters.forEach((el) => { el.textContent = fmt(el, 0); cio ? cio.observe(el) : (el.textContent = fmt(el, parseFloat(el.dataset.count))); });

  /* ---------- Drag (mouse and touch) ----------
     data-drag            free drag
     data-drag-snap       spring back to where it started on release
     data-drag-bounds=sel keep inside that element                     */
  const fineOnly = (el) => el.hasAttribute("data-drag-fine") && !finePointer;
  $$("[data-drag]").forEach((el) => {
    if (fineOnly(el)) { el.removeAttribute("data-drag"); return; }
    let x = 0, y = 0, sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
    const snap = el.hasAttribute("data-drag-snap");
    const boundsEl = el.dataset.dragBounds ? el.closest(el.dataset.dragBounds) : null;
    el.addEventListener("pointerdown", (e) => {
      if (e.button) return;
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      el.style.transition = "none";
      sx = e.clientX; sy = e.clientY; ox = x; oy = y; moved = false;
    });
    el.addEventListener("pointermove", (e) => {
      if (!el.classList.contains("is-dragging")) return;
      let nx = ox + e.clientX - sx, ny = oy + e.clientY - sy;
      if (boundsEl) {
        const b = boundsEl.getBoundingClientRect(), r = el.getBoundingClientRect();
        nx = clamp(nx, x - (r.left - b.left), x + (b.right - r.right));
        ny = clamp(ny, y - (r.top - b.top), y + (b.bottom - r.bottom));
      }
      x = nx; y = ny; moved = true;
      el.style.translate = `${x}px ${y}px`;
    });
    const end = () => {
      if (!el.classList.contains("is-dragging")) return;
      el.classList.remove("is-dragging");
      if (snap && moved) {
        el.style.transition = "translate .8s cubic-bezier(.3, 1.5, .5, 1)";
        x = 0; y = 0;
        el.style.translate = "0 0";
      }
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  });

  /* ---------- Photo lens: colour spotlight over a duotone portrait ---------- */
  const lens = $(".photolens");
  if (lens) {
    const layer = $(".photolens__layer", lens), label = $(".photolens__mode", lens);
    let over = false, tx = 50, ty = 34, cx = 50, cy = 34, r = reduced ? 0 : 90, tr = r;
    const setMode = () => { if (label) label.textContent = over ? "Move to explore" : finePointer ? "Hover the photo" : "Colour lens"; };
    setMode();
    lens.addEventListener("pointerenter", (e) => { if (e.pointerType !== "mouse") return; over = true; tr = 130; setMode(); });
    lens.addEventListener("pointerleave", () => { over = false; tr = reduced ? 0 : 90; setMode(); });
    lens.addEventListener("pointermove", (e) => {
      if (!over) return;
      const b = layer.getBoundingClientRect();
      tx = clamp(((e.clientX - b.left) / b.width) * 100, 0, 100);
      ty = clamp(((e.clientY - b.top) / b.height) * 100, 0, 100);
    });
    const loop = (t) => {
      if (!over && !reduced) { tx = 50 + 26 * Math.sin(t / 1900); ty = 38 + 24 * Math.sin(t / 2700 + 1); }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; r += (tr - r) * 0.1;
      lens.style.setProperty("--mx", cx.toFixed(2) + "%");
      lens.style.setProperty("--my", cy.toFixed(2) + "%");
      lens.style.setProperty("--r", r.toFixed(1) + "px");
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    // gentle parallax while scrolling past
    if (!reduced) {
      const drift = () => {
        const b = lens.getBoundingClientRect(), p = clamp((innerHeight - b.top) / (innerHeight + b.height), 0, 1);
        layer.style.transform = `translateY(${(p * 8 - 4).toFixed(2)}%)`;
      };
      drift();
      addEventListener("scroll", drift, { passive: true });
    }
  }

  /* ---------- Process board: path draws as you scroll ---------- */
  const board = $(".pboard");
  const live = board && $(".pboard__path .live");
  if (live) {
    const upd = () => {
      const b = board.getBoundingClientRect();
      const p = reduced ? 1 : clamp((innerHeight * 0.7 - b.top) / b.height, 0, 1);
      live.style.strokeDashoffset = (1 - p).toFixed(4);
    };
    upd();
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
  }

  /* ---------- Command palette (page-aware) ---------- */
  const here = location.pathname.split("/").pop() || "index.html";
  const go = (href, label) => () => { SK.toast(`Opening ${label}…`, "info", 1600); location.href = href; };
  const items = [
    { t: "Go to · Home", k: "01", run: go("index.html", "Home") },
    { t: "Go to · About me", k: "02", run: here === "about.html" ? () => scrollTo({ top: 0, behavior: "smooth" }) : go("about.html", "About") },
    { t: "Go to · How I work", k: "03", run: here === "process.html" ? () => scrollTo({ top: 0, behavior: "smooth" }) : go("process.html", "Process") },
    { t: "Go to · Skills & certificates", k: "↗", run: here === "skills.html" ? () => scrollTo({ top: 0, behavior: "smooth" }) : go("skills.html", "Skills") },
    { t: "Go to · Send a message", k: "↗", run: here === "contact.html" ? () => scrollTo({ top: 0, behavior: "smooth" }) : go("contact.html", "Contact") },
    { t: "Go to · Work", k: "04", run: go("index.html#work", "Work") },
    { t: "Go to · Hackathons & events", k: "06", run: go("index.html#field", "Hackathons") },
    ...SK.commonCommands(),
  ];
  SK.palette({ items });
})();
