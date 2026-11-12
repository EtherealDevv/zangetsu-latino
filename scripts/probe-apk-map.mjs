// claves que lee _mediaItemFromMap y donde vive "cover" en el snapshot.
import fs from "node:fs";
const txt = fs.readFileSync(process.argv[2] || "C:\\Users\\juanj\\AppData\\Local\\Temp\\opencode\\libapp.so", "latin1");
const clean = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
const i = txt.indexOf("_mediaItemFromMap");
console.log("_mediaItemFromMap @", i, "\n", clean(txt.slice(i - 900, i + 900)));

let n = 0, k = -1;
while ((k = txt.indexOf("cover", k + 1)) >= 0 && n < 12) {
  const ctx = txt.slice(k - 60, k + 60);
  if (/[\x20-\x7e]/.test(ctx)) { console.log(`\n--- cover @${k}\n${clean(ctx)}`); n++; }
}
