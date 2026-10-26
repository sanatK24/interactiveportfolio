/* =========================================================
   SANAT KARKHANIS — shared UI for every page (no dependencies)
   · toast notifications     window.SK.toast(message, type)
   · command palette         window.SK.palette({ items, onOpen, onClose })
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const SK = (window.SK = window.SK || {});

  /* ---------- Toasts ---------- */
  const LABELS = { success: "OK", error: "ERR", info: "INFO", warning: "WARN" };
  let stack = null;
  SK.toast = (message, type = "success", ms = 3200) => {
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "toasts";
      stack.setAttribute("aria-live", "polite");
      document.body.appendChild(stack);
    }
    const el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.setAttribute("role", "status");
    el.innerHTML = `<span class="toast__tag">${LABELS[type] || "INFO"}</span><span class="toast__msg"></span><button type="button" class="toast__x" aria-label="Dismiss">✕</button>`;
    el.querySelector(".toast__msg").textContent = message;
    const close = () => {
      if (!el.isConnected) return;
      el.classList.add("is-out");
      setTimeout(() => el.remove(), 320);
    };
    el.querySelector(".toast__x").addEventListener("click", close);
    stack.appendChild(el);
    void el.offsetWidth; // commit the starting style so the slide-in transitions
    el.classList.add("is-in");
    setTimeout(close, ms);
  };

  SK.copy = (text, label = "Copied to clipboard") => {
    const done = () => SK.toast(label, "success");
    const fail = () => SK.toast("Couldn't copy — select it manually", "error");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, fail);
    else fail();
  };

  /* ---------- Command palette ---------- */
  SK.palette = ({ items, onOpen = () => {}, onClose = () => {} }) => {
    const root = $(".cmd");
    if (!root) return;
    const input = $("input", root), list = $(".cmd__list", root);
    let shown = items, sel = 0;
    const render = () => {
      list.innerHTML = shown.map((it, i) => `<li class="${i === sel ? "is-sel" : ""}" data-i="${i}"><span>${it.t}</span><small>${it.k}</small></li>`).join("") || `<li><span>no matches</span></li>`;
      $(".is-sel", list)?.scrollIntoView({ block: "nearest" });
    };
    const openP = () => {
      onOpen();
      root.hidden = false; input.value = ""; shown = items; sel = 0; render();
      setTimeout(() => input.focus(), 10);
    };
    const closeP = () => { root.hidden = true; onClose(); };
    const runSel = () => { const it = shown[sel]; if (!it) return; closeP(); it.run(); };
    input.addEventListener("input", () => { const q = input.value.toLowerCase(); shown = items.filter((i) => i.t.toLowerCase().includes(q)); sel = 0; render(); });
    list.addEventListener("click", (e) => { const li = e.target.closest("li[data-i]"); if (li) { sel = +li.dataset.i; runSel(); } });
    list.addEventListener("pointermove", (e) => { const li = e.target.closest("li[data-i]"); if (li && +li.dataset.i !== sel) { sel = +li.dataset.i; render(); } });
    root.addEventListener("click", (e) => { if (e.target === root) closeP(); });
    $$("[data-cmd-open]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openP(); }));
    addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); root.hidden ? openP() : closeP(); return; }
      if (root.hidden) return;
      if (e.key === "Escape") closeP();
      else if (e.key === "ArrowDown") { sel = (sel + 1) % Math.max(shown.length, 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = (sel - 1 + shown.length) % Math.max(shown.length, 1); render(); e.preventDefault(); }
      else if (e.key === "Enter") runSel();
    });
  };

  /* Commands every page shares; each page adds its own navigation on top */
  SK.commonCommands = () => [
    { t: "Copy email address", k: "⧉", run: () => SK.copy("sanat.karkhanis2@gmail.com", "Email copied — sanat.karkhanis2@gmail.com") },
    { t: "Open GitHub", k: "↗", run: () => { open("https://github.com/sanatK24", "_blank", "noopener"); SK.toast("Opening GitHub…", "info"); } },
    { t: "Open LinkedIn", k: "↗", run: () => { open("https://linkedin.com/in/sanat-karkhanis/", "_blank", "noopener"); SK.toast("Opening LinkedIn…", "info"); } },
    { t: "Download resume (PDF)", k: "↓", run: () => { open("assets/Sanat_Karkhanis_Resume.pdf", "_blank", "noopener"); SK.toast("Resume opened in a new tab", "success"); } },
  ];

  /* Email links copy + confirm, instead of silently opening a mail client */
  $$("[data-copy]").forEach((el) => el.addEventListener("click", (e) => {
    e.preventDefault();
    SK.copy(el.dataset.copy, el.dataset.copyLabel || "Copied to clipboard");
  }));
})();
