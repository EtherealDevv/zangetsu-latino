// voe: el loader necesita las globales de los inline; se siembran y se corre.
import vm from "node:vm";
import fs from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = "https://susanexpectcare.com";
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const loader = fs.readFileSync(".sfref/voe-loader.js", "utf8");
const payload = (page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || "";

const captured = [];
const jw = function () {
  return { setup() { return this; }, on() { return this; }, off() { return this; }, playlist() { return this; },
    play() { return this; }, pause() { return this; }, load() { return this; }, getPlaylist() { return []; },
    remove() { return this; }, addButton() { return this; }, registerPlugin() { return this; },
    setCurrentQuality() { return this; }, getQualityLevels() { return []; }, getCurrentQuality() { return -1; },
    getPosition() { return 0; }, getDuration() { return 0; }, getState() { return "idle"; } };
};
jw.setup = (cfg) => { captured.push(cfg); return jw(); };
jw.key = "k"; jw.version = "8.49.5";

const jsonNode = { tagName: "SCRIPT", type: "application/json", textContent: payload, innerHTML: payload, getAttribute: () => "application/json" };
const el = (tag) => ({
  tagName: String(tag).toUpperCase(), style: {}, dataset: {}, children: [],
  classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
  setAttribute() {}, getAttribute: () => null, appendChild(c) { return c; }, removeChild(c) { return c; },
  addEventListener() {}, removeEventListener() {}, querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ width: 1280, height: 720, top: 0, left: 0, right: 1280, bottom: 720 }),
  play: () => Promise.resolve(), load() {}, pause() {}, remove() {}, focus() {}, click() {},
});
const doc = {
  querySelectorAll: (sel) => (/application\/json/.test(sel) ? [jsonNode] : []),
  querySelector: () => null, getElementById: () => el("div"), getElementsByTagName: () => [],
  createElement: (t) => el(t), createTextNode: (t) => ({ textContent: String(t) }),
  addEventListener() {}, removeEventListener() {},
  body: el("body"), head: el("head"), documentElement: el("html"),
  cookie: "", readyState: "complete", currentScript: null,
};

const win = {
  // globales que en la pagina real definen los inline scripts
  base: H, base_domain: H.slice(8), staticBase: H, cdn_root: H + "/jwplayer/8.49.5",
  translations: {}, max_errors: 15, source: "",
  document: doc, jwplayer: jw,
  location: { href: `${H}/e/71bxcr4ajvhq`, origin: H, host: H.slice(8), hostname: H.slice(8), protocol: "https:", pathname: "/e/71bxcr4ajvhq", search: "", hash: "", reload() {}, replace() {}, assign() {} },
  navigator: { userAgent: UA, language: "es-MX", languages: ["es-MX", "es"], platform: "Win32", hardwareConcurrency: 8, maxTouchPoints: 0 },
  screen: { width: 1920, height: 1080, colorDepth: 24 },
  innerWidth: 1280, innerHeight: 720, outerWidth: 1280, outerHeight: 720, devicePixelRatio: 1,
  localStorage: { getItem: () => null, setItem() {}, removeItem() {}, clear() {} },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  addEventListener() {}, removeEventListener() {}, dispatchEvent: () => true,
  setTimeout: (fn) => { if (typeof fn === "function") { try { fn(); } catch (e) {} } return 0; },
  setInterval: () => 0, clearTimeout() {}, clearInterval() {}, requestAnimationFrame: (f) => { try { f(1); } catch (e) {} return 0; },
  atob: (s) => Buffer.from(String(s), "base64").toString("binary"),
  btoa: (s) => Buffer.from(String(s), "binary").toString("base64"),
  fetch: async () => ({ ok: true, status: 200, text: async () => "", json: async () => ({}) }),
  console: { log() {}, warn() {}, error() {}, info() {}, debug() {}, clear() {}, trace() {}, table() {} },
  Image: function () { return el("img"); },
  XMLHttpRequest: function () { return { open() {}, send() {}, setRequestHeader() {}, addEventListener() {}, abort() {} }; },
  MutationObserver: function () { return { observe() {}, disconnect() {} }; },
  performance: { now: () => 1 }, Intl, URL, URLSearchParams,
  crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } },
};
win.window = win; win.self = win; win.top = win; win.parent = win; win.globalThis = win; win.frames = win;
doc.defaultView = win;
const ctx = vm.createContext(win);

try {
  vm.runInContext(loader, ctx, { filename: "voe-loader.js", timeout: 20000 });
  console.log("loader OK");
} catch (e) {
  console.log("loader EXC:", String(e.message).slice(0, 200));
}

console.log("captured:", captured.length);
for (const cfg of captured) {
  const items = cfg.playlist || [{ sources: cfg.sources || [] }];
  for (const it of items) for (const s of (it.sources || [])) console.log("  src:", s.file || s.src || JSON.stringify(s).slice(0, 100));
}
// cualquier m3u8 que haya quedado en el contexto
const dump = JSON.stringify(Object.keys(win).length);
for (const k of Object.keys(win)) {
  const v = win[k];
  if (typeof v === "string" && /m3u8/.test(v)) console.log("  global", k, v.slice(0, 160));
}
console.log("vars:", dump);
