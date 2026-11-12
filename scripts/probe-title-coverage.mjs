// cobertura: cuantas consultas quedan marcadas con el titulo pedido, por fuente.
import fs from "node:fs";
import vm from "node:vm";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const file = process.argv[2];
const id = file.split("/").pop().replace(".js", "");
const QUERIES = process.argv.slice(3);

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
  fetch: zfetch, zfetch, __SOURCE_ID: id,
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
    var __SOURCE_ID = ${JSON.stringify(id)};
    var fetch = function(url, opts) { return globalThis.zfetch(url, opts); };
    var extractVideo = function() { return Promise.reject('no extractor'); };
    var console = globalThis.__con;
    ${src}
    globalThis.__api = { search };
  })();`, sandbox, { filename: file, timeout: 60000 });
const api = sandbox.__api;

let ok = 0;
for (const q of QUERIES) {
  const t0 = Date.now();
  let list = [];
  try { list = await api.search(q, 1, { category: "sub" }); } catch (e) { console.log(`ERR  "${q}" ${String(e.message).slice(0, 50)}`); continue; }
  const ms = Date.now() - t0;
  const first = list[0];
  const marked = first && (String(first.englishTitle || "").toLowerCase() === q.toLowerCase());
  if (marked) ok++;
  console.log(`${marked ? "OK " : "MISS"}  ${String(ms).padStart(5)}ms  ${list.length.toString().padStart(3)} items  "${q}" -> ${first ? first.title + (first.englishTitle ? " [" + first.englishTitle + "]" : "") : "(vacio)"}`);
}
console.log(`\n${ok}/${QUERIES.length} marcadas`);
