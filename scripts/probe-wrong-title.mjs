// linea base: buscar titulos en espanol (los "wrong title") y ver que devuelve cada fuente.
import fs from "node:fs";
import vm from "node:vm";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const file = process.argv[2] || "zangetsu/providers/doramasflix.js";
const id = file.split("/").pop().replace(".js", "");
const QUERIES = process.argv.slice(3).length ? process.argv.slice(3) : ["El juego del calamar", "Cásate con mi esposo", "La gloria", "Mi nombre"];

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
    globalThis.__api = { search, getHome, popular };
  })();`, sandbox, { filename: file, timeout: 60000 });
const api = sandbox.__api;

for (const q of QUERIES) {
  const t0 = Date.now();
  const list = await api.search(q, 1, { category: "sub" });
  const ms = Date.now() - t0;
  console.log(`\n"${q}" -> ${list.length} items (${ms}ms)`);
  for (const it of list.slice(0, 5)) console.log(`   ${it.title}${it.englishTitle ? " [alias: " + it.englishTitle + "]" : ""}`);
}

// el puente de traduccion, por si el sitio indexa el titulo original
const tr = await fetch("https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=" + encodeURIComponent("El juego del calamar"), { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000) }).catch((e) => null);
if (tr && tr.ok) {
  const t = await tr.text();
  console.log("\ntranslate:", t.slice(0, 160));
} else {
  console.log("\ntranslate:", tr ? "HTTP " + tr.status : "sin respuesta");
}
