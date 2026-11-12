// voe: el payload es base64 con basura intercalada; probar la cadena del loader.
import fs from "node:fs";
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const raw = JSON.parse((page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1])[0];

const atob = (s) => Buffer.from(s, "base64").toString("binary");
const shift = (s, d) => [...s].map((c) => String.fromCharCode(c.charCodeAt(0) - d)).join("");
const rev = (s) => s.split("").reverse().join("");

const attempts = [
  ["limpiar no-base64 -> atob -> -3 -> rev -> atob", (x) => atob(rev(shift(atob(x.replace(/[^A-Za-z0-9+/=]/g, "")), 3)))],
  ["limpiar -> atob -> rev -> -3 -> atob", (x) => atob(shift(rev(atob(x.replace(/[^A-Za-z0-9+/=]/g, ""))), 3))],
  ["limpiar -> atob -> rev -> atob", (x) => atob(rev(atob(x.replace(/[^A-Za-z0-9+/=]/g, ""))))],
  ["limpiar -> atob -> -3 -> atob", (x) => atob(shift(atob(x.replace(/[^A-Za-z0-9+/=]/g, "")), 3))],
];

console.log("payload", raw.length + "b | limpio", raw.replace(/[^A-Za-z0-9+/=]/g, "").length + "b");
for (const [label, fn] of attempts) {
  try {
    const out = fn(raw);
    const ok = /^\s*[{[]/.test(out);
    console.log(`\n[${label}] ${ok ? "JSON?" : "?"} ${out.length}b -> ${out.slice(0, 220).replace(/\s+/g, " ")}`);
    if (ok) {
      try {
        const j = JSON.parse(out);
        console.log("  claves:", Object.keys(j).join(" "));
        for (const k of ["file", "source", "src", "hls", "url"]) if (j[k]) console.log(`  ${k}: ${String(j[k]).slice(0, 140)}`);
      } catch (e) { console.log("  parse:", e.message.slice(0, 60)); }
    }
  } catch (e) {
    console.log(`[${label}] ERR ${e.message.slice(0, 60)}`);
  }
}
