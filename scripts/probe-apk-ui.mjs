// cadenas de UI del panel de busqueda por fuente y del manejo de repos, en espanol.
import fs from "node:fs";
const txt = fs.readFileSync(process.argv[2] || "C:\\Users\\juanj\\AppData\\Local\\Temp\\opencode\\libapp.so", "latin1");
const clean = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
const pats = ["Which one is it?", "Try another", "Choose a source", "This source may not carry",
  "Repositorio", "repositorios", "A\u00f1adir repo", "Buscar fuentes", "Actualizar", "fuentes"];
for (const p of pats) {
  let i = -1, n = 0;
  while ((i = txt.indexOf(p, i + 1)) >= 0 && n < 2) {
    console.log(`\n===== ${p} @${i}\n${clean(txt.slice(Math.max(0, i - 260), i + 260))}`);
    n++;
  }
  if (!n) console.log(`\n===== ${p}: no aparece`);
}
