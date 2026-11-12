// voe: que hay en source / fallback / direct_access_url y si responden.
import fs from "node:fs";
const page = fs.readFileSync(".sfref/voe-page.html", "utf8");
const raw = JSON.parse((page.match(/<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/i) || [])[1])[0];
const rot13 = (s) => s.replace(/[a-zA-Z]/g, (c) => { const x = c.charCodeAt(0); return x >= 65 && x <= 90 ? String.fromCharCode(((x - 65 + 13) % 26) + 65) : String.fromCharCode(((x - 97 + 13) % 26) + 97); });
const atob = (s) => Buffer.from(s, "base64").toString("binary");
const JUNK = ["@$", "^^", "~@", "%?", "*~", "!!", "#&"];
let s = rot13(raw);
for (const j of JUNK) s = s.split(j).join("_");
s = s.split("_").join("");
const b1 = atob(s);
const out = atob([...b1].map((c) => String.fromCharCode(c.charCodeAt(0) - 3)).join("").split("").reverse().join(""));
const j = JSON.parse(out);

for (const k of ["source", "fallback", "direct_access_url", "request", "check", "direct_access_allowed", "multi_audio"]) {
  console.log(`${k}:`, JSON.stringify(j[k]));
}
const cands = [j.source, j.fallback, j.direct_access_url].filter((x) => typeof x === "string" && /^https?:/.test(x));
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
for (const u of cands) {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, referer: "https://susanexpectcare.com/" }, signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    console.log(`\n${r.status} ${r.headers.get("content-type")} ${t.length}b`);
    console.log("  ", u.slice(0, 150));
    console.log("   ->", t.slice(0, 160).replace(/\s+/g, " "));
  } catch (e) {
    console.log("\nERR", String(e.cause?.code || e.message).slice(0, 50), u.slice(0, 120));
  }
}
