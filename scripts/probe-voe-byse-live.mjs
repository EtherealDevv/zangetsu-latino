// voe/byse: probar los resolvers nuevos tal como quedaron en el provider.
import fs from "node:fs";
import vm from "node:vm";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const file = process.argv[2] || "zangetsu/providers/doramasflix.js";
const embeds = process.argv.slice(3);
if (!embeds.length) embeds.push("https://susanexpectcare.com/e/71bxcr4ajvhq", "https://bysefujedu.com/e/f2rwhq07ydg3");

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
  fetch: zfetch, zfetch, __SOURCE_ID: "x",
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
vm.runInContext(`
  (function(){
    var __SOURCE_ID = "x";
    var fetch = function(url, opts) { return globalThis.zfetch(url, opts); };
    var extractVideo = function() { return Promise.reject('no extractor'); };
    var console = globalThis.__con;
    ${src}
    globalThis.__api = { voe: typeof _voe === 'function' ? _voe : null, byse: typeof _byse === 'function' ? _byse : null, decode: typeof _voeDecode === 'function' ? _voeDecode : null };
  })();`, sandbox, { filename: file, timeout: 60000 });
const api = sandbox.__api;

for (const u of embeds) {
  const fn = /byse/i.test(u) ? api.byse : api.voe;
  console.log(`\n### ${u}`);
  if (!fn) { console.log("  sin resolver"); continue; }
  const t0 = Date.now();
  const list = await fn(u, "dub");
  console.log(`  ${list.length} streams en ${Date.now() - t0}ms`);
  for (const s of list.slice(0, 4)) {
    console.log(`  ${s.container}/${s.quality} ${s.url.slice(0, 110)}`);
    try {
      const r = await fetch(s.url, { headers: s.headers, signal: AbortSignal.timeout(20000) });
      const body = await r.text();
      const ok = /#EXTM3U/.test(body);
      console.log(`     verify ${r.status} ${ok ? "HLS ok" : (r.headers.get("content-type") || "?") + " " + body.length + "b"}`);
    } catch (e) { console.log("     verify ERR", String(e.cause?.code || e.message).slice(0, 40)); }
  }
}
