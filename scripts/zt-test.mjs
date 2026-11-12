// Zangetsu provider harness — mirrors lib/core/provider/js_bootstrap.dart.
// Runs a provider in a QuickJS-like sandbox (Node vm), then exercises the API.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function makeFetch() {
  return async function zfetch(url, opts = {}) {
    const headers = Object.assign({ "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" }, opts.headers || {});
    let res;
    try {
      res = await fetch(url, {
        method: (opts.method || "GET").toUpperCase(),
        headers,
        body: opts.body ?? undefined,
        redirect: opts.followRedirects === false ? "manual" : "follow",
        signal: AbortSignal.timeout(opts.timeoutMs || 25000),
      });
    } catch (e) {
      return { ok: false, status: 0, statusText: String(e.cause?.code || e.message), headers: {}, url, body: "", text: async () => "", json: async () => null };
    }
    const body = await res.text();
    const hdrs = {};
    res.headers.forEach((v, k) => { hdrs[k] = v; });
    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      statusText: res.statusText || "",
      headers: hdrs,
      url: res.url || url,
      body,
      text: async () => body,
      json: async () => JSON.parse(body),
    };
  };
}

function makeHelpers() {
  const b64ToBytes = (b64) => Array.from(Buffer.from(String(b64).replace(/[^A-Za-z0-9+/]/g, ""), "base64"));
  const htmlText = (html) => {
    if (!html) return "";
    return String(html)
      .replace(/<[^>]*>/g, "")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'").replace(/\s+/g, " ").trim();
  };
  const absUrl = (href, base) => {
    if (!href) return "";
    if (/^https?:\/\//i.test(href)) return href;
    if (href.startsWith("//")) return "https:" + href;
    if (!base) return href;
    if (href.startsWith("/")) {
      const m = base.match(/^(https?:\/\/[^/]+)/i);
      return m ? m[1] + href : href;
    }
    return base.replace(/\/$/, "") + "/" + href;
  };
  const unpackJs = (source) => {
    const s = String(source);
    const open = s.indexOf("}('");
    const close = s.indexOf(".split('|'),0,{})");
    if (open === -1 || close <= open) return s;
    const body = s.slice(open + 3, close);
    let end = 0;
    while (end < body.length && body.charAt(end) !== "'") end += body.charAt(end) === "\\" ? 2 : 1;
    if (body.charAt(end + 1) !== ",") return s;
    const payload = body.slice(0, end).replace(/\\'/g, "'");
    const tail = body.slice(end + 2);
    let radix = parseInt(tail, 10);
    if (!(radix >= 2 && radix <= 62)) radix = 62;
    const ds = tail.indexOf("'"), de = tail.lastIndexOf("'");
    if (ds === -1 || de <= ds) return s;
    const dict = tail.slice(ds + 1, de).split("|");
    const unbase = (t) => {
      let a = 0;
      for (let i = 0; i < t.length; i++) {
        const c = t.charCodeAt(i);
        const d = c <= 57 ? c - 48 : c >= 97 ? c - 87 : c - 29;
        if (d >= radix) return -1;
        a = a * radix + d;
      }
      return a;
    };
    return payload.replace(/[0-9A-Za-z]+/g, (k) => {
      const i = unbase(k);
      return i >= 0 && i < dict.length && dict[i] !== "" ? dict[i] : k;
    });
  };
  const noop = () => {};
  return {
    base64ToBytes: b64ToBytes,
    bytesToHex: (b) => Array.from(b).map((x) => (x & 255).toString(16).padStart(2, "0")).join(""),
    bytesToB64: (b) => Buffer.from(Array.from(b)).toString("base64"),
    htmlText,
    absUrl,
    unpackJs,
    console: { log: (...a) => console.log("   [log]", ...a), warn: noop, error: (...a) => console.log("   [err]", ...a), info: noop, debug: noop },
    setTimeout, clearTimeout,
    encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
    sha256Hex: async () => "",
  };
}

const NAME = path.basename(process.env.ZT_FILE || "provider.js", ".js");

function loadProvider(file, sourceId) {
  const src = fs.readFileSync(file, "utf8");
  const sandbox = { ...makeHelpers(), fetch: makeFetch(), __SOURCE_ID: sourceId, Promise, JSON, Math, Date, RegExp, String, Number, Boolean, Array, Object, Error, parseInt, parseFloat, isNaN, isFinite };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  const wrapped = `
    (function(){
      var __SOURCE_ID = ${JSON.stringify(sourceId)};
      var fetch = function(url, opts) { return globalThis.zfetch(url, opts); };
      var extractVideo = function() { return Promise.reject('no extractor'); };
      var console = globalThis.__con;
      ${src}
      globalThis.__providers = globalThis.__providers || {};
      globalThis.__providers[__SOURCE_ID] = {
        getInfo: typeof getInfo === 'function' ? getInfo : null,
        getHome: typeof getHome === 'function' ? getHome : null,
        popular: typeof popular === 'function' ? popular : null,
        search: typeof search === 'function' ? search : null,
        getDetail: typeof getDetail === 'function' ? getDetail : null,
        getEpisodes: typeof getEpisodes === 'function' ? getEpisodes : null,
        getVideoSources: typeof getVideoSources === 'function' ? getVideoSources : null
      };
    })();`;
  sandbox.zfetch = sandbox.fetch;
  sandbox.__con = sandbox.console;
  vm.runInContext(wrapped, sandbox, { filename: file, timeout: 60000 });
  return { api: sandbox.__providers[sourceId], sandbox };
}

const file = process.argv[2];
if (!file) {
  console.log("uso: node scripts/zt-test.mjs zangetsu/providers/<archivo>.js");
  process.exit(1);
}
const sourceId = path.basename(file, ".js");
const { api } = loadProvider(file, sourceId);

let failures = 0;
async function call(label, fn, fmt) {
  try {
    const v = await fn();
    console.log(`  ${label}: ${fmt(v)}`);
    return v;
  } catch (e) {
    console.log(`  ${label}: FAIL ${e && e.message ? e.message : e}`);
    failures++;
    return null;
  }
}

console.log(`\n=== ${file}`);
const info = await call("info", () => api.getInfo(), (v) => `${v.name} ${v.type} ${v.baseUrl} v${v.version}`);

const home = await call("home", () => api.getHome({ category: "sub" }), (rows) =>
  (rows || []).map((r) => `${r.title}(${(r.items || []).length})`).join(" | ") || "sin filas");

const pop = await call("popular", () => api.popular({ category: "sub", page: 1, dateRange: 7 }), (l) =>
  `${l.length} items | ${l[0] ? l[0].title + " -> " + l[0].url : "-"}`);

const srch = await call("search", () => api.search("naruto", 1, { category: "" }), (l) =>
  `${l.length} items | ${l[0] ? l[0].title + " -> " + l[0].url : "-"}`);

let detail = null;
const target = process.argv[3] || pop?.[0]?.url || home?.[0]?.items?.[0]?.url || srch?.[0]?.url;
if (target) {
  detail = await call("detail", () => api.getDetail(target, { category: "sub" }), (d) =>
    `${d.title} | ${(d.episodes || []).length} eps | cover=${d.cover ? "si" : "no"} | genres=${(d.genres || []).join("/")}`);
}

if (detail?.episodes?.length) {
  for (const ep of detail.episodes.slice(0, 2)) {
    await call(`sources ${ep.title}`, () => api.getVideoSources(ep.url), (list) => {
      if (!Array.isArray(list) || !list.length) return "0 streams";
      return `${list.length} | ` + list.slice(0, 3).map((s) => `${s.kind || "?"}/${s.quality || "-"}=${s.url.slice(0, 64)}`).join(" | ");
    });
  }
}

console.log(`\nfailures: ${failures}`);
process.exit(failures ? 1 : 0);
