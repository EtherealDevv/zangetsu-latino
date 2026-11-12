// voe: el transform del payload (replace / fromCharCode / atob / JSON).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const p = await get("https://susanexpectcare.com/e/71bxcr4ajvhq", { referer: "https://cdn.tudorama.com/" });
const scripts = [...p.b.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].map((m) => m[2]);
const big = scripts.filter((s) => s.length > 50000).sort((a, b) => b.length - a.length)[0];

const hits = [];
const rx = /\.replace\(|fromCharCode|String\.raw|atob|JSON\.parse|unescape|decodeURIComponent/g;
let m;
while ((m = rx.exec(big)) !== null) hits.push({ at: m.index, k: m[0] });
console.log("hits:", hits.length);
const seen = new Set();
for (const h of hits) {
  const key = h.k;
  if (seen.has(key) && seen.size > 8) continue;
  seen.add(key);
  console.log(`\n@${h.at} ${key}\n  ${big.slice(Math.max(0, h.at - 220), h.at + 260).replace(/\s+/g, " ")}`);
}

// el trozo donde se procesa el JSON de la página
const j = big.indexOf("application/json");
console.log("\n[en el bundle] application/json @", j);
if (j > 0) console.log(big.slice(Math.max(0, j - 300), j + 900).replace(/\s+/g, " "));

// bloque final (el runner)
console.log("\n=== tail 2500 ===");
console.log(big.slice(-2500).replace(/\s+/g, " "));
