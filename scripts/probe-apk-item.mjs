// que claves de item lee Zangetsu del lado Dart.
import fs from "node:fs";
const txt = fs.readFileSync(process.argv[2] || "C:\\Users\\juanj\\AppData\\Local\\Temp\\opencode\\libapp.so", "latin1");
const clean = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
const pats = ["imageUrl", "image_url", "coverImage", "'cover'", "'poster'", "airDate", "releaseDate",
  "episodeNumber", "link", "description", "score"];
for (const p of pats) {
  let i = -1, n = 0;
  while ((i = txt.indexOf(p, i + 1)) >= 0 && n < 2) {
    console.log(`\n===== ${p} @${i}\n${clean(txt.slice(Math.max(0, i - 200), i + 200))}`);
    n++;
  }
  if (!n) console.log(`\n===== ${p}: no aparece`);
}
