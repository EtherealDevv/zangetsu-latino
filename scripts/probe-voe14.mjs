// voe: DOM con Proxy (cualquier metodo que falte devuelve algo inofensivo) para
// dejar correr el loader entero y ver con que config llama a jwplayer.
import vm from "node:vm";
import fs from "node:fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = "https://susanexpectcare.com";
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const loader = fs.readFileSync(".sfref/voe-loader.js", "utf8");
const payload = (page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1] || "";

const captured = [];
const noop = () => undefined;
function makeEl(tag = "div") {
  const base = {
    tagName: String(tag).toUpperCase(), nodeName: String(tag).toUpperCase(), nodeType: 1,
    style: {}, dataset: {}, children: [], childNodes: [], classList: { add: noop, remove: noop, contains: () => false, toggle: noop },
    src: "", href: "", id: "", className: "", innerHTML: "", outerHTML: "", textContent: "",
    width: 1280, height: 720, offsetWidth: 1280, offsetHeight: 720,
    setAttribute: noop, getAttribute: () => null, removeAttribute: noop, hasAttribute: () => false,
    appendChild: (c) => c, insertBefore: (c) => c, replaceChild: (c) => c, removeChild: (c) => c,
    addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true,
    getBoundingClientRect: () => ({ width: 1280, height: 720, top: 0, left: 0, right: 1280, bottom: 720, x: 0, y: 0 }),
    getContext: () => null, play: () => Promise.resolve(), pause: noop, load: noop, remove: noop,
    focus: noop, click: noop, cloneNode() { return makeEl(tag); },
  };
  return new Proxy(base, {
    get(t, p) {
      if (p in t) return t[p];
      if (typeof p === "symbol") return undefined;
      return noop;
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

const jsonNode = {
  ...makeEl("script"), type: "application/json", textContent: payload, innerHTML: payload,
  getAttribute: () => "application/json",
};

const docBase = {
  querySelectorAll: (sel) => (/application\/json/.test(sel) ? [jsonNode] : []),
  querySelector: () => null,
  getElementById: () => makeEl("div"),
  getElementsByTagName: () => [], getElementsByClassName: () => [],
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({ textContent: String(t), nodeValue: String(t) }),
  addEventListener: noop, removeEventListener: noop,
  body: makeEl("body"), head: makeEl("head"), documentElement: makeEl("html"),
  cookie: "", readyState: "complete", currentScript: null, hidden: false, visibilityState: "visible",
  write: noop, writeln: noop, hasFocus: () => true,
};
const doc = new Proxy(docBase, {
  get(t, p) { if (p in t) return t[p]; if (typeof p === "symbol") return undefined; return noop; },
  set(t, p, v) { t[p] = v; return true; },
});

const jw = function () { return makeEl("div"); };
jw.setup = (cfg) => { captured.push(cfg); return jw(); };
jw.key = "k"; jw.version = "8.49.5";
jw.utils = { extend: (a, b) => Object.assign({}, a, b) };

const store = new Map();
const win = {
  base: H, base_domain: H.slice(8), staticBase: H, cdn_root: H + "/jwplayer/8.49.5",
  translations: {}, max_errors: 15, source: "",
  document: doc, jwplayer: jw,
  location: { href: `${H}/e/71bxcr4ajvhq`, origin: H, host: H.slice(8), hostname: H.slice(8), protocol: "https:", pathname: "/e/71bxcr4ajvhq", search: "", hash: "", reload: noop, replace: noop, assign: noop },
  navigator: { userAgent: UA, language: "es-MX", languages: ["es-MX", "es"], platform: "Win32", hardwareConcurrency: 8, maxTouchPoints: 0, vendor: "Google Inc.", cookieEnabled: true },
  screen: { width: 1920, height: 1080, colorDepth: 24, availWidth: 1920, availHeight: 1040 },
  innerWidth: 1280, innerHeight: 720, outerWidth: 1280, outerHeight: 720, devicePixelRatio: 1, scrollY: 0, scrollX: 0,
  localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), clear: () => store.clear(), key: () => null, get length() { return store.size; } },
  sessionStorage: { getItem: () => null, setItem: noop, removeItem: noop },
  addEventListener: noop, removeEventListener: noop, dispatchEvent: () => true,
  setTimeout: (fn) => { if (typeof fn === "function") { try { fn(); } catch (e) {} } return 0; },
  setInterval: () => 0, clearTimeout: noop, clearInterval: noop, requestAnimationFrame: (f) => { try { f(1); } catch (e) {} return 0; },
  atob: (s) => Buffer.from(String(s), "base64").toString("binary"),
  btoa: (s) => Buffer.from(String(s), "binary").toString("base64"),
  fetch: async () => ({ ok: true, status: 200, text: async () => "", json: async () => ({}) }),
  console: { log: noop, warn: noop, error: noop, info: noop, debug: noop, clear: noop, trace: noop, table: noop },
  Image: function () { return makeEl("img"); },
  XMLHttpRequest: function () { return { open: noop, send: noop, setRequestHeader: noop, addEventListener: noop, abort: noop, set withCredentials(v) {} }; },
  MutationObserver: function () { return { observe: noop, disconnect: noop }; },
  performance: { now: () => 1, mark: noop, measure: noop },
  Intl, URL, URLSearchParams,
  crypto: { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256); return a; } },
};
win.window = win; win.self = win; win.top = win; win.parent = win; win.globalThis = win; win.frames = win;
docBase.defaultView = win;

const ctx = vm.createContext(win);
try {
  vm.runInContext(loader, ctx, { filename: "voe-loader.js", timeout: 20000 });
  console.log("loader OK");
} catch (e) {
  console.log("loader EXC:", String(e.message).slice(0, 220));
}

console.log("captured:", captured.length);
for (const cfg of captured) {
  const items = cfg.playlist || [{ sources: cfg.sources || [] }];
  for (const it of items) for (const s of (it.sources || [])) console.log("  src:", s.file || s.src || JSON.stringify(s).slice(0, 120));
  if (cfg.image) console.log("  image:", String(cfg.image).slice(0, 90));
}
for (const k of Object.keys(win)) {
  if (typeof win[k] === "string" && /m3u8/.test(win[k])) console.log("  global", k, win[k].slice(0, 160));
}
