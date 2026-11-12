// byse: de donde salen key_parts y como se arma la clave (ws/ks).
import fs from "node:fs";
const t = fs.readFileSync(".sfref/byse-videoPagesBundle-Bgi0QmPo.js", "utf8");

const ctx = (re, pad = 420, max = 4) => {
  let m, n = 0;
  console.log(`\n===== ${re}`);
  while ((m = re.exec(t)) !== null && n < max) {
    console.log("  ...", t.slice(Math.max(0, m.index - pad), m.index + pad).replace(/\s+/g, " "), "\n");
    n++;
  }
  if (!n) console.log("  (nada)");
};

ctx(/key_parts/g, 460, 5);
ctx(/\bws\s*=\s*/g, 300, 2);
ctx(/\bks\s*=\s*/g, 300, 2);

// rutas del api que pueden traer el objeto cifrado
const routes = [...new Set([...t.matchAll(/`[^`]*\/api\/[^`]*`/g)].map((m) => m[0]))];
console.log("\nrutas:", routes.join("\n        "));
