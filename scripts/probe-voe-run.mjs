// voe: ejecutar su propio script en un DOM falso y cazar el m3u8.
import vm from "node:vm";
import fs from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const HOST = "https://susanexpectcare.com";
const CODE = process.argv[2] || "71bxcr4ajvhq";

const page = await (await fetch(`${HOST}/e/${CODE}`, { headers: { "user-agent": UA, referer: "https://cdn.tudorama.com/" } })).text();
fs.writeFileSync(".sfref/voe-page.html", page);
const scripts = [...page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)]
  .map((m) => ({ attrs: m[1], body: m[2] }))
  .filter((s) => !/\bsrc=/.test(s.attrs));
console.log("page", page.length + "b | inline scripts:", scripts.map((s) => s.body.length).join(" "));

const jsonPayload = scripts.find((s) => /application\/json/.test(s.attrs));
console.log("json payload:", jsonPayload ? jsonPayload.body.length + "b" : "-");

const found = new Set();
const grab = (s) => {
  const re = /https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/gi;
  let m;
  while ((m = re.exec(String(s))) !== null) found.add(m[0]);
};

// ── DOM falso mínimo ────────────────────────────────────────────────────────
function makeEl(tag) {
  const el = {
    tagName: String(tag).toUpperCase(), nodeName: String(tag).toUpperCase(), nodeType: 1,
    style: {}, dataset: {}, children: [], childNodes: [], attributes: {}, classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    src: "", href: "", textContent: "", innerHTML: "", outerHTML: "",
    setAttribute(n, v) { this.attributes[n] = v; if (n === "src") this.src = v; },
    getAttribute(n) { return this.attributes[n] ?? null; },
    removeAttribute(n) { delete this.attributes[n]; },
    appendChild(c) { this.children.push(c); this.childNodes.push(c); onNode(c); return c; },
    removeChild(c) { return c; }, insertBefore(c) { return c; }, replaceChild(c) { return c; },
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    getElementsByTagName: () => [], querySelector: () => null, querySelectorAll: () => [],
    closest: () => null, remove() {}, click() {}, focus() {}, play() { return Promise.resolve(); },
    getBoundingClientRect: () => ({ width: 1280, height: 720, top: 0, left: 0, right: 1280, bottom: 720 }),
    canPlayType: () => "probably", load() {},
  };
  return el;
}
let createdScripts = 0;
const onNode = (n) => {
  if (!n || n.tagName !== "SCRIPT") return;
  createdScripts++;
  const u = n.src || "";
  if (u) console.log("   [script src]", String(u).slice(0, 120));
  if (n.textContent) { grab(n.textContent); }
};

const documentEl = makeEl("html");
const bodyEl = makeEl("body");
const headEl = makeEl("head");
documentEl.appendChild(headEl);
documentEl.appendChild(bodyEl);
documentEl.body = bodyEl; documentEl.head = headEl;
documentEl.documentElement = documentEl;
documentEl.currentScript = null;
documentEl.createElement = (t) => { const e = makeEl(t); if (t === "script") { setTimeout(() => onNode(e), 0); } return e; };
documentEl.createTextNode = (t) => ({ nodeValue: String(t), textContent: String(t) });
documentEl.getElementById = (id) => {
  const el = makeEl("div");
  el.id = id;
  return el;
};
documentEl.getElementsByTagName = () => [];
documentEl.querySelector = () => null;
documentEl.querySelectorAll = () => [];
documentEl.cookie = "";
documentEl.write = (s) => { grab(s); };
documentEl.writeln = documentEl.write;
documentEl.addEventListener = () => {};

const storage = new Map();
const win = {
  document: documentEl,
  location: { href: `${HOST}/e/${CODE}`, origin: HOST, protocol: "https:", host: HOST.split("//")[1], pathname: `/e/${CODE}`, search: "", hash: "", reload() {}, replace() {}, assign() {} },
  navigator: { userAgent: UA, language: "es-MX", languages: ["es-MX", "es"], platform: "Win32", vendor: "", hardwareConcurrency: 8, maxTouchPoints: 0 },
  screen: { width: 1920, height: 1080, colorDepth: 24 },
  innerWidth: 1280, innerHeight: 720, outerWidth: 1280, outerHeight: 720,
  localStorage: {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => storage.set(k, String(v)),
    removeItem: (k) => storage.delete(k),
    clear: () => storage.clear(),
  },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
  setTimeout: (fn, ms) => { if (typeof fn === "function") { try { fn(); } catch (e) {} } return 0; },
  setInterval: () => 0, clearTimeout() {}, clearInterval() {},
  atob: (s) => Buffer.from(String(s), "base64").toString("binary"),
  btoa: (s) => Buffer.from(String(s), "binary").toString("base64"),
  fetch: async (u, o) => {
    grab(u);
    console.log("   [fetch]", String(u).slice(0, 110));
    const r = await fetch(u, { headers: { "user-agent": UA }, redirect: "follow" }).catch(() => null);
    const t = r ? await r.text() : "";
    grab(t);
    return { ok: !!r && r.status < 400, status: r ? r.status : 0, text: async () => t, json: async () => JSON.parse(t), headers: { get: () => null } };
  },
  console: { log: (...a) => { a.forEach(grab); }, warn() {}, error() {}, info() {}, debug() {} },
  Image: function () { return makeEl("img"); },
  XMLHttpRequest: function () { return { open() {}, send() {}, setRequestHeader() {}, addEventListener() {} }; },
  MutationObserver: function () { return { observe() {}, disconnect() {} }; },
  performance: { now: () => 1 },
  crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } },
  JSON, Math, Date, RegExp, String, Number, Boolean, Array, Object, Error, Promise, Map, Set, Uint8Array, ArrayBuffer, TextDecoder, TextEncoder, parseInt, parseFloat, isNaN, isFinite, decodeURIComponent, encodeURIComponent, escape, unescape,
};
win.window = win;
win.self = win;
win.top = win;
win.parent = win;
win.globalThis = win;
win.document.defaultView = win;

const ctx = vm.createContext(win);
for (const s of scripts) {
  if (!s.body.trim()) continue;
  if (/application\/json/.test(s.attrs)) continue;
  if (s.body.length > 50000) continue; // el state machine va aparte, al final
  try { vm.runInContext(s.body, ctx, { filename: "inline.js", timeout: 8000 }); } catch (e) { console.log("   [inline ERR]", String(e.message).slice(0, 90)); }
}

// el state machine: sólo el bloque grande
const big = scripts.filter((s) => s.body.length > 50000).sort((a, b) => b.body.length - a.body.length)[0];
if (big) {
  console.log("\n### ejecutando el state machine", big.body.length + "b");
  try {
    vm.runInContext(big.body, ctx, { filename: "voe-state.js", timeout: 20000 });
  } catch (e) { console.log("   [big ERR]", String(e.message).slice(0, 140)); }
}

console.log("\n### scripts creados:", createdScripts);
console.log("### encontrados:", [...found].slice(0, 8).join("\n") || "-");
// rastrear variables globales con pinta de payload
for (const k of Object.keys(win)) if (/^[a-z0-9]{6,}$/i.test(k) && typeof win[k] === "string" && win[k].length > 40) console.log("  global", k, String(win[k]).slice(0, 60));
