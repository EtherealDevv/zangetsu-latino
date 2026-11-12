// contexto de las cadenas del catalogo por fuente en el binario de Zangetsu.
import fs from "node:fs";
const txt = fs.readFileSync(process.argv[2] || "C:\\Users\\juanj\\AppData\\Local\\Temp\\opencode\\libapp.so", "latin1");
const clean = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
const pats = ["Could not load this catalogue", "source-catalogue-empty", "catalogue-empty",
  "getHome", "sections", "getVideoList", "getPopular(", "supportedTypes", "getHome("];
for (const p of pats) {
  let i = -1, n = 0;
  while ((i = txt.indexOf(p, i + 1)) >= 0 && n < 3) {
    console.log(`\n===== ${p} @${i}\n${clean(txt.slice(Math.max(0, i - 220), i + 220))}`);
    n++;
  }
  if (!n) console.log(`\n===== ${p}: no aparece`);
}
