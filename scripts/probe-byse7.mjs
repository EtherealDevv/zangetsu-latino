// byse: el chunk del player (videoPagesBundle) y sus operaciones.
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
let t = "";
try { t = fs.readFileSync(".sfref/byse-videoPagesBundle-Bgi0QmPo.js", "utf8"); } catch {}
if (!t) {
  t = await (await fetch(B + "/assets/videoPagesBundle-Bgi0QmPo.js", { headers: { "user-agent": UA } })).text();
  fs.writeFileSync(".sfref/byse-videoPagesBundle-Bgi0QmPo.js", t);
}
console.log("chunk", t.length + "b");
const ops = [...new Set([...t.matchAll(/(?:operation|execute)\(\s*\{?\s*(?:operation\s*:\s*)?["'`]([^"'`]+)["'`]/g)].map((m) => m[1]))];
console.log("\noperations:", ops.join("  ") || "-");
const ops2 = [...new Set([...t.matchAll(/operation\s*:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]))];
console.log("operation:", ops2.join("  ") || "-");
const q = [...new Set([...t.matchAll(/["'`]([a-z][a-z0-9/_-]{3,40})["'`]/g)].map((m) => m[1]))]
  .filter((s) => /video|embed|stream|resolve|player|source|media|hls|file|watch/i.test(s));
console.log("\ncadenas:", q.slice(0, 40).join("  "));
for (const k of ["filecode", "file_code", "embed", "hls", "m3u8", "/api"]) {
  const i = t.indexOf(k);
  if (i > 0) console.log(`\n[${k} @${i}]`, t.slice(Math.max(0, i - 260), i + 340).replace(/\s+/g, " "));
}
