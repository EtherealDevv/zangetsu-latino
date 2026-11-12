// doramasflix: cobertura real por episodio — que hosts entran y cuales resuelven.
import fs from "node:fs";
import vm from "node:vm";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const file = process.argv[2] || "zangetsu/providers/doramasflix.js";
const LIMIT = Number(process.argv[3] || 6);

const zfetch = async (url, opts = {}) => {
  const headers = Object.assign({ "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" }, opts.headers || {});
  try {
    const res = await fetch(url, { method: (opts.method || "GET").toUpperCase(), headers, body: opts.body ?? undefined, redirect: "follow", signal: AbortSignal.timeout(25000) });
    const body = await res.text();
    return { ok: res.status < 300, status: res.status, headers: {}, url, body, text: async () => body, json: async () => JSON.parse(body) };
  } catch (e) {
    return { ok: false, status: 0, headers: {}, url, body: "", text: async () => "", json: async () => null };
  }
};

const src = fs.readFileSync(file, "utf8");
const sandbox = {
  fetch: zfetch, zfetch, __SOURCE_ID: "doramasflix",
  Promise, JSON, Math, Date, RegExp, String, Number, Boolean, Array, Object, Error, parseInt, parseFloat, isNaN, isFinite,
  base64ToBytes: (b64) => Array.from(Buffer.from(String(b64).replace(/[^A-Za-z0-9+/]/g, ""), "base64")),
  bytesToHex: () => "", bytesToB64: () => "",
  htmlText: (h) => String(h || "").replace(/<[^>]*>/g, ""),
  absUrl: (h) => h, unpackJs: (s) => s,
  console: { log() {}, warn() {}, error() {}, info() {}, debug() {} },
  setTimeout, clearTimeout, encodeURIComponent, decodeURIComponent, encodeURI, decodeURI,
  sha256Hex: async () => "",
};
sandbox.globalThis = sandbox;
sandbox.__con = sandbox.console;
vm.createContext(sandbox);
const wrapped = `
  (function(){
    var __SOURCE_ID = ${JSON.stringify("doramasflix")};
    var fetch = function(url, opts) { return globalThis.zfetch(url, opts); };
    var extractVideo = function() { return Promise.reject('no extractor'); };
    var console = globalThis.__con;
    ${src}
    globalThis.__api = { getInfo, getHome, popular, search, getDetail, getEpisodes, getVideoSources };
  })();`;
vm.runInContext(wrapped, sandbox, { filename: file, timeout: 60000 });
const api = sandbox.__api;

const pop = await api.popular({ category: "sub", page: 1, dateRange: 7 });
let total = 0, hist = {};
for (const it of pop.slice(0, LIMIT)) {
  const d = await api.getDetail(it.url);
  const ep = (d.episodes || [])[0];
  if (!ep) { console.log(`- ${it.title}: sin episodios`); continue; }
  try {
    const list = await api.getVideoSources(ep.url);
    total += list.length;
    const hosts = [...new Set(list.map((s) => { const m = s.url.match(/^https?:\/\/([^/]+)/); return m ? m[1].replace(/^www\./, "").split(".").slice(-2).join(".") : "?"; }))];
    for (const h of hosts) hist[h] = (hist[h] || 0) + 1;
    console.log(`- ${it.title}: ${list.length} streams | ${hosts.join(", ")}`);
  } catch (e) {
    console.log(`- ${it.title}: FAIL ${String(e.message).slice(0, 60)}`);
  }
}
console.log(`\ntotal ${total} streams | hosts:`, Object.entries(hist).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join("  "));
