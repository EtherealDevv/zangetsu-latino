// voe: barrido del orden de operaciones (basura -> base64 -> atob -> shift -> rev -> atob).
import fs from "node:fs";
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const raw = JSON.parse((page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1])[0];

const atob = (s) => Buffer.from(String(s), "base64").toString("binary");
const shift = (s, d) => [...s].map((c) => String.fromCharCode((c.charCodeAt(0) - d) & 0xff)).join("");
const rev = (s) => s.split("").reverse().join("");
const clean = (s) => s.replace(/[^A-Za-z0-9+/=]/g, "");

const isB64ish = (s) => /^[A-Za-z0-9+/=]+$/.test(s.trim());
let found = 0;

for (const pre of ["clean", "clean+rev", "rev+clean"]) {
  let s0 = clean(raw);
  if (pre === "clean+rev") s0 = rev(s0);
  if (pre === "rev+clean") s0 = clean(rev(raw));
  let b1;
  try { b1 = atob(s0); } catch { continue; }
  for (const d of [0, -3, 3, -2, 2, -1, 1]) {
    for (const mid of ["none", "rev"]) {
      let s1 = shift(b1, d);
      if (mid === "rev") s1 = rev(s1);
      for (const tail of ["atob", "atob+shift", "atob+rev"]) {
        let out;
        try { out = atob(s1); } catch { continue; }
        if (tail === "atob+shift") out = shift(out, d);
        if (tail === "atob+rev") out = rev(out);
        const t = out.trim();
        if (t.startsWith("{") || t.startsWith("[")) {
          try {
            const j = JSON.parse(t);
            console.log(`\nHIT pre=${pre} shift=${d} mid=${mid} tail=${tail} -> ${t.length}b`);
            console.log("  claves:", Object.keys(j).join(" "));
            console.log("  ", JSON.stringify(j).slice(0, 260));
            found++;
          } catch {}
        }
      }
    }
  }
}
if (!found) {
  console.log("sin HIT; intermedios del primer intento:");
  const b1 = atob(clean(raw));
  console.log("  atob(clean) len", b1.length, "b64ish:", isB64ish(b1));
  console.log("  muestra:", b1.slice(0, 60).replace(/[^\x20-\x7e]/g, "."));
  const r1 = rev(b1);
  console.log("  rev muestra:", r1.slice(0, 60).replace(/[^\x20-\x7e]/g, "."));
  const s1 = shift(b1, 3);
  console.log("  -3 muestra:", s1.slice(0, 60).replace(/[^\x20-\x7e]/g, "."), "| b64ish:", isB64ish(s1));
  console.log("  rev(-3) muestra:", rev(s1).slice(0, 60).replace(/[^\x20-\x7e]/g, "."), "| b64ish:", isB64ish(rev(s1)));
}
