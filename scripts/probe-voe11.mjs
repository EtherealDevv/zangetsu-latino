// voe: el loader que consume el payload JSON.
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = "https://susanexpectcare.com";

const grab = async (path, name) => {
  const f = ".sfref/voe-" + name;
  if (fs.existsSync(f)) return { path, body: fs.readFileSync(f, "utf8"), cached: true };
  const r = await fetch(H + path, { headers: { "user-agent": UA, referer: H + "/e/71bxcr4ajvhq" }, signal: AbortSignal.timeout(20000) });
  const t = await r.text();
  fs.writeFileSync(f, t);
  return { path, body: t, cached: false, status: r.status };
};

for (const [p, n] of [
  ["/js/loader.a40897e.js", "loader.js"],
  ["/build/assets/base.DLdCRf7_.js", "base.js"],
  ["/s/js/site.min.js?fe1eebe79ae88e4bfa6ed669174fca9c", "site.js"],
]) {
  const r = await grab(p, n);
  console.log(`\n#### ${p} -> ${r.status ?? ""} ${r.body.length}b ${r.cached ? "(cache)" : ""}`);
  console.log("head:", r.body.replace(/\s+/g, " ").slice(0, 300));
  for (const k of ["application/json", "JSON.parse", "atob", "m3u8", "jwplayer", "setup(", "playback", "source"]) {
    const i = r.body.indexOf(k);
    if (i >= 0) console.log(`  [${k} @${i}]`, r.body.slice(Math.max(0, i - 160), i + 220).replace(/\s+/g, " "));
  }
}

// el bloque grande: entender como se autocontiene (el nombre raro es una global)
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const tags = [...page.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)];
const big = tags.filter((m) => m[2].length > 50000).sort((a, b) => b[2].length - a[2].length)[0][2];
console.log("\n=== big machine: como termina");
console.log(big.slice(-1200));
const ids = [...new Set([...big.matchAll(/window\.([a-f0-9]{16,})\s*=\s*'([a-z0-9]{8})'/g)].map((m) => `${m[1]} -> ${m[2]}`))];
console.log("\nglobals declaradas:", ids.join("  ") || "-");
