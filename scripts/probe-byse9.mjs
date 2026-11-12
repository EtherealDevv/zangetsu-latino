// byse: de dónde sale el token que firma /api/videos/stream/<code>.
import fs from "node:fs";
const t = fs.readFileSync(".sfref/byse-videoPagesBundle-Bgi0QmPo.js", "utf8");
const hits = [];
const re = /token|Authorization|Bearer|x-byse|signature|playback|access_key/g;
let m;
while ((m = re.exec(t)) !== null) hits.push(m.index);
console.log("hits:", hits.length);
const seen = new Set();
let printed = 0;
for (const at of hits) {
  const k = t.slice(Math.max(0, at - 90), at + 90);
  const key = k.replace(/\s+/g, " ").slice(0, 60);
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`\n@${at}`, t.slice(Math.max(0, at - 300), at + 320).replace(/\s+/g, " "));
  if (++printed >= 8) break;
}
