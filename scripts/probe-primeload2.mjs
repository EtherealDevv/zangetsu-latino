// Primeload /player/<id>: dónde está el stream real.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9", referer: "https://primeload.co/embed/R8dCbP0C8cFX" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url, ct: r.headers.get("content-type") || "" };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const u = "https://primeload.co/player/R8dCbP0C8cFX?ref=https%3A%2F%2Fdoramasflix.in%2F";
const r = await get(u);
console.log("==", r.s, r.b.length + "b", r.ct, r.u);
const direct = r.b.match(/https?:[^"'\s\\]+\.(?:m3u8|mp4)[^"'\s\\]*/gi) || [];
console.log("directos:", direct.length, direct.slice(0, 3).join("\n  "));
const scripts = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
console.log("inline scripts:", scripts.length);
scripts.forEach((s, i) => { const t = s.replace(/\s+/g, " ").trim(); if (t.length > 40) console.log(`--[${i}]--`, t.slice(0, 500)); });
const srcs = [...new Set([...r.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]))];
console.log("externos:", srcs.join("  "));
const ifr = [...new Set([...r.b.matchAll(/<iframe[^>]*src=["']([^"']+)["']/gi)].map((m) => m[1]))];
console.log("iframes:", ifr.join("  "));
console.log("\nhead 1200:", r.b.replace(/\s+/g, " ").slice(0, 1200));
