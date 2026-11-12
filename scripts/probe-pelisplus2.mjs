// PelisPlus: ¿dónde vive el catálogo? sitemap, robots y rutas alternativas.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const PP = "https://pelisplus2.vip";

const rb = await get(PP + "/robots.txt");
console.log("robots", rb.s, rb.b.length + "b\n" + rb.b.split("\n").filter((l) => /sitemap|Disallow: \//i.test(l)).slice(0, 12).join("\n"));

for (const p of ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-movies.xml", "/sitemap-posts-movie.xml", "/wp-sitemap.xml"]) {
  const r = await get(PP + p);
  const locs = [...r.b.matchAll(/<loc>([^<]+)<\/loc>/gi)].map((m) => m[1]);
  console.log(`\n${p} ${r.s} ${r.b.length}b locs=${locs.length}`);
  locs.slice(0, 5).forEach((l) => console.log("   ", l.slice(0, 100)));
}

// ¿hay rutas de listado con tarjetas?
for (const p of ["/peliculas", "/series", "/ver-peliculas/", "/peliculas-populares/", "/genero/accion/", "/?s=simpson"]) {
  const r = await get(PP + p);
  const hrefs = [...new Set([...r.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))].filter((h) => /\/(?:pelicula|serie)\/[a-z0-9-]{4,}/i.test(h));
  console.log(`\n${p} ${r.s} ${r.b.length}b -> ${hrefs.length} fichas`);
  hrefs.slice(0, 3).forEach((h) => console.log("    ", h.slice(0, 90)));
}
