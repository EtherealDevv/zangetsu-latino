// busca el contrato del puente JS<->Dart de Zangetsu (d4rt): __fetch, __console, y las cadenas
// que describen lo que devuelve. limpia a ascii imprimible y corta contexto.
import fs from "node:fs";
const p = process.argv[2] || "C:\\Users\\juanj\\AppData\\Local\\Temp\\opencode\\libapp.so";
const buf = fs.readFileSync(p);
const txt = buf.toString("latin1");

const pats = [
  "__fetch", "globalThis.__fetch", "statusCode", "response.body", "body:", "missing method",
  "getVideoSources", "getEpisodes", "getDetail", "search(", "Which one is it", "wrongTitle",
];

const clean = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");

for (const pat of pats) {
  let i = -1, hits = 0;
  while ((i = txt.indexOf(pat, i + 1)) >= 0 && hits < 3) {
    const from = Math.max(0, i - 400), to = Math.min(txt.length, i + 500);
    console.log(`\n===== ${pat} @${i}\n${clean(txt.slice(from, to))}`);
    hits++;
  }
  if (!hits) console.log(`\n===== ${pat}: no aparece`);
}
