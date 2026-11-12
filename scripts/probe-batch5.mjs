// PelisPlus: catálogo, series y el mp4 del /play/. Doramasflix: su API.
// Tudorama: qué acción AJAX monta el player.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", err: String(e.cause?.code || e.message) }; }
};
const links = (b, re) => [...new Set([...b.matchAll(re)].map((m) => m[1]))];

const PP = "https://pelisplus2.vip";
console.log("### PELISPLUS");
const home = await get(PP + "/");
console.log("home", home.s, home.b.length + "b");
const cards = links(home.b, /href="([^"]*\/(?:pelicula|peliculas|serie|series)\/[^"]+?)"/gi).filter((h) => !/\/(?:pelicula|serie)s?\/?$/.test(h));
console.log("  cards:", cards.length, "|", cards.slice(0, 3).join("  "));
const cardCtx = home.b.indexOf(cards[2] || cards[0] || "");
console.log("  card ctx:", home.b.slice(Math.max(0, cardCtx - 500), cardCtx + 200).replace(/\s+/g, " ").slice(0, 600));
const srch = await get(PP + "/?s=naruto");
console.log("  search ?s= ->", srch.s, srch.b.length + "b,", links(srch.b, /href="([^"]*\/(?:pelicula|serie)\/[^"]+)"/gi).length, "links");
const serie = await get(PP + "/series/los-simpson/");
console.log("  serie los-simpson:", serie.s, serie.b.length + "b");
const seps = links(serie.b, /href="([^"]*\/(?:serie|episodio|temporada|capitulo)\/[^"]+)"/gi);
console.log("  eps/season links:", seps.length, "|", seps.slice(0, 4).join("  "));
const seasonCtx = serie.b.indexOf("temporada");
console.log("  season ctx:", seasonCtx > 0 ? serie.b.slice(Math.max(0, seasonCtx - 300), seasonCtx + 400).replace(/\s+/g, " ") : "-");

console.log("\n### DORAMASFLIX");
const D = "https://doramasflix.in";
const dh = await get(D + "/");
console.log("home", dh.s, dh.b.length + "b");
console.log("  next data:", /__NEXT_DATA__/.test(dh.b), "| nuxt:", /__NUXT__/.test(dh.b));
const dapi = [...new Set([...dh.b.matchAll(/["'](https?:\/\/[a-z0-9.-]*(?:api|seriesapi|fluxcedene)[^"']{0,60})["']/gi)].map((m) => m[1]))].slice(0, 6);
console.log("  api hosts:", dapi.join("  ") || "-");
const dhref = links(dh.b, /href="(\/[^"]*\/(?:dorama|serie|ver|pelicula)\/[^"]+)"/gi);
console.log("  rutas:", [...new Set(dhref)].slice(0, 5).join("  ") || "-");
const chunks = links(dh.b, /<script[^>]*src="([^"]*_next\/static[^"]*)"/gi);
console.log("  chunks:", chunks.length, chunks.slice(0, 2).join("  "));

console.log("\n### TUDORAMA js");
const tjs = await get("https://tudorama.com/wp-content/themes/Wstream-4/inc/public/js/wstream.scripts.js?ver=2.1.7");
console.log("wstream.scripts.js", tjs.s, tjs.b.length + "b");
for (const m of tjs.b.matchAll(/action\s*:\s*["']([a-z0-9_]+)["']/gi)) console.log("   action:", m[1]);
const idx = tjs.b.search(/ajaxurl/);
console.log("   ctx ajax:", idx > 0 ? tjs.b.slice(Math.max(0, idx - 500), idx + 500).replace(/\s+/g, " ") : "-");
