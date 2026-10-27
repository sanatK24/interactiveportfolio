/* =========================================================
   SANAT KARKHANIS — extras (no dependencies, every page). Needs shared.js.
   scroll progress · pixel-storm transition · nav clock · tilt · spotlight · globe ·
   stacked project cards · project slider · data wordmark · decoding labels · fall in place · contact form
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const KEY = "sk-curtain";

  /* ---------- Scroll progress bar ---------- */
  const bar = document.createElement("div");
  bar.className = "progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
  };
  onScroll();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);

  /* ---------- Pixel storm: a grid of burgundy squares sweeps over the old page, then clears off the new one ---------- */
  const storm = document.createElement("div");
  storm.className = "storm";
  storm.setAttribute("aria-hidden", "true");
  const buildStorm = () => {
    const cols = innerWidth < 640 ? 7 : 14, rows = Math.ceil(innerHeight / (innerWidth / cols));
    storm.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    storm.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    storm.innerHTML = "";
    for (let i = 0; i < cols * rows; i++) {
      const hot = Math.random() < 0.1;
      // diagonal sweep from the top left with a little noise; the bright cells hang on a beat longer
      const d = ((i % cols) / cols + Math.floor(i / cols) / rows) / 2 + Math.random() * 0.12 + (hot ? 0.1 : 0);
      const cell = document.createElement("i");
      if (hot) cell.className = "hot";
      cell.style.setProperty("--d", d.toFixed(3));
      storm.appendChild(cell);
    }
  };
  buildStorm();
  document.body.appendChild(storm);
  let arrived = false;
  try { arrived = sessionStorage.getItem(KEY) === "1"; sessionStorage.removeItem(KEY); } catch (_) {}
  // tells main.js to skip the home loader: the storm is the transition
  SK.arrived = arrived && !reduced;
  if (arrived && !reduced) {
    storm.classList.add("is-full");
    const clear = () => setTimeout(() => { void storm.offsetWidth; storm.classList.remove("is-full"); storm.classList.add("is-clear"); }, 80);
    document.readyState === "complete" ? clear() : addEventListener("load", clear, { once: true });
  }
  addEventListener("pageshow", (e) => {
    if (e.persisted) storm.className = "storm"; // coming back via the browser's back button
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (reduced || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchor
    e.preventDefault();
    try { sessionStorage.setItem(KEY, "1"); } catch (_) {}
    storm.className = "storm";
    void storm.offsetWidth;
    storm.classList.add("is-cover");
    setTimeout(() => { location.href = url.href; }, 620);
  });

  /* ---------- Navi Mumbai clock in the nav ---------- */
  const clocks = $$("[data-clock]");
  if (clocks.length) {
    const tick = () => {
      const now = new Date();
      const time = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit" });
      const date = now.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" });
      clocks.forEach((c) => { c.innerHTML = `<small>NAVI MUMBAI · IST</small>${time} · ${date}`; });
    };
    tick();
    setInterval(tick, 30000);
  }

  /* ---------- Tilt toward the pointer + spotlight that follows it ---------- */
  $$("[data-tilt]").forEach((el) => {
    if (!finePointer || reduced) return;
    const max = +(el.dataset.tilt || 6);
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.classList.add("is-tilting");
      el.style.setProperty("--ry", ((x - 0.5) * max * 2).toFixed(2) + "deg");
      el.style.setProperty("--rx", (-(y - 0.5) * max * 2).toFixed(2) + "deg");
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("is-tilting");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });
  $$("[data-spot]").forEach((el) => el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", e.clientX - r.left + "px");
    el.style.setProperty("--my", e.clientY - r.top + "px");
  }));

  /* ---------- Wireframe globe ---------- */
  const globe = $("[data-globe]");
  if (globe) {
    const NS = "http://www.w3.org/2000/svg", N = 16;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 400 400");
    svg.setAttribute("aria-hidden", "true");
    const add = (tag, attrs) => { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); svg.appendChild(el); return el; };
    add("circle", { cx: 200, cy: 200, r: 180, fill: "none", stroke: "currentColor", "stroke-opacity": 0.3 });
    const meridians = Array.from({ length: N }, () => add("ellipse", { cx: 200, cy: 200, ry: 180, fill: "none", stroke: "currentColor" }));
    [-120, -60, 0, 60, 120].forEach((y) => add("ellipse", { cx: 200, cy: 200 + y, rx: Math.sqrt(180 * 180 - y * y), ry: 10, fill: "none", stroke: "currentColor", "stroke-opacity": 0.14 }));
    globe.prepend(svg);
    const spin = (t) => {
      meridians.forEach((el, i) => {
        const phase = (i / N) * Math.PI + t / 6000;
        el.setAttribute("rx", Math.abs(Math.cos(phase)) * 180);
        el.setAttribute("stroke-opacity", 0.1 + Math.abs(Math.sin(phase)) * 0.26);
      });
    };
    spin(0);
    if (!reduced) {
      let on = false;
      new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(globe);
      const loop = (t) => { if (on) spin(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  /* ---------- Stacked project cards: pin and pile up while scrolling ---------- */
  const stack = $("[data-stack]");
  if (stack) {
    const wraps = $$(".projcard-wrap", stack), n = wraps.length;
    wraps.forEach((w, i) => { w.style.top = 96 + i * 26 + "px"; w.style.zIndex = i + 1; });
    const upd = () => {
      if (innerWidth <= 900 || reduced) { wraps.forEach((w) => ($(".projcard", w).style.transform = "")); return; }
      const r = stack.getBoundingClientRect(), total = r.height - innerHeight;
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
      wraps.forEach((w, i) => {
        const start = i / n, k = clamp((p - start) / (1 - start || 1), 0, 1);
        $(".projcard", w).style.transform = `scale(${1 - k * (n - i - 1) * 0.04})`;
      });
    };
    upd();
    addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
  }

  /* ---------- Data wordmark: the footer name drawn from data points ----------
     They stream in and settle left to right, a scan beam sweeps across, they scatter from the
     pointer, blow apart on click and drift away as the footer scrolls off the screen.           */
  // rest colour, three steps of heat for points that are scanned or knocked off their spot, then the accent rest colour
  const DM_COLORS = ["rgba(243,240,235,0.92)", "rgba(255,170,180,0.95)", "rgba(255,90,110,1)", "rgba(227,36,59,1)", "rgba(227,36,59,1)"];
  const DM_LINE = "227,36,59";

  const dmSample = (text, width) => {
    const off = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (!off) return { points: [], height: 0 };
    const setFont = (size) => {
      off.font = `800 ${size}px Archivo, "Arial Black", sans-serif`;
      if ("fontStretch" in off) off.fontStretch = "condensed";
      if ("letterSpacing" in off) off.letterSpacing = `${-size * 0.03}px`;
    };
    setFont(100);
    const size = (100 * width * 0.96) / off.measureText(text).width;
    setFont(size);
    const m = off.measureText(text), left = (width - m.width) / 2, cap = m.actualBoundingBoxAscent;
    const height = Math.ceil(cap * 1.06);
    off.canvas.width = width;
    off.canvas.height = height;
    setFont(size);
    off.fillStyle = "#fff";
    off.textBaseline = "alphabetic";
    off.fillText(text, left, cap + height * 0.02);
    const data = off.getImageData(0, 0, width, height).data;
    // pixels that disappear when the last character is left off belong to that character (the full stop)
    off.clearRect(0, 0, width, height);
    off.fillText(text.slice(0, -1), left, cap + height * 0.02);
    const prefix = off.getImageData(0, 0, width, height).data;
    const gap = width < 640 ? 3.5 : width < 1100 ? 4.5 : 5.5;
    const points = [];
    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const at = (Math.floor(y) * width + Math.floor(x)) * 4 + 3;
        if (data[at] < 140) continue;
        points.push({
          x: Math.random() * width, y: Math.random() * height * 1.6 - height * 0.3, vx: 0, vy: 0, tx: x, ty: y,
          sx: (Math.random() - 0.5) * width * 0.5, sy: -Math.random() * height * 2.5 - height * 0.3,
          delay: (x / width) * 900 + Math.random() * 500, // settles left to right, like a stream being processed
          size: gap * (0.55 + Math.random() * 0.25),
          accent: prefix[at] < 140,
        });
      }
    }
    return { points, height };
  };

  $$("[data-datamark]").forEach((host) => {
    const text = host.dataset.datamark || "SANAT.";
    const canvas = document.createElement("canvas");
    canvas.className = "datamark__canvas";
    canvas.setAttribute("aria-hidden", "true");
    host.prepend(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let points = [], width = 0, height = 0, raf = 0, visible = false, start = 0;
    const pointer = { x: -9999, y: -9999, on: false };
    const waves = [];
    const buckets = DM_COLORS.map(() => []);

    const draw = (scan, now) => {
      ctx.clearRect(0, 0, width, height);
      buckets.forEach((b) => (b.length = 0));
      for (const p of points) {
        const off = Math.hypot(p.x - p.tx, p.y - p.ty);
        const beam = scan < 0 ? 0 : Math.max(0, 1 - Math.abs(p.tx - scan) / 70);
        const heat = Math.min(1, off / 40 + beam);
        buckets[heat > 0.66 ? 3 : heat > 0.33 ? 2 : heat > 0.08 ? 1 : p.accent ? 4 : 0].push(p);
      }
      buckets.forEach((b, i) => {
        ctx.fillStyle = DM_COLORS[i];
        for (const p of b) ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      // threads from the pointer to the points around it
      if (pointer.on) {
        const reach = Math.max(110, width * 0.1);
        ctx.beginPath();
        let n = 0;
        for (let i = 0; i < points.length && n < 90; i += 3) {
          const p = points[i], d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d > reach || d < 8) continue;
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(p.x + p.size / 2, p.y + p.size / 2);
          n++;
        }
        ctx.strokeStyle = `rgba(${DM_LINE},0.32)`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      // shockwave rings from clicks
      for (let i = waves.length - 1; i >= 0; i--) {
        const age = (now - waves[i].t) / 700;
        if (age > 1) { waves.splice(i, 1); continue; }
        ctx.beginPath();
        ctx.arc(waves[i].x, waves[i].y, 20 + age * width * 0.35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${DM_LINE},${0.7 * (1 - age)})`;
        ctx.lineWidth = 2 * (1 - age) + 0.5;
        ctx.stroke();
      }
    };

    const loop = () => {
      raf = 0;
      if (!visible) return;
      const now = performance.now();
      if (!start) start = now;
      const t = now - start, radius = Math.max(70, width * 0.07);
      // drift apart as the footer scrolls off the top of the screen
      const r = canvas.getBoundingClientRect();
      let scatter = clamp(1 - r.bottom / (innerHeight * 0.85), 0, 1);
      scatter *= scatter;
      for (const p of points) {
        if (t < p.delay) continue;
        let ax = (p.tx + p.sx * scatter - p.x) * 0.045, ay = (p.ty + p.sy * scatter - p.y) * 0.045;
        if (pointer.on) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy);
          if (d < radius && d > 0.1) { const f = ((radius - d) / radius) * 6; ax += (dx / d) * f; ay += (dy / d) * f; }
        }
        p.vx = (p.vx + ax) * 0.82; p.vy = (p.vy + ay) * 0.82;
        p.x += p.vx; p.y += p.vy;
      }
      // a beam crosses the word every few seconds once it has assembled
      const cycle = 5200, since = t - 2000;
      draw(since < 0 ? -1 : ((since % cycle) / cycle) * (width + 400) - 200, now);
      raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf && visible && !reduced && points.length) raf = requestAnimationFrame(loop); };

    const setup = async () => {
      if (document.fonts) await document.fonts.ready;
      width = host.clientWidth;
      if (!width) return;
      ({ points, height } = dmSample(text, width));
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) { points.forEach((p) => ((p.x = p.tx), (p.y = p.ty))); draw(-1, 0); }
      else kick();
    };

    const local = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    if (!reduced) {
      host.addEventListener("pointermove", (e) => Object.assign(pointer, local(e), { on: true }));
      host.addEventListener("pointerleave", () => (pointer.on = false));
      // click to blast the points outwards
      host.addEventListener("pointerdown", (e) => {
        if (e.target.closest("a, button")) return;
        const { x, y } = local(e);
        waves.push({ x, y, t: performance.now() });
        for (const p of points) {
          const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy) || 1;
          const f = 55 * Math.exp(-d / (width * 0.35)) * (0.6 + Math.random() * 0.8);
          p.vx += (dx / d) * f + (Math.random() - 0.5) * 6;
          p.vy += (dy / d) * f + (Math.random() - 0.5) * 6;
        }
        kick();
      });
    }
    // only animate while on screen; the intro plays the first time it is seen
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(canvas);
    // rebuild the points when the width changes
    let lastWidth = 0;
    new ResizeObserver(() => {
      const w = host.clientWidth;
      if (Math.abs(w - lastWidth) < 2) return;
      lastWidth = w;
      cancelAnimationFrame(raf); raf = 0; start = 0;
      setup();
    }).observe(host);
    // draw once straight away too, rather than waiting for the first resize callback
    lastWidth = host.clientWidth;
    setup();
  });

  /* ---------- Decoding labels: section tags resolve from random glyphs, on view and on hover ---------- */
  const GLYPHS = "01<>/\\_#*+=%$";
  const decode = (el) => {
    if (el.dataset.decoding) return;
    const text = el.dataset.text;
    el.dataset.decoding = "1";
    const t0 = performance.now(), dur = Math.min(900, 300 + text.length * 28);
    const step = (now) => {
      const p = clamp((now - t0) / dur, 0, 1), done = Math.floor(p * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) out += i < done || text[i] === " " ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step);
      else { el.textContent = text; delete el.dataset.decoding; }
    };
    requestAnimationFrame(step);
  };
  const labels = $$(".tag, .sec-head > span:first-child, .jlabel, .manifesto__label").filter((el) => !el.children.length && el.textContent.trim());
  if (!reduced && labels.length && "IntersectionObserver" in window) {
    const lio = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      lio.unobserve(e.target);
      decode(e.target);
    }), { rootMargin: "0px 0px -30px 0px" });
    labels.forEach((el) => {
      el.dataset.text = el.textContent;
      el.setAttribute("aria-label", el.textContent.trim());
      // hold the width so the line doesn't jump while glyphs swap
      el.style.minWidth = el.getBoundingClientRect().width + "px";
      el.classList.add("is-decode");
      lio.observe(el);
      el.addEventListener("pointerenter", () => decode(el));
    });
  }

  /* ---------- Fall in place: chips rain into the stage, pile up, then fly into sorted order ---------- */
  const fall = $("[data-fall]");
  if (fall) {
    const list = $(".fall__list", fall), status = $(".fall__status", fall), btn = $("[data-fall-shake]");
    const els = $$("li", list), COL = 8, PAD = 14, SORT_AT = 2300;
    const total = els.length;
    let raf = 0;
    const put = (b) => (b.el.style.transform = `translate3d(${b.x - b.fx}px, ${b.y - b.fy}px, 0) rotate(${b.rot}deg)`);
    const play = (burst) => {
      if (reduced) return;
      cancelAnimationFrame(raf);
      const s = fall.getBoundingClientRect(), W = s.width, H = s.height;
      const heights = new Float32Array(Math.ceil(W / COL) + 1); // height of the pile in each column across the floor
      const bodies = els.map((el) => {
        el.style.transform = "";
        const r = el.getBoundingClientRect(), fx = r.left - s.left, fy = r.top - s.top;
        return {
          el, fx, fy, w: r.width, h: r.height,
          // a shake launches everything from where it sits; the first drop starts above the stage
          x: burst ? fx : PAD + Math.random() * (W - r.width - PAD * 2),
          y: burst ? fy : -r.height - Math.random() * H * 1.4,
          vx: burst ? (Math.random() - 0.5) * 16 : (Math.random() - 0.5) * 3,
          vy: burst ? -6 - Math.random() * 12 : Math.random() * 2,
          rot: burst ? 0 : (Math.random() - 0.5) * 60,
          vr: (Math.random() - 0.5) * (burst ? 18 : 8),
          rested: false, settleAt: 0,
        };
      });
      // sort in a shuffled order so the tidy-up looks like records being placed one by one
      [...bodies].sort(() => Math.random() - 0.5).forEach((b, i) => (b.settleAt = SORT_AT + i * 22));
      bodies.forEach(put);
      list.style.visibility = "visible";
      status.textContent = `ingesting ${total} random records…`;
      let t0 = 0, sorting = false;
      const step = (now) => {
        if (!t0) t0 = now;
        const t = now - t0;
        if (t > SORT_AT && !sorting) { sorting = true; status.textContent = "sorting…"; }
        let moving = 0;
        for (const b of bodies) {
          if (t >= b.settleAt) {
            // spring home
            b.vx = (b.vx + (b.fx - b.x) * 0.09) * 0.74;
            b.vy = (b.vy + (b.fy - b.y) * 0.09) * 0.74;
            b.vr = (b.vr - b.rot * 0.09) * 0.74;
            b.x += b.vx; b.y += b.vy; b.rot += b.vr;
            if (Math.abs(b.fx - b.x) + Math.abs(b.fy - b.y) + Math.abs(b.rot) > 0.4 || Math.abs(b.vx) + Math.abs(b.vy) > 0.1) moving++;
            else { b.x = b.fx; b.y = b.fy; b.rot = 0; }
            put(b);
            continue;
          }
          moving++;
          if (b.rested) continue;
          b.vy += 0.55;
          b.x += b.vx; b.y += b.vy; b.rot += b.vr;
          if (b.x < PAD || b.x + b.w > W - PAD) { b.x = clamp(b.x, PAD, W - PAD - b.w); b.vx *= -0.5; }
          // the floor is the top of the pile under this chip
          const c0 = Math.max(0, Math.floor(b.x / COL)), c1 = Math.min(heights.length - 1, Math.floor((b.x + b.w) / COL));
          let pile = 0;
          for (let c = c0; c <= c1; c++) pile = Math.max(pile, heights[c]);
          const floor = H - PAD - pile - b.h;
          if (b.y > floor && b.vy > 0) {
            b.y = floor;
            if (b.vy < 3) {
              b.rested = true;
              b.rot = clamp(b.rot % 30, -14, 14);
              for (let c = c0; c <= c1; c++) heights[c] = pile + b.h * 0.5;
            } else { b.vy *= -0.32; b.vx *= 0.7; b.vr *= 0.5; }
          }
          put(b);
        }
        if (moving) raf = requestAnimationFrame(step);
        else { bodies.forEach((b) => (b.el.style.transform = "")); status.textContent = `${total} records sorted`; }
      };
      raf = requestAnimationFrame(step);
    };
    status.textContent = `${total} records sorted`;
    if (reduced || !("IntersectionObserver" in window)) list.style.visibility = "visible";
    else {
      const fio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { fio.disconnect(); play(false); } }, { rootMargin: "-15% 0px" });
      fio.observe(fall);
    }
    btn?.addEventListener("click", () => { play(true); SK.toast("Shaking it up…", "info", 1400); });
  }

  /* ---------- Latest projects slider: arrows, drag to scroll, counter and progress ---------- */
  $$("[data-slider]").forEach((root) => {
    const track = $("[data-slider-track]", root);
    if (!track) return;
    const slides = $$(":scope > li", track);
    const cur = $("[data-slider-cur]", root), total = $("[data-slider-total]", root), bar = $("[data-slider-bar]", root);
    const prev = $("[data-slider-prev]", root), next = $("[data-slider-next]", root);
    const pad = (n) => String(n).padStart(2, "0");
    if (total) total.textContent = pad(slides.length);
    const step = () => (slides[0]?.getBoundingClientRect().width || 300) + 16;
    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const p = max > 0 ? track.scrollLeft / max : 0;
      // at the far end the last few cards share the view, so count the last one
      const i = track.scrollLeft > max - 4 ? slides.length : Math.min(slides.length, Math.round(track.scrollLeft / step()) + 1);
      if (cur) cur.textContent = pad(i);
      if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.max(p, 0.04) : 1})`;
      if (prev) prev.disabled = track.scrollLeft < 4;
      if (next) next.disabled = track.scrollLeft > max - 4;
    };
    prev?.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: reduced ? "auto" : "smooth" }));
    next?.addEventListener("click", () => track.scrollBy({ left: step(), behavior: reduced ? "auto" : "smooth" }));
    track.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    track.tabIndex = 0;
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { next?.click(); e.preventDefault(); }
      if (e.key === "ArrowLeft") { prev?.click(); e.preventDefault(); }
    });
    // drag with the mouse; touch screens already swipe natively
    let down = null;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button) return;
      down = { x: e.clientX, left: track.scrollLeft, moved: false };
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - down.x;
      if (!down.moved && Math.abs(dx) > 5) { down.moved = true; track.classList.add("is-dragging"); }
      if (down.moved) track.scrollLeft = down.left - dx;
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      const moved = down.moved;
      down = null;
      track.classList.remove("is-dragging");
      if (moved) {
        // settle on the nearest card
        const i = Math.round(track.scrollLeft / step());
        track.scrollTo({ left: i * step(), behavior: reduced ? "auto" : "smooth" });
      }
    });
    update();
  });

  /* ---------- Contact form: opens the visitor's email app (static site, no backend) ---------- */
  const form = $("[data-contact-form]");
  if (form) {
    const TO = "sanat.karkhanis2@gmail.com";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(form), name = (d.get("name") || "").toString().trim(), email = (d.get("email") || "").toString().trim(), msg = (d.get("message") || "").toString().trim();
      if (!name || !email || !msg) { SK.toast("Fill in your name, email and message first", "warning"); return; }
      const body = `${msg}\n\n— ${name} (${email})`;
      SK.toast("Opening your email app with the message ready…", "info", 3600);
      location.href = `mailto:${TO}?subject=${encodeURIComponent("Portfolio message from " + name)}&body=${encodeURIComponent(body)}`;
    });
  }
})();
