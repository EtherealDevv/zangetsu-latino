// PelisPlus: catálogo, tarjetas, episodio y el mp4 del /play/.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const PP = "https://pelisplus2.vip";

for (const path of ["/peliculas/", "/series/", "/peliculas/estrenos/"]) {
  const r = await get(PP + path);
  console.log(`\n#### ${path} ${r.s} ${r.b.length}b -> ${r.u.slice(0, 60)}`);
  const cards = [...r.b.matchAll(/<a[^>]*href="([^"]*\/(?:pelicula|serie)s?\/[^"\/]+\/?)"[^>]*>/gi)].map((m) => m[1]);
  console.log("  cards:", cards.length, "| ejemplo:", cards.slice(0, 3).join("  "));
  const i = r.b.indexOf(cards[1] || cards[0] || "zzz");
  if (i > 0) console.log("  ctx:", r.b.slice(Math.max(0, i - 400), i + 400).replace(/\s+/g, " ").slice(0, 700));
}

console.log("\n#### episodio /play/");
const ep = await get(PP + "/serie/456-1-1/los-simpson/play/");
console.log("  status", ep.s, ep.b.length + "b");
const src = (ep.b.match(/player\.src\(\{\s*src:\s*'([^']+)'/) || [])[1] || "";
console.log("  mp4:", src.slice(0, 120) || "-");
const ifr = [...new Set([...ep.b.matchAll(/<iframe[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 3);
console.log("  iframes:", ifr.join("  ") || "-");

console.log("\n#### película /play/");
const mv = await get(PP + "/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/play/");
console.log("  status", mv.s, mv.b.length + "b");
console.log("  mp4:", (mv.b.match(/player\.src\(\{\s*src:\s*'([^']+)'/) || [])[1] || "-");

console.log("\n#### detalle película (datos)");
const d = await get(PP + "/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/");
console.log("  status", d.s, d.b.length + "b");
for (const k of ["og:title", "og:image", "og:description", "itemprop=\"description\""]) {
  const m = d.b.match(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '[^>]*content="([^"]*)"'));
  console.log(`  ${k}:`, m ? m[1].slice(0, 90) : "-");
}
console.log("  year:", (d.b.match(/(?:release|año|year)[^>]*>\s*(\d{4})/i) || [])[1] || "-");
