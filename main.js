/* =========================================================
   SANAT KARKHANIS — PORTFOLIO 2026 · interactions
   GSAP 3.13 (ScrollTrigger, SplitText, ScrambleText, Draggable, Inertia) + Lenis
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const isDesktop = () => innerWidth > 900;

  const hasGSAP = typeof window.gsap !== "undefined";
  if (!hasGSAP) {
    document.body.classList.remove("is-loading");
    $(".loader")?.remove();
    return;
  }

  const plugins = [window.ScrollTrigger, window.SplitText, window.ScrambleTextPlugin, window.Draggable, window.InertiaPlugin].filter(Boolean);
  gsap.registerPlugin(...plugins);
  const ST = window.ScrollTrigger;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.4, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else {
      const y = typeof target === "number" ? target : (typeof target === "string" ? $(target) : target).getBoundingClientRect().top + scrollY;
      scrollTo.native(y);
    }
  };
  scrollTo.native = (y) => window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });

  // in-page anchors
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2 || !$(id)) return;
    e.preventDefault();
    scrollTo(id);
  }));

  /* ---------- Cursor ---------- */
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener("pointermove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });

  if (finePointer) {
    const cursor = $(".cursor"), ring = $(".cursor__ring"), dot = $(".cursor__dot"), label = $(".cursor__label");
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" });
    const ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    const dx = gsap.quickTo(dot, "x", { duration: 0.08 });
    const dy = gsap.quickTo(dot, "y", { duration: 0.08 });
    addEventListener("pointermove", (e) => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup", () => cursor.classList.remove("is-down"));
    document.addEventListener("pointerover", (e) => {
      const t = e.target.closest("[data-cursor]");
      if (t) { label.textContent = t.dataset.cursor; cursor.classList.add("has-label"); }
      else if (e.target.closest("a, button")) { label.textContent = ""; cursor.classList.add("has-label"); }
      else cursor.classList.remove("has-label");
    });
    document.addEventListener("pointerleave", () => gsap.to(cursor, { opacity: 0, duration: 0.2 }));
    document.addEventListener("pointerenter", () => gsap.to(cursor, { opacity: 1, duration: 0.2 }));
  }

  /* ---------- Magnetic ---------- */
  if (finePointer) {
    $$("[data-magnetic]").forEach((el) => {
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.35);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      el.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* =========================================================
     SOUND — everything synthesised with Web Audio, no files.
     Off by default; browsers only allow audio after a gesture.
     ========================================================= */
  const sfx = (() => {
    const KEY = "sk-sound";
    let ctx = null, master, wet, on = false, wanted = false;
    try { wanted = localStorage.getItem(KEY) === "1"; } catch (_) {}
    const btn = $(".nav__sound");
    const label = btn && $(".nav__sound-label", btn);

    // Calm by design: sine tones only, gentle pitches, soft attacks,
    // and a low-pass on the master so nothing sounds sharp.
    const boot = () => {
      if (ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      const soften = ctx.createBiquadFilter();
      soften.type = "lowpass"; soften.frequency.value = 2400; soften.Q.value = 0.5;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -24; comp.ratio.value = 3; comp.attack.value = 0.01;
      master = ctx.createGain(); master.gain.value = 0;
      master.connect(soften).connect(comp).connect(ctx.destination);
      // faint, short echo that gives the notes some air
      const delay = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
      delay.delayTime.value = 0.22; fb.gain.value = 0.2; lp.type = "lowpass"; lp.frequency.value = 1500;
      wet = ctx.createGain(); wet.gain.value = 0.12;
      wet.connect(delay); delay.connect(lp).connect(fb).connect(delay); lp.connect(master);
    };
    // fade the whole mix in, so turning sound on never starts abruptly
    const fadeMaster = (to, time) => {
      const t = ctx.currentTime;
      master.gain.cancelScheduledValues(t);
      master.gain.setValueAtTime(master.gain.value, t);
      master.gain.linearRampToValueAtTime(to, t + time);
    };
    const env = (g, t, peak, a, d) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    };
    const tone = ({ f0, f1 = f0, peak = 0.03, a = 0.015, d = 0.2, send = false, at = 0 }) => {
      if (!on) return;
      const t = ctx.currentTime + at, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.setValueAtTime(f0, t);
      if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
      env(g, t, peak, a, d);
      o.connect(g).connect(master); if (send) g.connect(wet);
      o.start(t); o.stop(t + a + d + 0.05);
    };
    let noiseBuf = null;
    const breath = ({ f0, f1, peak = 0.015, a = 0.12, d = 0.3 }) => {
      if (!on) return;
      if (!noiseBuf) {
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const ch = noiseBuf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      }
      const t = ctx.currentTime, src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; flt.type = "lowpass"; flt.Q.value = 0.4;
      flt.frequency.setValueAtTime(f0, t); flt.frequency.exponentialRampToValueAtTime(f1, t + a + d);
      env(g, t, peak, a, d);
      src.connect(flt).connect(g).connect(master);
      src.start(t); src.stop(t + a + d + 0.05);
    };

    const paint = () => {
      if (!btn) return;
      btn.classList.toggle("is-on", wanted);
      btn.setAttribute("aria-pressed", String(wanted));
      label.textContent = wanted ? "SOUND ON" : "SOUND OFF";
    };
    const enable = () => {
      boot(); if (!ctx) return;
      ctx.resume(); on = true;
      fadeMaster(0.55, 0.6);
    };
    const disable = () => { if (ctx) { fadeMaster(0, 0.25); setTimeout(() => { if (!wanted) on = false; }, 300); } };
    const toggle = () => {
      wanted = !wanted;
      try { localStorage.setItem(KEY, wanted ? "1" : "0"); } catch (_) {}
      paint(); wanted ? enable() : disable();
    };

    // C-major pentatonic, one note per hero letter
    const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
    let lastChime = 0;
    const api = {
      get on() { return on; },
      toggle,
      tick: () => tone({ f0: 740, f1: 660, peak: 0.012, a: 0.01, d: 0.08 }),
      click: () => tone({ f0: 392, f1: 294, peak: 0.03, a: 0.008, d: 0.14 }),
      note: (i) => tone({ f0: SCALE[i % SCALE.length], peak: 0.028, a: 0.025, d: 0.9, send: true }),
      chime: (n = 0) => {
        const now = performance.now(); if (now - lastChime < 700) return; lastChime = now;
        const f = SCALE[(n + 2) % SCALE.length];
        tone({ f0: f, peak: 0.02, a: 0.03, d: 0.8, send: true });
        tone({ f0: f * 1.5, peak: 0.014, a: 0.03, d: 0.8, send: true, at: 0.1 });
      },
      swoosh: () => breath({ f0: 700, f1: 380, peak: 0.016, a: 0.12, d: 0.28 }),
      whoosh: () => breath({ f0: 900, f1: 300, peak: 0.02, a: 0.18, d: 0.45 }),
      thud: () => tone({ f0: 196, f1: 131, peak: 0.035, a: 0.01, d: 0.18 }),
      lift: () => tone({ f0: 330, f1: 392, peak: 0.018, a: 0.02, d: 0.14 }),
      ding: () => { tone({ f0: 784, peak: 0.02, a: 0.01, d: 0.7, send: true }); tone({ f0: 1047, peak: 0.01, a: 0.01, d: 0.5, send: true, at: 0.08 }); },
      blip: () => tone({ f0: 523, f1: 587, peak: 0.016, a: 0.01, d: 0.08 }),
      velocity: () => {},
    };

    paint();
    btn && btn.addEventListener("click", (e) => { e.stopPropagation(); toggle(); });
    // a remembered "on" preference starts at the first gesture (autoplay rules)
    const firstGesture = () => { if (wanted && !on) enable(); };
    addEventListener("pointerdown", firstGesture, { once: true });
    addEventListener("keydown", firstGesture, { once: true });
    document.addEventListener("visibilitychange", () => { if (ctx && on) document.hidden ? ctx.suspend() : ctx.resume(); });

    // interaction sounds: a faint tick on hovering links/buttons, a soft tap on click
    let lastHover = null, lastT = 0;
    document.addEventListener("pointerover", (e) => {
      if (!on || e.pointerType !== "mouse") return;
      const t = e.target.closest("a, button");
      if (!t || t === lastHover) return;
      lastHover = t;
      const now = performance.now(); if (now - lastT < 120) return; lastT = now;
      api.tick();
    });
    document.addEventListener("pointerout", (e) => { if (lastHover && !lastHover.contains(e.relatedTarget)) lastHover = null; });
    document.addEventListener("pointerdown", (e) => { if (on && e.target.closest("a, button, .file, .idcol")) api.click(); });
    return api;
  })();

  /* ---------- Scramble on hover ---------- */
  $$("[data-scramble]").forEach((el) => {
    const text = el.textContent;
    el.addEventListener("pointerenter", () => {
      if (!window.ScrambleTextPlugin) return;
      gsap.to(el, { duration: 0.6, scrambleText: { text, chars: "!<>-_\\/[]{}—=+*^?#01", speed: 0.6 } });
    });
  });

  /* =========================================================
     AURORA (WebGL) — the "After" specimen gradient
     ========================================================= */
  function initAurora() {
    const canvas = $(".hero__aurora");
    const gl = canvas && canvas.getContext("webgl", { antialias: false, premultipliedAlpha: false });
    if (!gl) { canvas && canvas.remove(); return; }

    const vs = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;
    const fs = `
      precision highp float;
      uniform vec2 r; uniform float t; uniform vec2 m;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
        return mix(mix(h(i), h(i+vec2(1,0)), u.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), u.x), u.y); }
      float fbm(vec2 p){ float v = 0., a = .5; for(int i=0;i<5;i++){ v += a*n(p); p = p*2.03 + 7.1; a *= .5; } return v; }
      vec3 ramp(float y){
        vec3 c0 = vec3(.93,.72,.52);   // peach
        vec3 c1 = vec3(.89,.43,.18);   // orange
        vec3 c2 = vec3(.85,.15,.10);   // red
        vec3 c3 = vec3(.43,.00,.10);   // burgundy #6D001A
        vec3 c4 = vec3(.33,.13,.25);   // plum
        vec3 c5 = vec3(.07,.53,.37);   // emerald
        vec3 c6 = vec3(.04,.36,.27);
        vec3 c = mix(c0, c1, smoothstep(.00,.22,y));
        c = mix(c, c2, smoothstep(.20,.40,y));
        c = mix(c, c3, smoothstep(.38,.55,y));
        c = mix(c, c4, smoothstep(.52,.66,y));
        c = mix(c, c5, smoothstep(.64,.84,y));
        c = mix(c, c6, smoothstep(.86,1.,y));
        return c;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / r;
        vec2 q = uv * vec2(r.x/r.y, 1.) * 1.4;
        float w = fbm(q + vec2(t*.035, -t*.02) + m*.25);
        float w2 = fbm(q*1.7 - vec2(t*.02, t*.03) + w);
        float y = uv.y + (w2 - .5) * .55 + sin(uv.x*2.6 + t*.15 + m.x)*.07 + m.y*.06;
        vec3 col = ramp(clamp(y, 0., 1.));
        col += (w - .5) * .12;
        float v = smoothstep(1.25, .35, length(uv - .5));
        col *= mix(.78, 1.04, v);
        col += (h(gl_FragCoord.xy + fract(t)*91.) - .5) * .085;
        gl_FragColor = vec4(col, 1.);
      }`;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, "r"), uT = gl.getUniformLocation(prog, "t"), uM = gl.getUniformLocation(prog, "m");

    const scale = 0.5; // render at half-res, the blur-y look hides it
    const resize = () => {
      const w = canvas.clientWidth, hgt = canvas.clientHeight;
      canvas.width = Math.max(1, w * scale); canvas.height = Math.max(1, hgt * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize(); addEventListener("resize", resize);

    let visible = true, sm = { x: 0, y: 0 };
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
    const start = performance.now();
    gsap.ticker.add(() => {
      if (!visible) return;
      sm.x = lerp(sm.x, mouse.x / innerWidth - 0.5, 0.04);
      sm.y = lerp(sm.y, mouse.y / innerHeight - 0.5, 0.04);
      gl.uniform2f(uR, canvas.width, canvas.height);
      gl.uniform1f(uT, reduced ? 8 : (performance.now() - start) / 1000);
      gl.uniform2f(uM, sm.x, -sm.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  /* ---------- Hero: variable-font proximity ---------- */
  function initHeroLetters() {
    const letters = $$(".hw");
    if (!finePointer || reduced) return;
    const state = letters.map(() => ({ w: 800, s: 112, hot: false }));
    let active = false;
    const hero = $(".hero");
    hero.addEventListener("pointerenter", () => (active = true));
    hero.addEventListener("pointerleave", () => (active = false));
    gsap.ticker.add(() => {
      letters.forEach((el, i) => {
        let tw = 800, ts = 112;
        if (active) {
          const r = el.getBoundingClientRect();
          const d = Math.hypot(mouse.x - (r.left + r.width / 2), mouse.y - (r.top + r.height / 2));
          const k = clamp(1 - d / (r.height * 1.6), 0, 1);
          tw = lerp(650, 900, k);
          ts = lerp(100, 125, k);
          const hot = k > 0.55;
          if (hot && !state[i].hot) sfx.note(i);
          state[i].hot = hot;
        } else state[i].hot = false;
        const st = state[i];
        st.w = lerp(st.w, tw, 0.12); st.s = lerp(st.s, ts, 0.12);
        el.style.fontVariationSettings = `"wght" ${st.w.toFixed(1)}, "wdth" ${st.s.toFixed(1)}`;
      });
    });
  }

  /* =========================================================
     PRELOADER → INTRO
     ========================================================= */
  function runLoader() {
    const loader = $(".loader");
    const num = $(".loader__num"), log = $(".loader__log"), bar = $(".loader__bar i");
    const lines = ["mounting /src/sanat.os", "compiling aurora.glsl", "indexing 10,000 sky tiles", "warming up LightGBM", "opening RFQ window: 15s", "ready."];
    const counter = { v: 0 };
    let shown = 0;

    return new Promise((resolve) => {
      if (reduced) { loader.remove(); resolve(); return; }
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to(counter, {
        v: 100, duration: 2.1, ease: "power2.inOut",
        onUpdate() {
          const v = Math.round(counter.v);
          num.textContent = String(v).padStart(3, "0");
          bar.style.transform = `scaleX(${counter.v / 100})`;
          const want = Math.floor((counter.v / 100) * lines.length);
          while (shown < want) { const li = document.createElement("li"); li.textContent = lines[shown++]; log.appendChild(li); }
        },
      })
        .to(loader, { clipPath: "inset(0 0 100% 0)", duration: 1, ease: "expo.inOut" }, "+=0.15")
        .add(() => loader.remove());
      // failsafe: background tabs throttle rAF — never trap the visitor behind the loader
      setTimeout(() => tl.progress() < 1 && tl.progress(1), 7000);
    });
  }

  function introHero() {
    document.body.classList.remove("is-loading");
    lenis && lenis.start();
    if (reduced) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    tl.from(".hero__shell", { scale: 0.92, borderRadius: 60, duration: 1.6 }, 0)
      .from(".hero__frame", { clipPath: "inset(18% 18% 18% 18% round 40px)", duration: 1.6 }, 0)
      .from(".hw", { yPercent: 110, rotate: 8, opacity: 0, duration: 1.3, stagger: 0.07 }, 0.25)
      .from(".hero__spec > div", { y: 20, opacity: 0, duration: 1, stagger: 0.08 }, 0.7)
      .from(".hero__corner, .hero__scroll, .hero__hint, .nav", { opacity: 0, y: -8, duration: 1, stagger: 0.05 }, 0.8);
  }

  /* =========================================================
     SCROLL SCENES
     ========================================================= */
  function initScroll() {
    // Section counter pill + nav state
    const pillCur = $(".pill__cur");
    const navLinks = $$(".nav__links a");
    $$("[data-section]").forEach((sec) => {
      ST.create({
        trigger: sec, start: "top 55%", end: "bottom 55%",
        onToggle(self) {
          if (!self.isActive) return;
          const n = sec.dataset.section;
          if (pillCur.textContent !== n) {
            window.ScrambleTextPlugin ? gsap.to(pillCur, { duration: 0.5, scrambleText: { text: n, chars: "0123456789" } }) : (pillCur.textContent = n);
            sfx.chime(+n);
          }
          navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + sec.id));
        },
      });
    });

    const pill = $(".pill");
    ST.create({ trigger: ".foot", start: "top bottom", onToggle: (self) => pill.classList.toggle("is-hidden", self.isActive) });

    if (reduced) return;

    // Hero exit: frame scales down & word lifts
    gsap.to(".hero__word", { yPercent: -30, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__shell", { scale: 0.94, opacity: 0.4, ease: "none", scrollTrigger: { trigger: ".hero", start: "20% top", end: "bottom top", scrub: true } });

    // About: giant PORTFOLIO letters rise
    gsap.from(".about__big span", {
      yPercent: 100, opacity: 0, stagger: 0.05, ease: "power3.out",
      scrollTrigger: { trigger: ".about", start: "top 85%", end: "top 25%", scrub: 1 },
    });
    gsap.to(".about__big", { xPercent: -8, ease: "none", scrollTrigger: { trigger: ".about", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".about__portrait", { clipPath: "inset(100% 0 0 0)", duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: ".about__portrait", start: "top 85%" } });
    gsap.fromTo(".portrait__img img", { yPercent: -10 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: ".about__portrait", start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(".about__script, .about__name, .about__role", { y: 60, opacity: 0, stagger: 0.1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".about__left", start: "top 80%" } });
    gsap.from(".about__claim, .stats li", { x: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".about__right", start: "top 85%" } });

    // Counters
    $$("[data-count]").forEach((el) => {
      const end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), pad = +(el.dataset.pad || 0);
      const suf = el.dataset.suffix || "", comma = el.hasAttribute("data-comma");
      const o = { v: 0 };
      const fmt = (v) => {
        let s = v.toFixed(dec);
        if (comma) s = Math.round(v).toLocaleString("en-US");
        if (pad) s = s.padStart(pad, "0");
        return s + suf;
      };
      el.textContent = fmt(0);
      gsap.to(o, { v: end, duration: 2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 90%" }, onUpdate: () => (el.textContent = fmt(o.v)) });
    });

    // Manifesto: scrubbed word highlight
    const mt = $("[data-words]");
    if (mt) {
      mt.innerHTML = mt.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
      gsap.to($$(".w", mt), { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: mt, start: "top 80%", end: "bottom 45%", scrub: true } });
      gsap.from(".manifesto .br", { scale: 0, duration: 0.8, ease: "back.out(2)", stagger: 0.08, scrollTrigger: { trigger: ".manifesto", start: "top 80%" } });
      gsap.from(".manifesto__smile", { rotate: -90, scale: 0.4, opacity: 0, ease: "back.out(1.6)", duration: 1.2, scrollTrigger: { trigger: ".manifesto", start: "top 70%" } });
    }

    // Identity card: columns rise, vertical words wipe in
    gsap.from(".idcol", { yPercent: 30, opacity: 0, stagger: 0.12, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".idcard", start: "top 75%" } });
    gsap.from(".idcol__word", { clipPath: "inset(100% 0 0 0)", duration: 1.4, stagger: 0.12, ease: "expo.inOut", scrollTrigger: { trigger: ".idcard", start: "top 60%" } });

    // Journey
    $$("[data-split]").forEach((el) => {
      if (!window.SplitText) return;
      const split = new SplitText(el, { type: "lines", mask: "lines", linesClass: "split-line" });
      gsap.from(split.lines, { yPercent: 110, duration: 1.2, stagger: 0.1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    $$("[data-reveal]").forEach((el) => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%" } }));

    const proc = $(".process"), procItems = $$(".process li");
    ST.create({
      trigger: proc, start: "top 75%", end: "bottom 55%", scrub: true,
      onUpdate(self) {
        proc.style.setProperty("--p", self.progress.toFixed(3));
        procItems.forEach((li, i) => li.classList.toggle("is-on", self.progress >= i / (procItems.length - 1) - 0.02));
      },
    });
    gsap.from(".jcol--quote > *", { y: 30, opacity: 0, stagger: 0.1, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".jcol--quote", start: "top 80%" } });
    gsap.from(".ach__list li, .certs__list li", { y: 24, opacity: 0, stagger: 0.06, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: ".jgrid2", start: "top 85%" } });
    gsap.from(".chips span", { scale: 0.6, opacity: 0, stagger: 0.025, duration: 0.6, ease: "back.out(2)", scrollTrigger: { trigger: ".chips", start: "top 90%" } });

    // After hours
    gsap.from(".after__title", { yPercent: 40, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".after", start: "top 70%" } });

    // Contact
    gsap.from(".contact__rows li", { x: 40, opacity: 0, stagger: 0.08, duration: 1, ease: "expo.out", scrollTrigger: { trigger: ".contact__rows", start: "top 85%" } });
    gsap.from(".rebel span", { yPercent: 100, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: ".rebel", start: "top 95%" } });
  }

  /* ---------- Velocity marquee ---------- */
  function initMarquee() {
    const track = $(".marquee__track");
    if (!track) return;
    track.innerHTML += track.innerHTML; // seamless loop
    let x = 0, half = 0, vel = 0, dir = -1;
    const measure = () => (half = track.scrollWidth / 2);
    measure(); addEventListener("resize", measure);
    if (lenis) lenis.on("scroll", (l) => { vel = l.velocity; if (Math.abs(vel) > 0.5) dir = vel > 0 ? -1 : 1; });
    gsap.ticker.add((_, dt) => {
      const speed = reduced ? 0 : (0.06 + Math.min(Math.abs(vel) * 0.02, 0.9)) * dt;
      x += dir * speed;
      if (x <= -half) x += half;
      if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${clamp(-vel * 0.25, -12, 12)}deg)`;
      vel *= 0.92;
    });
  }

  /* ---------- Identity hover ---------- */
  function initIdentity() {
    const card = $(".idcard");
    $$(".idcol", card).forEach((col) => {
      const n = col.dataset.col;
      const on = () => { card.classList.remove("is-1", "is-2", "is-3"); card.classList.add("is-" + n); };
      col.addEventListener("pointerenter", on);
      col.addEventListener("click", on);
    });
    card.addEventListener("pointerleave", () => card.classList.remove("is-1", "is-2", "is-3"));

    // scrolling SQL texture
    const sql = [
      "SELECT ticker, close,", "  AVG(close) OVER w AS sma_20", "FROM prices", "WINDOW w AS (PARTITION BY ticker", "  ORDER BY dt ROWS 19 PRECEDING);", "",
      "-- fraud features", "SELECT c.id, COUNT(d.id) AS donors,", "  SUM(d.amt) / NULLIF(c.goal,0) AS fill", "FROM campaigns c", "LEFT JOIN donations d ON d.cid = c.id", "GROUP BY c.id;", "",
      "df = pd.read_sql(q, engine)", "df['rsi'] = rsi(df.close, 14)", "model.fit(X_train, y_train)", "faiss_index.add(embeddings)", "",
    ];
    const pre = $(".code-scroll");
    if (pre) pre.textContent = (sql.join("\n") + "\n").repeat(4);
  }

  /* =========================================================
     WORK — file dividers
     ========================================================= */
  const fileHooks = {}; // index → { on(), off() }
  function initFiles() {
    const files = $$(".file[data-file]");
    let current = -1;
    const setActive = (i) => {
      if (i === current) return;
      if (current >= 0) { fileHooks[current]?.off?.(); sfx.swoosh(); }
      current = i;
      files.forEach((f, k) => f.classList.toggle("is-active", k === i));
      fileHooks[i]?.on?.();
    };

    const mm = gsap.matchMedia();
    mm.add("(min-width: 901px)", () => {
      setActive(0);
      const st = ST.create({
        trigger: ".work", start: "top top", end: () => "+=" + innerHeight * files.length * 0.9,
        pin: true, anticipatePin: 1,
        onUpdate(self) { setActive(clamp(Math.floor(self.progress * files.length), 0, files.length - 1)); },
      });
      const go = (i) => {
        const y = st.start + ((i + 0.5) / files.length) * (st.end - st.start);
        lenis ? lenis.scrollTo(y, { duration: 1.2 }) : scrollTo.native(y);
      };
      const handlers = files.map((f, i) => {
        const h = (e) => { if (e.target.closest("a")) return; if (!f.classList.contains("is-active")) go(i); };
        f.addEventListener("click", h);
        return h;
      });
      if (!reduced) {
        gsap.from(".files > .file", { xPercent: 60, opacity: 0, stagger: 0.08, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".work", start: "top 70%" } });
      }
      return () => files.forEach((f, i) => f.removeEventListener("click", handlers[i]));
    });
    mm.add("(max-width: 900px)", () => {
      setActive(0);
      const handlers = files.map((f, i) => {
        const head = $(".file__head", f);
        const h = () => setActive(f.classList.contains("is-active") ? -1 : i);
        head.addEventListener("click", h);
        return [head, h];
      });
      return () => handlers.forEach(([el, h]) => el.removeEventListener("click", h));
    });
  }

  /* --- 001 TradeFlow RFQ --- */
  function initRFQ() {
    const root = $(".rfq");
    if (!root) return;
    const tbody = $("tbody", root), fg = $(".rfq__fg", root), time = $(".rfq__time", root);
    const kFill = $(".k-fill", root), kSprd = $(".k-sprd", root), kRisk = $(".k-risk", root);
    const C = 2 * Math.PI * 52;
    const dealers = ["DLR_A", "DLR_B", "DLR_C", "DLR_D"].map((name) => {
      const bid = 98.4 + Math.random() * 0.3;
      return { name, bid, ask: bid + 0.05 + Math.random() * 0.08 };
    });
    tbody.innerHTML = dealers.map((d) => `<tr><td>${d.name}</td><td></td><td></td><td></td></tr>`).join("");
    const rows = $$("tr", tbody);
    const yld = (px) => (4.125 + (100 - px) * 0.12).toFixed(3);
    const paint = (i, flash) => {
      const d = dealers[i], tds = rows[i].children;
      tds[1].textContent = d.bid.toFixed(3); tds[2].textContent = d.ask.toFixed(3); tds[3].textContent = yld(d.ask) + "%";
      if (flash) { tds[2].className = flash; setTimeout(() => (tds[2].className = ""), 500); }
    };
    dealers.forEach((_, i) => paint(i));

    let t = 15, fills = 0, spreads = [], running = false, tick = 0, holding = 0;
    const update = (_, dt) => {
      if (!running) return;
      const s = dt / 1000;
      if (holding > 0) { holding -= s; if (holding <= 0) { root.classList.remove("is-filled"); rows.forEach((r) => r.classList.remove("is-win")); t = 15; } return; }
      t -= s; tick += s;
      if (tick > 0.55) {
        tick = 0;
        const i = (Math.random() * 4) | 0, d = dealers[i], delta = (Math.random() - 0.5) * 0.06;
        d.bid += delta; d.ask = Math.max(d.bid + 0.03, d.ask + delta + (Math.random() - 0.6) * 0.02);
        paint(i, delta < 0 ? "flash-up" : "flash-dn");
      }
      if (t <= 0) {
        t = 0;
        let best = 0; dealers.forEach((d, i) => { if (d.ask < dealers[best].ask) best = i; });
        rows[best].classList.add("is-win"); root.classList.add("is-filled");
        fills++; spreads.push(dealers[best].ask - dealers[best].bid);
        kFill.textContent = fills;
        kSprd.textContent = (spreads.reduce((a, b) => a + b, 0) / spreads.length * 100).toFixed(1) + "bp";
        kRisk.textContent = Math.random() > 0.8 ? "MED" : "LOW";
        holding = 2.2;
        sfx.ding();
      }
      time.textContent = t.toFixed(1);
      fg.style.strokeDashoffset = (C * (1 - t / 15)).toFixed(1);
    };
    gsap.ticker.add(update);
    fileHooks[0] = { on: () => (running = true), off: () => (running = false) };
  }

  /* --- 002 Finance chart --- */
  function initFinance() {
    const svg = $(".fin__svg");
    if (!svg) return;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const N = 120, W = 600, P = [];
    let p = 182;
    for (let i = 0; i < N; i++) { p += (rnd() - 0.47) * 4.2; P.push(p); }
    const min = Math.min(...P), max = Math.max(...P);
    const X = (i) => (i / (N - 1)) * W;
    const Y = (v) => 170 - ((v - min) / (max - min)) * 155;
    const path = (arr, yf) => arr.map((v, i) => (v == null ? "" : `${i && arr[i - 1] != null ? "L" : "M"}${X(i).toFixed(1)},${yf(v).toFixed(1)}`)).join("");
    const sma = P.map((_, i) => (i < 19 ? null : P.slice(i - 19, i + 1).reduce((a, b) => a + b, 0) / 20));
    const rsi = P.map((_, i) => {
      if (i < 14) return null;
      let g = 0, l = 0;
      for (let k = i - 13; k <= i; k++) { const d = P[k] - P[k - 1]; d > 0 ? (g += d) : (l -= d); }
      return 100 - 100 / (1 + g / (l || 1e-6));
    });
    const RY = (v) => 262 - (v / 100) * 56;
    $(".fin__price").setAttribute("d", path(P, Y));
    $(".fin__area").setAttribute("d", path(P, Y) + `L${W},170L0,170Z`);
    $(".fin__sma").setAttribute("d", path(sma, Y));
    $(".fin__rsi").setAttribute("d", path(rsi, RY));
    $(".fin__grid").innerHTML = [40, 80, 120, 160].map((y) => `<line x1="0" x2="${W}" y1="${y}" y2="${y}"/>`).join("");
    $(".fin__px").textContent = P[N - 1].toFixed(2) + (P[N - 1] > P[N - 21] ? " ▲" : " ▼");

    const lines = $$(".fin__price, .fin__sma, .fin__rsi");
    lines.forEach((l) => { const len = l.getTotalLength(); l.style.strokeDasharray = l.classList.contains("fin__sma") ? "" : len; l.dataset.len = len; });
    const typeEl = $(".fin__type");
    const last = rsi[N - 1].toFixed(0);
    const msg = `price ${P[N - 1] > sma[N - 1] ? "above" : "below"} SMA20; RSI ${last} → ${last > 70 ? "overbought" : last < 30 ? "oversold" : "neutral momentum"}. Filings show stable margins — hold, watch MACD cross.`;
    let tw;
    fileHooks[1] = {
      on() {
        if (reduced) { typeEl.textContent = msg; return; }
        lines.forEach((l) => { if (!l.classList.contains("fin__sma")) gsap.fromTo(l, { strokeDashoffset: +l.dataset.len }, { strokeDashoffset: 0, duration: 2, ease: "power2.inOut", delay: 0.5 }); });
        gsap.fromTo(".fin__sma", { opacity: 0 }, { opacity: 1, duration: 1, delay: 1.6 });
        gsap.fromTo(".fin__area", { opacity: 0 }, { opacity: 0.12, duration: 1.2, delay: 1.4 });
        const o = { n: 0 };
        tw && tw.kill();
        tw = gsap.to(o, { n: msg.length, duration: msg.length * 0.025, delay: 1.8, ease: "none", onUpdate: () => (typeEl.textContent = msg.slice(0, Math.round(o.n))) });
      },
      off() { tw && tw.kill(); },
    };
  }

  /* --- 003 EmpathI scan --- */
  function initEmpathi() {
    const grid = $(".emp__grid");
    if (!grid) return;
    const n = 96;
    grid.innerHTML = "<i></i>".repeat(n);
    const cells = $$("i", grid), sc = $(".e-scan"), fl = $(".e-flag");
    let i = 0, scanned = 0, flagged = 0, timer = null;
    const step = () => {
      const c = cells[i % n];
      if (i % n === 0 && i) cells.forEach((x) => (x.className = ""));
      c.className = "is-scan";
      const prev = cells[(i - 1 + n) % n];
      if (prev && prev.classList.contains("is-scan")) prev.className = Math.random() < 0.09 ? "is-flag" : "is-ok";
      if (prev.className === "is-flag") flagged++;
      scanned++; i++;
      sc.textContent = scanned; fl.textContent = flagged;
    };
    fileHooks[2] = {
      on() { if (!timer) timer = setInterval(step, reduced ? 400 : 70); },
      off() { clearInterval(timer); timer = null; },
    };
  }

  /* --- 004 Messier sky --- */
  function initSky() {
    const box = $(".sky"), cv = $(".sky__canvas");
    if (!cv) return;
    const ctx = cv.getContext("2d"), target = $(".sky__target");
    const stars = Array.from({ length: 420 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() ** 3 * 1.6 + 0.3, z: Math.random() * 0.9 + 0.1, tw: Math.random() * 6 }));
    const M = [
      ["M1", "Crab Nebula", 0.18, 0.3], ["M13", "Hercules Cluster", 0.72, 0.22], ["M31", "Andromeda Galaxy", 0.42, 0.62],
      ["M42", "Orion Nebula", 0.84, 0.66], ["M45", "Pleiades", 0.3, 0.16], ["M51", "Whirlpool Galaxy", 0.6, 0.42],
      ["M57", "Ring Nebula", 0.12, 0.74], ["M104", "Sombrero Galaxy", 0.92, 0.36],
    ].map(([id, name, x, y]) => ({ id, name, x, y }));
    let W = 0, H = 0, running = false, sm = { x: 0, y: 0 }, local = { x: -1, y: -1 }, t0 = 0;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => { const r = box.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    box.addEventListener("pointermove", (e) => { const r = box.getBoundingClientRect(); local.x = e.clientX - r.left; local.y = e.clientY - r.top; });
    box.addEventListener("pointerleave", () => (local.x = local.y = -1));
    addEventListener("resize", () => running && resize());
    const draw = (time) => {
      if (!running) return;
      t0 = time / 1000;
      const tx = local.x < 0 ? 0 : local.x / W - 0.5, ty = local.y < 0 ? 0 : local.y / H - 0.5;
      sm.x = lerp(sm.x, tx, 0.05); sm.y = lerp(sm.y, ty, 0.05);
      ctx.clearRect(0, 0, W, H);
      for (const s of stars) {
        const x = ((s.x + t0 * 0.004 * s.z) % 1) * W - sm.x * 40 * s.z;
        const y = s.y * H - sm.y * 40 * s.z;
        ctx.globalAlpha = 0.35 + 0.65 * Math.abs(Math.sin(t0 * 1.3 + s.tw)) * s.z;
        ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.arc(x, y, s.r, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
      let hit = null;
      for (const m of M) {
        const x = m.x * W - sm.x * 60, y = m.y * H - sm.y * 60;
        const near = local.x >= 0 && Math.hypot(local.x - x, local.y - y) < 44;
        if (near) hit = m;
        const s = near ? 16 : 10;
        ctx.strokeStyle = near ? "#e3243b" : "rgba(255,255,255,.55)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { ctx.moveTo(x + a * s, y + b * (s - 5)); ctx.lineTo(x + a * s, y + b * s); ctx.lineTo(x + a * (s - 5), y + b * s); });
        ctx.stroke();
        const g = ctx.createRadialGradient(x, y, 0, x, y, near ? 12 : 7);
        g.addColorStop(0, near ? "rgba(255,180,190,.95)" : "rgba(255,255,255,.8)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, near ? 12 : 7, 0, 6.283); ctx.fill();
        ctx.fillStyle = near ? "#e3243b" : "rgba(255,255,255,.75)";
        ctx.font = "500 10px JetBrains Mono, monospace";
        ctx.fillText(near ? `${m.id} · ${m.name}` : m.id, x + s + 6, y + 3);
      }
      target.textContent = "TARGET: " + (hit ? `${hit.id} ${hit.name.toUpperCase()}` : "—");
      requestAnimationFrame(draw);
    };
    fileHooks[3] = {
      on() { if (running) return; running = true; requestAnimationFrame(() => { resize(); requestAnimationFrame(draw); }); },
      off() { running = false; },
    };
  }

  /* --- 005 GitHub feed --- */
  function initFeed() {
    const list = $(".feed__list");
    if (!list) return;
    const fallback = [
      { name: "TradeFlow", language: "Python", stargazers_count: null, html_url: "https://github.com/sanatK24", updated_at: null },
      { name: "AI-Financial-Research", language: "Python", stargazers_count: null, html_url: "https://github.com/sanatK24", updated_at: null },
      { name: "EmpathI", language: "Python", stargazers_count: null, html_url: "https://github.com/sanatK24", updated_at: null },
      { name: "Messier-Deep-Sky", language: "JavaScript", stargazers_count: null, html_url: "https://github.com/sanatK24", updated_at: null },
    ];
    const render = (repos) => {
      list.innerHTML = repos.slice(0, 5).map((r) => {
        const date = r.updated_at ? new Date(r.updated_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" }).toUpperCase() : "REPO";
        const gx = 6 + ((r.name.length * 7) % 14), gy = 5 + ((r.name.length * 3) % 9);
        return `<li><a href="${r.html_url}" target="_blank" rel="noopener" data-cursor="Repo">
          <i class="glitchbox" style="--gx:${gx}px;--gy:${gy}px"></i>
          <span><b>${r.name.replace(/[<>&"]/g, "")}.GIT</b><small>${r.language || "—"}${r.stargazers_count != null ? " · ★ " + r.stargazers_count : ""}</small></span>
          <em>${date}</em></a></li>`;
      }).join("");
    };
    render(fallback);
    fetch("https://api.github.com/users/sanatK24/repos?sort=updated&per_page=8")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((repos) => { const own = repos.filter((r) => !r.fork); if (own.length) render(own); })
      .catch(() => {});
  }

  /* ---------- Portrait fallback chain ---------- */
  function initPortrait() {
    const fig = $(".about__portrait"), img = fig && $("img", fig);
    if (!img) return;
    img.addEventListener("error", () => {
      if (img.dataset.fallback && img.src !== img.dataset.fallback) { img.src = img.dataset.fallback; img.dataset.fallback = ""; }
      else fig.classList.add("no-img");
    });
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
  }

  /* ---------- After hours: draggable cards ---------- */
  function initBoard() {
    const board = $(".board"), cards = $$(".card", board);
    const layout = () => {
      if (!isDesktop()) { cards.forEach((c) => gsap.set(c, { clearProps: "left,top,x,y" })); return; }
      const W = board.clientWidth, H = Math.max(board.clientHeight, 460);
      const spots = [[0.02, 0.12], [0.2, 0.42], [0.4, 0.06], [0.6, 0.38], [0.78, 0.1]];
      cards.forEach((c, i) => { c.style.left = spots[i][0] * (W - c.offsetWidth * 0.4) + "px"; c.style.top = spots[i][1] * (H - c.offsetHeight * 0.6) + "px"; });
    };
    layout(); addEventListener("resize", layout);
    if (!window.Draggable || !isDesktop()) return;
    let z = 10;
    cards.forEach((c) => {
      Draggable.create(c, {
        bounds: board, inertia: !!window.InertiaPlugin, edgeResistance: 0.7,
        onPress() { sfx.lift(); c.style.zIndex = ++z; gsap.to(c, { scale: 1.06, rotate: 0, duration: 0.3 }); c.classList.add("is-dragging"); },
        onRelease() { sfx.thud(); gsap.to(c, { scale: 1, rotate: gsap.utils.random(-9, 9), duration: 0.6, ease: "elastic.out(1, 0.5)" }); c.classList.remove("is-dragging"); },
      });
    });
    if (!reduced) gsap.from(cards, { y: 200, rotate: () => gsap.utils.random(-30, 30), opacity: 0, stagger: 0.1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: board, start: "top 80%" } });
  }

  /* ---------- Contact bits ---------- */
  function initContact() {
    const clock = $(".clock");
    const tick = () => (clock.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
    tick(); setInterval(tick, 1000);

    const bc = $(".barcode");
    let seed = 2026, x = 0, out = "";
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    while (x < 160) { const w = 1 + Math.floor(rnd() * 3.2); if (rnd() > 0.35) out += `<rect x="${x}" y="0" width="${w}" height="34"/>`; x += w + 1; }
    bc.innerHTML = out;
  }

  /* ---------- Files: DEMO / LIVE SITE switch ---------- */
  function initVSwitch() {
    $$(".file__visual--switch").forEach((vis) => {
      const btns = $$(".vswitch button", vis);
      btns.forEach((b) => b.addEventListener("click", (e) => {
        e.stopPropagation(); sfx.blip();
        btns.forEach((x) => x.classList.toggle("is-on", x === b));
        $$(".vpane", vis).forEach((p) => (p.hidden = !p.classList.contains("vpane--" + b.dataset.v)));
      }));
    });
  }

  /* ---------- Live builds: real homepages in scaled iframes ---------- */
  function initLive() {
    const cards = $$(".lcard");
    if (!cards.length) return;
    const BASE = 1440; // render every site at a desktop width, then scale to fit the card

    const fit = (card) => {
      const fr = $(".lcard__frame iframe", card), scr = $(".lcard__screen", card);
      if (!fr) return;
      const s = scr.clientWidth / BASE;
      fr.style.width = BASE + "px";
      fr.style.height = scr.clientHeight / s + "px";
      fr.style.transform = `scale(${s})`;
    };
    const load = (card) => {
      if ($(".lcard__frame iframe", card)) return;
      const fr = document.createElement("iframe");
      fr.src = card.dataset.url;
      fr.title = $("h3", card).textContent + " — live site";
      fr.setAttribute("loading", "lazy");
      fr.addEventListener("load", () => card.classList.add("is-ready"));
      $(".lcard__frame", card).appendChild(fr);
      fit(card);
    };

    // modal
    const modal = $(".lmodal"), mFrame = $(".lmodal__frame", modal);
    const openModal = (url) => {
      $(".lmodal__url", modal).textContent = url.replace(/^https?:\/\//, "");
      $(".lmodal__open", modal).href = url;
      mFrame.src = url;
      modal.hidden = false; lenis?.stop(); sfx.whoosh();
      gsap.fromTo(".lmodal__win", { scale: 0.94, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" });
    };
    const closeModal = () => { modal.hidden = true; mFrame.src = "about:blank"; lenis?.start(); };
    $(".lmodal__x", modal).addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

    cards.forEach((card) => {
      const go = $(".lcard__go", card), x = $(".lcard__x", card);
      go.addEventListener("click", () => { sfx.chime(4); load(card); card.classList.add("is-live"); x.hidden = false; });
      x.addEventListener("click", () => {
        card.classList.remove("is-live"); x.hidden = true;
        if (!card.hasAttribute("data-autoload")) { $(".lcard__frame", card).innerHTML = ""; card.classList.remove("is-ready"); }
      });
      $(".lcard__full", card).addEventListener("click", () => openModal(card.dataset.url));
    });

    // sites without a screenshot load live as soon as they come near the viewport
    const io = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) { load(en.target); io.unobserve(en.target); }
    }), { rootMargin: "300px" });
    cards.filter((c) => c.hasAttribute("data-autoload")).forEach((c) => io.observe(c));
    addEventListener("resize", () => cards.forEach(fit));

    if (!reduced) gsap.from(cards, { y: 90, opacity: 0, stagger: 0.12, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: ".live__grid", start: "top 80%" } });
  }

  /* ---------- Signal: latest LinkedIn posts ----------
     Newest first. To add a post: copy its activity id from the post URL
     (linkedin.com/feed/update/urn:li:activity:<id>) and add a row at the top. */
  const POSTS = [
    { id: "7518307857755344896", date: "2026-10-20", tag: "Milestone", title: "Passing on the Webmaster baton", text: "Guided Gaurang Rane as he took over the RAIT ACM SIGAI Webmaster role — he shipped the chapter's new site with a no-code dashboard and auto light/dark mode.", r: 7 },
    { id: "7504406055377043456", date: "2026-09-12", tag: "Event", title: "AWS Future Builders Connect, Mumbai", text: "Hands-on labs at the AWS Builder Center. Biggest takeaway: picking the model is the easy part — auth, guardrails, failure handling and scale are the real work.", r: 37 },
    { id: "7476909089986580480", date: "2026-06-28", tag: "Certification", title: "Cisco Data Analytics — 3 contrarian takeaways", text: "Investigation beats calculation. Visual depth beats complexity. And bias is a technical error, not just a mental one.", r: 33 },
    { id: "7449684707660881921", date: "2026-04-14", tag: "Certification", title: "Power BI for Beginners", text: "Completed Simplilearn SkillUp's Power BI course — data visualisation, reporting and business analytics.", r: 11 },
    { id: "7421263693008633856", date: "2026-01-25", tag: "Hackathon", title: "Samsung Innovation Campus hackathon", text: "Built a campaign-support platform with Sanyukta Deshmukh, exploring transparent fundraising backed by Bitcoin-inspired document verification.", r: 12 },
    { id: "7417212926199160832", date: "2026-01-14", tag: "Milestone", title: "Selected for Samsung Innovation Campus", text: "Received the official SIC kit at RAIT, D. Y. Patil University — industry-aligned, hands-on learning ahead.", r: 38 },
    { id: "7404570515597606912", date: "2025-12-10", tag: "Certification", title: "McKinsey.org Forward Program", text: "Completed McKinsey's Forward Program on problem solving, communication and digital skills.", r: 10 },
    { id: "7404432290040492033", date: "2025-12-10", tag: "Explainer", title: "How a stack balances parentheses", text: "LIFO in action: push every opener, match every closer against the top. An empty stack at the end means balanced.", r: 15 },
    { id: "7398358986447552512", date: "2025-11-23", tag: "Certification", title: "Gemini Certified University Student", text: "Earned Google's Gemini certification for university students.", r: 23 },
    { id: "7397918995711950848", date: "2025-11-22", tag: "Explainer", title: "The Nov 2025 Cloudflare outage", text: "A carousel on what Cloudflare actually does, why one faulty config took half the internet down, and the resilience lessons.", r: 18 },
    { id: "7395154259320745985", date: "2025-11-14", tag: "Learning", title: "5-Day AI Agents Intensive with Google", text: "From a first agent to production: tools over MCP, sessions and memory, observability, and multi-agent A2A deployment.", r: 11 },
    { id: "7393579755943407616", date: "2025-11-10", tag: "Hackathon", title: "NASA Space Apps — Global Nominee", text: "Team DataDrift went from a local win in Amritsar to Global Nominee — top ~10% of 11,500+ submissions worldwide.", r: 29 },
    { id: "7366779478846431232", date: "2025-08-28", tag: "Certification", title: "Project-Based Learning · CSRBOX × IBM", text: "Mentor-led, national-level programme across data analytics, web development and AI agent architecture.", r: 18 },
    { id: "7359078041781702656", date: "2025-08-07", tag: "Milestone", title: "Webmaster, RAIT ACM SIGAI", text: "Started as Webmaster — owning the chapter's website and tech for its national hackathons.", r: 44 },
    { id: "7355268215138140160", date: "2025-07-27", tag: "Event", title: "Aspire Leaders graduation, Mumbai", text: "Aspire Institute's first Mumbai graduation ceremony — a global leadership programme spanning 195+ countries.", r: 32 },
    { id: "7347711631591669760", date: "2025-07-06", tag: "Certification", title: "IBM SkillsBuild: AI Agent Architect", text: "Five modules from AI and LLM basics through prompting to AI agents and multi-agent systems.", r: 30 },
    { id: "7331689033351237632", date: "2025-05-23", tag: "Certification", title: "Prompt Design in Vertex AI", text: "Google Cloud skill badge in prompt design with Vertex AI.", r: 12 },
    { id: "7296551543208579073", date: "2025-02-15", tag: "Win", title: "1st place — Winter Internship Program", text: "Our malariaCARE LLM healthcare chatbot took first place, built with Nishtha Sharma under Prof. Rajashree Shedge.", r: 27 },
    { id: "7268676756125962240", date: "2024-11-30", tag: "Hackathon", title: "KAINOS 2024 — F1 data deep-dive", text: "Analysed Formula 1 data via the OpenF1 API — lap times, pit stops, weather — and charted max speed by team.", r: 37 },
  ];

  function initPosts() {
    const rail = $(".posts__rail"), track = $(".posts__track");
    if (!track) return;
    const tones = ["", "pcard--burg", "pcard--bone", "", "pcard--ash", "pcard--white"];
    const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    const esc = (t) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    track.innerHTML = POSTS.map((p, i) => {
      const url = `https://www.linkedin.com/feed/update/urn:li:activity:${p.id}/`;
      return `<article class="pcard ${tones[i % tones.length]}">
        <div class="pcard__top"><span class="pcard__in"><b>in</b></span><span>${fmt(p.date)}</span></div>
        <span class="pcard__tag">${esc(p.tag)}</span>
        <h3 class="pcard__title">${esc(p.title)}</h3>
        <p class="pcard__text">${esc(p.text)}</p>
        <div class="pcard__foot"><span>✦ ${p.r} reactions</span><a href="${url}" target="_blank" rel="noopener" data-cursor="Read">READ ↗</a></div>
      </article>`;
    }).join("") + `<article class="pcard pcard--end"><span class="pcard__tag">Archive</span><h3 class="pcard__title">More on<br/>LinkedIn ↗</h3>
      <a class="btn btn--line" href="https://www.linkedin.com/in/sanat-karkhanis/recent-activity/all/" target="_blank" rel="noopener" data-cursor="Open">&gt; ALL ACTIVITY_</a></article>`;

    // drag-to-scroll (mouse); touch uses native scrolling
    let down = false, moved = false, sx = 0, sl = 0;
    rail.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; rail.classList.add("is-dragging"); }
      rail.scrollLeft = sl - dx;
    });
    addEventListener("pointerup", () => { down = false; setTimeout(() => rail.classList.remove("is-dragging"), 0); });
    rail.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

    const step = () => ($(".pcard", track).offsetWidth + 20) * 2;
    $$(".posts__nav button").forEach((b) => b.addEventListener("click", () => rail.scrollBy({ left: step() * +b.dataset.dir, behavior: "smooth" })));
    const bar = $(".posts__progress i");
    const prog = () => { const m = rail.scrollWidth - rail.clientWidth; bar.style.transform = `scaleX(${m > 0 ? rail.scrollLeft / m : 1})`; };
    rail.addEventListener("scroll", prog, { passive: true }); prog();

    if (!reduced) gsap.from(".pcard", { x: 140, opacity: 0, stagger: 0.05, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: rail, start: "top 85%" } });
  }

  /* ---------- Certificates: show all ---------- */
  function initCerts() {
    const box = $(".certs"), btn = $(".certs__more");
    if (!btn) return;
    const label = btn.textContent;
    btn.addEventListener("click", () => {
      const open = box.classList.toggle("is-open");
      btn.textContent = open ? "− SHOW FEWER" : label;
      if (open && !reduced) gsap.from(".certs__list li.is-extra", { y: 16, opacity: 0, stagger: 0.04, duration: 0.6, ease: "expo.out" });
      ST.refresh();
    });
  }

  /* ---------- Command palette ---------- */
  function initCommand() {
    const root = $(".cmd"), input = $("input", root), list = $(".cmd__list", root);
    const items = [
      { t: "Go to · Home", k: "01", run: () => scrollTo("#hero") },
      { t: "Go to · About", k: "02", run: () => scrollTo("#about") },
      { t: "Go to · Identity", k: "03", run: () => scrollTo("#identity") },
      { t: "Go to · Work", k: "04", run: () => scrollTo("#work") },
      { t: "Go to · Live builds", k: "04", run: () => scrollTo("#live") },
      { t: "Go to · Journey", k: "05", run: () => scrollTo("#journey") },
      { t: "Go to · LinkedIn posts", k: "06", run: () => scrollTo("#posts") },
      { t: "Go to · After hours", k: "07", run: () => scrollTo("#after") },
      { t: "Go to · Contact", k: "08", run: () => scrollTo("#contact") },
      { t: "Toggle sound", k: "♪", run: () => sfx.toggle() },
      { t: "Copy email address", k: "⧉", run: () => navigator.clipboard?.writeText("sanat.karkhanis2@gmail.com") },
      { t: "Open GitHub", k: "↗", run: () => open("https://github.com/sanatK24", "_blank", "noopener") },
      { t: "Open LinkedIn", k: "↗", run: () => open("https://linkedin.com/in/sanat-karkhanis/", "_blank", "noopener") },
      { t: "Download resume (PDF)", k: "↓", run: () => open("assets/Sanat_Karkhanis_Resume.pdf", "_blank", "noopener") },
    ];
    let shown = items, sel = 0;
    const render = () => {
      list.innerHTML = shown.map((it, i) => `<li class="${i === sel ? "is-sel" : ""}" data-i="${i}"><span>${it.t}</span><small>${it.k}</small></li>`).join("") || `<li><span>no matches</span></li>`;
    };
    const openP = () => { sfx.blip(); root.hidden = false; input.value = ""; shown = items; sel = 0; render(); lenis?.stop(); setTimeout(() => input.focus(), 10); gsap.fromTo(".cmd__panel", { y: -20, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "expo.out" }); };
    const closeP = () => { root.hidden = true; lenis?.start(); };
    const runSel = () => { const it = shown[sel]; if (!it) return; closeP(); it.run(); };
    input.addEventListener("input", () => { const q = input.value.toLowerCase(); shown = items.filter((i) => i.t.toLowerCase().includes(q)); sel = 0; render(); });
    list.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) { sel = +li.dataset.i; runSel(); } });
    list.addEventListener("pointermove", (e) => { const li = e.target.closest("li[data-i]"); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); } });
    root.addEventListener("click", (e) => { if (e.target === root) closeP(); });
    $$("[data-cmd-open]").forEach((b) => b.addEventListener("click", openP));
    addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); root.hidden ? openP() : closeP(); return; }
      if (root.hidden) return;
      if (e.key === "Escape") closeP();
      else if (e.key === "ArrowDown") { sel = (sel + 1) % Math.max(shown.length, 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); render(); e.preventDefault(); }
      else if (e.key === "Enter") runSel();
    });
  }

  /* =========================================================
     BOOT
     ========================================================= */
  initAurora();
  initHeroLetters();
  initMarquee();
  initIdentity();
  initPortrait();
  initRFQ(); initFinance(); initEmpathi(); initSky(); initFeed();
  initVSwitch(); initPosts(); initCerts();
  initContact();
  initCommand();

  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.all([runLoader(), fontsReady]).then(() => {
    introHero();
    initFiles();
    initLive();
    initBoard();
    initScroll();
    ST.refresh();
  });
})();
