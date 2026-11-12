// byse: los chunks que carga la SPA y el del player.
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const b = fs.readFileSync(".sfref/byse-bundle.js", "utf8");

// nombres de chunk en el manifest de vite
const chunks = [...new Set([...b.matchAll(/assets\/([A-Za-z0-9_.-]+\.js)/g)].map((m) => m[1]))];
console.log("chunks:", chunks.length);
const names = chunks.filter((c) => /embed|player|video|watch|stream|e-/i.test(c));
console.log("interesantes:", names.join("  ") || "-");

// los import() con su nombre de módulo
const dyn = [...b.matchAll(/import\("\.\/([^"]+)"\)/g)].map((m) => m[1]);
console.log("dyn:", [...new Set(dyn)].slice(0, 20).join("  ") || "-");
const mapdep = b.match(/__vite__mapDeps=\(i,m=__vite__mapDeps,d=\(m\.f\|\|\(m\.f=(\[[^\]]+\])/);
if (mapdep) console.log("\nmapDeps:", mapdep[1].slice(0, 800));

for (const c of names.slice(0, 4)) {
  const u = `${B}/assets/${c}`;
  const r = await fetch(u, { headers: { "user-agent": UA } });
  const t = await r.text();
  fs.writeFileSync(".sfref/byse-" + c, t);
  console.log(`\n#### ${c} ${r.status} ${t.length}b`);
  const api = [...new Set([...t.matchAll(/["'`]([a-z][a-z0-9/_-]{2,40})["'`]/g)].map((m) => m[1]))]
    .filter((s) => /video|embed|stream|resolve|player|source|media|hls/i.test(s));
  console.log("  cadenas:", api.slice(0, 25).join("  ") || "-");
  const keys = [...new Set([...t.matchAll(/operation\s*:\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]))];
  console.log("  operations:", keys.join("  ") || "-");
  const dir = t.match(/https?:[^"'\s\\<>]+\.(?:m3u8|mp4)[^"'\s\\<>]*/g) || [];
  console.log("  directos:", dir.slice(0, 2).join("  ") || "-");
}
