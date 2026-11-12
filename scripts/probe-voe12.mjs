// voe: ejecutar su loader con jwplayer falso y cazar el m3u8 + la tabla de decodificacion.
import vm from "node:vm";
import fs from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = "https://susanexpectcare.com";

const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const payload = (page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || "";
const loader = fs.readFileSync(".sfref/voe-loader.js", "utf8");

const captured = [];
function jwplayerStub() {
  return {
    setup(cfg) { captured.push(cfg); return this; },
    on() { return this; }, off() { return this; }, playlist() { return this; },
    play() { return this; }, pause() { return this; }, load() { return this; },
    getPlaylist() { return []; }, remove() { return this; }, addButton() { return this; },
    registerPlugin() { return this; }, setCurrentQuality() { return this; },
  };
}
jwplayerStub.setup = (cfg) => { captured.push(cfg); return {}; };
jwplayerStub.key = "x";
jwplayerStub.version = "8.49.5";

const jsonNode = {
  tagName: "SCRIPT", type: "application/json", textContent: payload,
  innerHTML: payload, getAttribute: () => "application/json",
};

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
  querySelector: (sel) => (/player|video/.test(sel) ? el("div") : (/application\/json/.test(sel) ? jsonNode : null)),
  getElementById: () => el("div"),
  getElementsByTagName: () => [],
  createElement: (t) => el(t),
  createTextNode: (t) => ({ textContent: String(t) }),
  addEventListener() {}, removeEventListener() {},
  body: el("body"), head: el("head"), documentElement: el("html"),
  cookie: "", readyState: "complete", currentScript: null,
};

const win = {
  document: doc, jwplayer: jwplayerStub,
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
  console.log("loader ejecutado sin excepcion");
} catch (e) {
  console.log("loader EXC:", String(e.message).slice(0, 200));
}
win.jwplayer && win.jwplayer.setup;

console.log("captured setups:", captured.length);
for (const cfg of captured) {
  const pl = cfg.playlist || (cfg.sources ? [{ sources: cfg.sources }] : []);
  for (const item of pl) {
    const srcs = item.sources || [];
    for (const s of srcs) console.log("  source:", s.file || s.src || JSON.stringify(s).slice(0, 120));
  }
}
if (!captured.length) {
  // el otro camino: la config global que arma el loader
  for (const k of Object.keys(win).filter((k) => !/^(window|self|top|parent|globalThis|frames|document|jwplayer|location|navigator|screen|localStorage|sessionStorage|console|Image|XMLHttpRequest|MutationObserver|performance|crypto|JSON|Math|Object|Array|String|Number|Boolean|Date|RegExp|Error|Promise|Map|Set|Uint8Array|ArrayBuffer|TextDecoder|TextEncoder|parseInt|parseFloat|isNaN|isFinite|decodeURIComponent|encodeURIComponent|escape|unescape|atob|btoa|fetch|setTimeout|setInterval|clearTimeout|clearInterval|requestAnimationFrame|Intl|URL|URLSearchParams|innerWidth|innerHeight|outerWidth|outerHeight|devicePixelRatio|addEventListener|removeEventListener|dispatchEvent)$/.test(k))) {
    const v = win[k];
    const s = typeof v === "string" ? v : JSON.stringify(v);
    if (s && s.length > 20) console.log("  global", k, "=", s.slice(0, 140));
  }
}
