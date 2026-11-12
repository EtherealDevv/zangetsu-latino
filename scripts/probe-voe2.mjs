// voe (susanexpectcare): qué hay dentro del payload y si el m3u8 se puede sacar sin DOM.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const p = await get("https://susanexpectcare.com/e/71bxcr4ajvhq", { referer: "https://cdn.tudorama.com/" });
const b = p.b;
console.log("page", p.s, b.length + "b", p.u);

// scripts con tamaño
const scripts = [...b.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/gi)].map((m, i) => ({ attrs: m[1], len: m[2].length, body: m[2] }));
console.log("scripts:", scripts.map((s) => s.len).join(" "));

const big = scripts.filter((s) => s.len > 5000).sort((a, b2) => b2.len - a.len)[0];
if (big) {
  const s = big.body;
  console.log("\nbig", s.length + "b");
  console.log("head:", s.slice(0, 320).replace(/\s+/g, " "));
  console.log("tail:", s.slice(-320).replace(/\s+/g, " "));
  for (const k of ["atob", "eval(", "Function(", "m3u8", "hls", "document", "window", "navigator", "jsjiami", "soLoader", "voe"]) {
    console.log(`  ${k}: ${(s.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length}`);
  }
}

// ¿blobs base64 largos en cualquier parte de la página?
const b64 = [...new Set([...b.matchAll(/["']([A-Za-z0-9+/=]{200,})["']/g)].map((m) => m[1]))];
console.log("\nblobs b64:", b64.length, b64.map((x) => x.length).join(" "));
for (const x of b64.slice(0, 2)) {
  const buf = Buffer.from(x, "base64");
  console.log("  decoded head:", buf.toString("utf8").slice(0, 200).replace(/\s+/g, " "));
}

// meta / json con la fuente
for (const k of ["application/json", "__NEXT", "window.__", "sources", "file_url", "playlist"]) {
  const i = b.indexOf(k);
  if (i > 0) console.log(`\n[${k}] @${i}:`, b.slice(Math.max(0, i - 160), i + 220).replace(/\s+/g, " "));
}
