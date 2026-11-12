// voe: definiciones de las funciones del pipeline (_0x24839f, _0x2f72b8, lista de basura).
import fs from "node:fs";
const t = fs.readFileSync(".sfref/voe-loader.js", "utf8");

for (const name of ["_0x24839f", "_0x2f72b8", "_0x2df8d7"]) {
  console.log(`\n===== ${name}`);
  let i = -1, n = 0;
  while ((i = t.indexOf(name, i + 1)) >= 0 && n < 3) {
    console.log(`  @${i}:`, t.slice(Math.max(0, i - 260), i + 420).replace(/\s+/g, " "), "\n");
    n++;
  }
  if (!n) console.log("  (no aparece)");
}
