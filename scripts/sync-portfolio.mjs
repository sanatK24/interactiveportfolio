#!/usr/bin/env node
/* =========================================================
   SANAT KARKHANIS — portfolio self-heal sync
   Reads the public GitHub repos (description, homepage, README) and the résumé PDF,
   checks which live links actually respond, and writes data/portfolio.json.
   The site reads that file to fix dead links and show new repos, skills,
   certificates and roles without anyone editing the HTML.

   Usage:  node scripts/sync-portfolio.mjs [--resume-text file.txt] [--offline] [--render-only]
   Needs:  Node 20+, and `pdftotext` (poppler) on PATH for the résumé.
   Env:    GITHUB_TOKEN (optional, raises the GitHub API rate limit)
   ========================================================= */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const OFFLINE = args.includes("--offline"); // skip the live-link checks

const config = JSON.parse(await readFile(path.join(ROOT, "data/sync.config.json"), "utf8"));
const OUT = path.join(ROOT, config.output);
const previous = await readFile(OUT, "utf8").then(JSON.parse).catch(() => null);
const log = (...m) => console.log("[sync]", ...m);

/* ---------- Technology vocabulary, for tagging repos from their README ---------- */
const TECH = [
  "Python", "JavaScript", "TypeScript", "Java", "SQL", "HTML", "CSS", "C++", "Rust", "Kotlin", "Dart",
  "React", "Next.js", "Vue", "Svelte", "Angular", "Node.js", "Express", "FastAPI", "Flask", "Django", "Streamlit", "Gradio",
  "Tailwind", "Vite", "Three.js", "D3.js", "Leaflet.js", "OpenSeadragon", "GSAP", "Framer Motion",
  "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Firebase", "Firestore", "Supabase", "Redis",
  "TensorFlow", "PyTorch", "Keras", "Scikit-learn", "LightGBM", "XGBoost", "CatBoost", "Pandas", "NumPy",
  "LangChain", "FAISS", "OpenAI", "Gemini", "Hugging Face", "RAG", "LLM", "OpenCV",
  "Plotly", "Matplotlib", "Tableau", "Power BI", "Docker", "Kubernetes", "WebSockets", "REST", "GraphQL",
  "AWS", "Vercel", "Render", "Netlify", "Git",
];
// short names that are also ordinary words only count with their exact capitalisation
const EXACT = new Set(["REST", "RAG", "LLM", "Render", "Express", "Git", "Vue", "Rust", "Dart", "Gemini", "Vite"]);
const techIn = (text) => {
  const found = [];
  for (const t of TECH) {
    const re = new RegExp(`(^|[^a-z0-9])${t.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, EXACT.has(t) ? "" : "i");
    if (re.test(text)) found.push(t);
  }
  return found;
};

/* ---------- GitHub ---------- */
const GH = "https://api.github.com";
const ghHeaders = (accept = "application/vnd.github+json") => ({
  accept,
  "user-agent": "sanat-portfolio-sync",
  ...(process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});
const gh = async (url, accept) => {
  const r = await fetch(url, { headers: ghHeaders(accept) });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub ${r.status} for ${url}: ${(await r.text()).slice(0, 200)}`);
  return accept?.includes("raw") ? r.text() : r.json();
};

// READMEs come from raw.githubusercontent.com first (no API rate limit), then the API for unusual file names
const readmeOf = async (user, repo) => {
  for (const file of ["README.md", "readme.md", "Readme.md", "README.MD", "README"]) {
    const r = await fetch(`https://raw.githubusercontent.com/${user}/${repo.name}/${repo.default_branch}/${encodeURIComponent(file)}`, { headers: { "user-agent": "sanat-portfolio-sync" } });
    if (r.ok) return r.text();
    if (r.status !== 404) throw new Error(`raw README ${r.status}`);
  }
  return gh(`${GH}/repos/${user}/${repo.name}/readme`, "application/vnd.github.raw");
};

/* ---------- README → summary + live-link candidates ---------- */
const HOSTS = /\b(vercel\.app|netlify\.app|onrender\.com|github\.io|pages\.dev|herokuapp\.com|railway\.app|fly\.dev|surge\.sh|streamlit\.app|hf\.space|huggingface\.co\/spaces|web\.app|firebaseapp\.com|glitch\.me|replit\.app|azurewebsites\.net|amplifyapp\.com)\b/i;
const NOT_LIVE = /(github\.com|githubusercontent\.com|shields\.io|badge|img\.|\.(png|jpe?g|gif|svg|webp|mp4|pdf)(\?|$)|localhost|127\.0\.0\.1|0\.0\.0\.0|linkedin\.com|youtube\.com|youtu\.be|twitter\.com|x\.com\/|npmjs\.com|pypi\.org|docs\.|readthedocs|example\.com|wikipedia\.org|google\.com|kaggle\.com|devpost\.com|figma\.com)/i;
const LIVE_WORDS = /\b(live|demo|deploy(ed|ment)?|website|visit|try it|hosted|production|app link|preview)\b/i;

const urlsIn = (text) => [...(text || "").matchAll(/https?:\/\/[^\s<>()\[\]"'`|]+/g)].map((m) => m[0].replace(/[.,;:!?*_]+$/, ""));

const readmeSummary = (md) => {
  if (!md) return "";
  const text = md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[\s*\]\([^)]*\)/g, "") // badge links left empty once their image is gone
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  for (const block of text.split(/\n\s*\n/)) {
    const line = block.replace(/\s+/g, " ").trim();
    if (!line || /^#/.test(line) || /^([-*|>]|\d+[.)]\s)/.test(line) || line.length < 40) continue;
    const clean = line.replace(/[*_`#]/g, "").trim();
    return clean.length > 220 ? clean.slice(0, 217).replace(/\s+\S*$/, "") + "…" : clean;
  }
  return "";
};

const liveCandidates = (repo, readme) => {
  const seen = new Map();
  const add = (url, score, source) => {
    if (!url || NOT_LIVE.test(url)) return;
    const key = url.replace(/\/+$/, "").toLowerCase();
    const prev = seen.get(key);
    if (!prev || prev.score < score) seen.set(key, { url: url.replace(/\/+$/, ""), score, source });
  };
  if (repo.homepage) add(repo.homepage.startsWith("http") ? repo.homepage : `https://${repo.homepage}`, 10, "homepage");
  for (const u of urlsIn(repo.description)) add(u, 8 + (HOSTS.test(u) ? 1 : 0), "description");
  for (const line of (readme || "").split("\n")) {
    for (const u of urlsIn(line)) add(u, (HOSTS.test(u) ? 4 : 0) + (LIVE_WORDS.test(line) ? 3 : 0), "readme");
  }
  // a README link counts only if it looks like a deployment (known host or "live/demo" wording)
  return [...seen.values()].filter((c) => c.source !== "readme" || c.score >= 3).sort((a, b) => b.score - a.score).slice(0, 4);
};

const probe = async (url) => {
  try {
    const r = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0 (sanat-portfolio-sync link check)" }, signal: AbortSignal.timeout(25000) });
    return { ok: r.status < 400, status: r.status, finalUrl: r.url };
  } catch (e) {
    return { ok: false, status: e.name === "TimeoutError" ? "timeout" : "unreachable" };
  }
};

/* ---------- Résumé (rule-based: section headings + "Label: a, b" lines) ---------- */
const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\\.?";
const DATE = new RegExp(`(${MONTH}\\s+\\d{4}(?:\\s*-\\s*(?:Present|Now|${MONTH}\\s+\\d{4}))?|\\b\\d{4}\\b)\\s*$`, "i");
const HEADINGS = { education: /^education$/i, experience: /^(work\s+)?experience$/i, projects: /^projects$/i, skills: /^(technical\s+)?skills/i, leadership: /^leadership/i, achievements: /^(achievements|awards|honou?rs)/i, interests: /^interests|^hobbies/i, certifications: /^certifications?$/i };

const resumeText = async () => {
  const fromFile = arg("--resume-text");
  if (fromFile) return readFile(fromFile, "utf8");
  const pdf = path.join(ROOT, config.resume);
  const { stdout } = await run("pdftotext", ["-layout", "-enc", "UTF-8", pdf, "-"], { maxBuffer: 8 << 20 });
  return stdout;
};

const parseResume = (raw) => {
  const lines = raw
    .replace(/[–—]/g, "-").replace(/[•●▪]/g, "*").replace(/ /g, " ")
    .split(/\r?\n/).map((l) => l.replace(/\s+$/, ""));
  const sections = {};
  let cur = "header";
  for (const line of lines) {
    const t = line.trim();
    const hit = Object.entries(HEADINGS).find(([, re]) => re.test(t) && t.length < 40);
    if (hit) { cur = hit[0]; sections[cur] = sections[cur] || []; continue; }
    (sections[cur] = sections[cur] || []).push(line);
  }
  const cols = (l) => l.trim().split(/\s{3,}/);

  // entries: "Org ... Month YYYY - Present", then "Role ... Place", then "* bullets"
  const entries = (ls = []) => {
    const out = [];
    let e = null, bullet = null;
    for (const line of ls) {
      const t = line.trim();
      if (!t) continue;
      if (t.startsWith("*")) { bullet = t.replace(/^\*\s*/, ""); e?.points.push(bullet); continue; }
      const c = cols(line);
      const last = c[c.length - 1];
      if (c.length > 1 && DATE.test(last) && !/\|/.test(t)) {
        e = { title: c.slice(0, -1).join(" "), when: last.trim(), subtitle: "", place: "", points: [] };
        out.push(e); bullet = null; continue;
      }
      if (e && !e.subtitle && !bullet) { e.subtitle = c[0]; e.place = c.length > 1 ? c[c.length - 1] : ""; continue; }
      if (e && e.points.length) e.points[e.points.length - 1] += " " + t; // wrapped bullet line
    }
    return out;
  };

  // projects: "Name - tagline | Stack, Stack  2026"
  const projects = [];
  for (const line of sections.projects || []) {
    const t = line.trim();
    if (t.startsWith("*") || !t.includes("|")) {
      const p = projects[projects.length - 1];
      if (p && t) p.text = (p.text ? p.text + " " : "") + t.replace(/^\*\s*/, "");
      continue;
    }
    const [head, rest] = t.split("|");
    const year = (rest.match(/(\d{4})\s*$/) || [])[1] || "";
    const [name, tagline = ""] = head.split(/\s+-\s+/);
    projects.push({ name: name.trim(), tagline: tagline.trim(), stack: rest.replace(/\d{4}\s*$/, "").split(",").map((s) => s.trim()).filter(Boolean), year, text: "" });
  }

  // skills (left column "Label: a, b") and certifications (right column "Name - Mon. YYYY")
  const skills = {}, certifications = [];
  let label = null;
  for (const line of [...(sections.skills || []), ...(sections.certifications || [])]) {
    if (!line.trim()) continue;
    const parts = cols(line);
    for (const part of parts) {
      const cert = part.match(new RegExp(`^(.+?)\\s+-\\s+(${MONTH}\\s*\\d{4})$`, "i"));
      if (cert) { certifications.push({ name: cert[1].trim(), when: cert[2].replace(/\.(?=\s)/, "").trim() }); continue; }
      const m = part.match(/^([A-Za-z &/]+):\s*(.*)$/);
      if (m) { label = m[1].trim(); skills[label] = m[2]; }
      else if (label) skills[label] += (/-$/.test(skills[label]) && /^[a-z]/.test(part) ? "" : " ") + part.trim();
    }
  }
  for (const k of Object.keys(skills)) skills[k] = skills[k].split(",").map((s) => s.replace(/-\s+/, "-").trim()).filter(Boolean);

  const interests = (sections.interests || []).join(" ").split(",").map((s) => s.trim()).filter(Boolean);
  return {
    experience: entries(sections.experience).map((e) => ({ org: e.title, role: e.subtitle, when: e.when, place: e.place, points: e.points })),
    leadership: entries(sections.leadership).map((e) => ({ org: e.title, role: e.subtitle, when: e.when, place: e.place, points: e.points })),
    achievements: entries(sections.achievements).map((e) => ({ name: e.title, result: e.subtitle, when: e.when, place: e.place, points: e.points })),
    projects,
    skills,
    allSkills: [...new Set(Object.values(skills).flat())],
    certifications,
    interests,
  };
};

/* ---------- Matching résumé projects to repos ---------- */
const words = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 2 && !["the", "and", "for", "app", "api", "platform"].includes(w));
const overlap = (a, b) => { const A = new Set(words(a)), B = words(b); if (!A.size || !B.length) return 0; return B.filter((w) => A.has(w)).length / Math.min(A.size, B.length); };

/* ---------- Main ---------- */
const main = async () => {
  // --render-only: rebuild the home slider and role wording from the saved data without calling GitHub
  if (args.includes("--render-only")) { if (!previous) throw new Error(`no ${config.output} yet`); await renderSlider(previous.repos); return renderFacts(previous.resume); }
  const user = config.github;
  log(`reading public repos of ${user}`);
  let repos;
  try {
    repos = (await gh(`${GH}/users/${user}/repos?per_page=100&type=owner&sort=pushed`)) || [];
  } catch (e) {
    // the repo list is the only API call; if it's refused, re-check the repos we already know (READMEs come from raw)
    if (!previous?.repos?.every((p) => p.defaultBranch)) throw e;
    log(`repo list unavailable (${e.message.slice(0, 60)}), re-checking the ${previous.repos.length} known repos`);
    repos = previous.repos.map((p) => ({
      name: p.name, html_url: p.url, description: p.description, homepage: p.homepage, default_branch: p.defaultBranch,
      language: p.language, topics: p.topics, stargazers_count: p.stars, pushed_at: p.pushedAt, created_at: p.createdAt,
    }));
  }
  const prevLive = new Map((previous?.repos || []).map((r) => [r.name, r.live]));
  const graceMs = (config.liveGraceDays ?? 14) * 864e5;
  const now = new Date();

  let resume = null;
  try { resume = parseResume(await resumeText()); log(`résumé: ${resume.allSkills.length} skills, ${resume.projects.length} projects, ${resume.experience.length} roles, ${resume.certifications.length} certificates`); }
  catch (e) { log(`résumé skipped: ${e.message}`); resume = previous?.resume || null; }

  const out = [];
  for (const r of repos) {
    if (r.fork || r.archived || r.private || config.exclude.includes(r.name)) continue;
    // a failed README fetch (rate limit, outage) must not wipe what an earlier run learned
    let readmeFailed = false;
    const readme = await readmeOf(user, r).catch((e) => { readmeFailed = true; log(`${r.name}: README not read (${e.message.slice(0, 60)})`); return null; });
    const before = (previous?.repos || []).find((p) => p.name === r.name);
    if (readmeFailed && !before) throw new Error(`README for ${r.name} unavailable and no earlier data to fall back on`);
    const summary = r.description || (readmeFailed ? before.readmeSummary : readmeSummary(readme)) || "";
    const cands = liveCandidates(r, readme);
    let live = null;
    if (!OFFLINE) {
      for (const c of cands) {
        const res = await probe(c.url);
        log(`${r.name}: ${c.source} ${c.url} -> ${res.status}`);
        if (res.ok) {
          // only move lastOkAt forward weekly, so a healthy link doesn't create a commit every day
          const was = prevLive.get(r.name), fresh = was?.ok && was.url === c.url && now - new Date(was.lastOkAt) < 7 * 864e5;
          live = { url: c.url, source: c.source, ok: true, status: res.status, lastOkAt: fresh ? was.lastOkAt : now.toISOString().slice(0, 10) };
          break;
        }
        if (!live) live = { url: c.url, source: c.source, ok: false, status: res.status };
      }
      // a flaky host (cold start, timeout) keeps its last good link for a grace period instead of disappearing
      const was = prevLive.get(r.name);
      if (live && !live.ok && was?.ok && was.url === live.url && now - new Date(was.lastOkAt) < graceMs) live = { ...was, degraded: true, status: live.status };
    } else if (prevLive.get(r.name)) live = prevLive.get(r.name);
    const match = resume?.projects.map((p) => ({ p, s: Math.max(overlap(r.name.replace(/[-_]/g, " "), p.name), overlap(summary, p.name + " " + p.tagline)) })).sort((a, b) => b.s - a.s)[0];
    const fromResume = match && match.s >= 0.6 ? match.p : null;
    out.push({
      name: r.name,
      // a name set in config.titles wins, then the résumé's name, then the repo name tidied up
      title: config.titles?.[r.name] || fromResume?.name || r.name.replace(/[-_]+/g, " ").replace(/\b([a-z])/g, (m) => m.toUpperCase()),
      tagline: fromResume?.tagline || "",
      // the résumé wording wins over a README's setup notes when the project is on the résumé
      summary: fromResume?.text ? (fromResume.text.length > 220 ? fromResume.text.slice(0, 217).replace(/\s+\S*$/, "") + "…" : fromResume.text) : summary,
      url: r.html_url,
      description: r.description || "",
      homepage: r.homepage || "",
      defaultBranch: r.default_branch,
      language: r.language,
      topics: r.topics || [],
      readmeSummary: readmeFailed ? before.readmeSummary || "" : readmeSummary(readme),
      tech: fromResume?.stack?.length ? fromResume.stack : readmeFailed ? before.tech : techIn([r.language, ...(r.topics || []), r.description, readme].join("\n")).slice(0, 8),
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
      createdAt: r.created_at,
      featured: (config.featured || []).includes(r.name),
      resumeProject: fromResume?.name || null,
      live,
    });
  }

  const data = { user, repos: out, resume };
  // only touch the file when something real changed, so the daily run doesn't commit noise
  const same = previous && JSON.stringify({ ...previous, generatedAt: undefined }) === JSON.stringify(data);
  if (same) log(`${out.length} repos checked, nothing changed — ${config.output} left as is`);
  else {
    await mkdir(path.dirname(OUT), { recursive: true });
    await writeFile(OUT, JSON.stringify({ generatedAt: now.toISOString(), ...data }, null, 2) + "\n");
    log(`${out.length} repos written to ${config.output}`);
  }
  log(`live: ${out.filter((r) => r.live?.ok).map((r) => r.name).join(", ") || "none"}`);
  await renderSlider(out);
  await renderFacts(resume);
};

/* ---------- Home page project slider ----------
   A queue of the live builds only (repos whose live link answered), most recently worked-on first,
   capped at slider.size, so the oldest drop off as new builds go live. Written straight into index.html between
   the project-slider markers, so the page is complete even without JavaScript.        */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso) => { const d = new Date(iso); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

/* ---------- Role facts: wording that depends on whether a job is current ----------
   A résumé job dated "… – Present" is current; one with an end date is finished. Every element
   marked data-fact="…" in the site's pages is rewritten to match, including the link-preview
   meta tags (link previews only see the saved page, so this can't wait for JavaScript).          */
const MONTH_IX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
const ongoing = (when) => /(present|now)\s*$/i.test(when || "");
const shortOrg = (org) => org.replace(/,?\s+(pvt\.?|private|ltd\.?|limited|inc\.?|llc|llp|co\.)(\s+(ltd\.?|limited))?\.?$/i, "").trim();
const orgKey = (org) => (org || "").toLowerCase().split(/[^a-z0-9]+/).find((w) => w.length > 3) || "";
// "August 2026 - October 2026" → "Aug — Oct 2026"; "August 2026 - Present" → "Aug 2026 — Now"
const span = (when) => {
  const parts = [...(when || "").matchAll(/([A-Za-z]{3})[a-z]*\.?\s+(\d{4})/g)].map((m) => ({ m: MONTHS[MONTH_IX[m[1].toLowerCase()]], y: m[2] }));
  if (!parts.length) return when;
  const [a, b] = parts;
  if (ongoing(when) || !b) return `${a.m} ${a.y} — Now`;
  return a.y === b.y ? `${a.m} — ${b.m} ${b.y}` : `${a.m} ${a.y} — ${b.m} ${b.y}`;
};
// "an AI…", "an ML…", "a Data…": initialisms go by how the letter sounds
const an = (word) => (/^[A-Z]{2}/.test(word) ? (/^[AEFHILMNORSX]/.test(word) ? "an" : "a") : /^[aeiou]/i.test(word) ? "an" : "a");

const roleFacts = (resume) => {
  const jobs = resume?.experience || [];
  if (!jobs.length) return null;
  const now = jobs.find((j) => ongoing(j.when));
  const job = now || jobs[0]; // the résumé lists newest first
  const org = shortOrg(job.org), role = job.role;
  const lead = now ? `${role} @ ${org}` : "AI Engineer";
  const tail = "Data pipelines, ML models and the interfaces that make them usable.";
  return {
    current: !!now,
    text: {
      "role-clause": now ? `currently ${an(role)} ${role} at ${org}` : `most recently ${an(role)} ${role} at ${org} (${span(job.when)})`,
      "role-clause-and": now ? `and ${an(role)} ${role} at ${org}` : `and was most recently ${an(role)} ${role} at ${org}`,
    },
    attr: {
      "og-desc": `${lead} · B.Tech Computer Engineering (Data Science). ${tail}`,
      "twitter-desc": `${lead} · ${tail}`,
    },
    when: (orgName) => { const j = jobs.find((x) => orgKey(x.org) === orgKey(orgName)); return j ? span(j.when) : null; },
  };
};

const renderFacts = async (resume) => {
  const facts = roleFacts(resume);
  if (!facts) { log("role facts: no experience on the résumé — pages left as they are"); return; }
  const { readdir } = await import("node:fs/promises");
  const pages = (await readdir(ROOT)).filter((f) => f.endsWith(".html"));
  const changed = [];
  for (const page of pages) {
    const file = path.join(ROOT, page);
    const html = await readFile(file, "utf8");
    let next = html
      // <meta … data-fact="og-desc" content="…">
      .replace(/(<meta\b[^>]*\bdata-fact="([\w-]+)"[^>]*\bcontent=")([^"]*)(")/g, (m, a, key, v, z) => (facts.attr[key] ? a + esc(facts.attr[key]) + z : m))
      // <span data-fact="when" data-org="ReasonateAI">Aug 2026 — Now</span>
      .replace(/(<(\w+)\b[^>]*\bdata-fact="when"[^>]*\bdata-org="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, org, v, close) => { const w = facts.when(org); return w ? open + esc(w) + close : m; })
      // <span data-fact="role-clause">…</span>
      .replace(/(<(\w+)\b[^>]*\bdata-fact="([\w-]+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, key, v, close) => (facts.text[key] ? open + esc(facts.text[key]) + close : m));
    if (next !== html) { await writeFile(file, next); changed.push(page); }
  }
  log(`role facts (${facts.current ? "current role" : "no current role"}): ${changed.length ? "updated " + changed.join(", ") : "pages already match"}`);
};

const renderSlider = async (repos) => {
  const cfg = config.slider || {};
  const size = cfg.size || 6;
  const queue = repos.filter((r) => r.live?.ok).sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)).slice(0, size);
  const cards = queue.map((repo, i) => {
    const r = { ...repo, title: config.titles?.[repo.name] || repo.title };
    const img = cfg.images?.[r.name];
    const text = r.tagline || r.summary || r.description || "Fresh on GitHub — the write-up is on its way.";
    const short = text.length > 150 ? text.slice(0, 147).replace(/\s+\S*$/, "") + "…" : text;
    const media = img
      ? `<img src="${esc(img)}" alt="${esc(r.title)} homepage" loading="lazy" />`
      : `<span class="pslide__cover" aria-hidden="true"><b>${esc(r.title.split(/\s+/)[0])}</b></span>`;
    const live = r.live?.ok ? `<a class="is-live" href="${esc(r.live.url)}" target="_blank" rel="noopener" data-cursor="Live">LIVE ${ARROW}</a>` : "";
    return `        <li class="pslide${r.live?.ok ? " has-live" : ""}">
          <div class="pslide__media">${media}<span class="pslide__n">${String(i + 1).padStart(2, "0")}</span></div>
          <div class="pslide__body">
            <p class="pslide__meta"><span>${esc(r.language || "Code")}</span><span>Updated ${monthYear(r.pushedAt)}</span></p>
            <h3 class="pslide__title">${esc(r.title)}</h3>
            <p class="pslide__text">${esc(short)}</p>
            ${r.tech?.length ? `<p class="pslide__tech">${r.tech.slice(0, 4).map((t) => `<span>${esc(t)}</span>`).join("")}</p>` : ""}
            <p class="pslide__links">${live}<a href="${esc(r.url)}" target="_blank" rel="noopener" data-cursor="Repo">REPO ${ARROW}</a></p>
          </div>
        </li>`;
  });
  cards.push(`        <li class="pslide pslide--more">
          <a href="work.html" data-cursor="Open"><span class="pslide__more-k">Project library</span><b>Everything else I've built →</b><span class="pslide__more-n">${repos.length} public repos · live builds · project files</span></a>
        </li>`);
  const block = `<!-- project-slider:start (written by scripts/sync-portfolio.mjs — edit the script, not this block) -->
      <ol class="pslider__track" data-slider-track aria-label="Live builds, most recently updated first">
${cards.join("\n")}
      </ol>
      <!-- project-slider:end -->`;
  const file = path.join(ROOT, "index.html");
  const html = await readFile(file, "utf8");
  const next = html.replace(/<!-- project-slider:start[\s\S]*?<!-- project-slider:end -->/, block);
  if (next === html) { log("project slider unchanged"); return; }
  if (!/<!-- project-slider:start/.test(html)) { log("project slider markers not found in index.html — skipped"); return; }
  await writeFile(file, next);
  log(`project slider: ${queue.map((r) => r.name).join(", ")}`);
};

main().catch((e) => { console.error("[sync] failed:", e); process.exit(1); });
