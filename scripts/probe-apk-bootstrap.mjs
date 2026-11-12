// vuelca el bootstrap completo (d4rt) que la app inyecta antes del provider.
import fs from "node:fs";
const buf = fs.readFileSync(process.argv[2] || "C:\\Users\\juanj\\AppData\\Local\\Temp\\opencode\\libapp.so");
const txt = buf.toString("latin1");
const at = txt.indexOf("var fetch = function(url, opts) { return globalThis.__fetch(");
if (at < 0) { console.log("no encontrado"); process.exit(0); }
const from = Math.max(0, at - 3000), len = 14000;
const chunk = txt.slice(from, at + len);
// cortar en el ultimo '}' razonable y limpiar
console.log(chunk.replace(/[^\x20-\x7e\n\t]/g, "·"));
