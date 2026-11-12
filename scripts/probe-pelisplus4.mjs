// PelisPlus: rutas de series, opciones de temporada y paginación de listados.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const PP = "https://pelisplus2.vip";
const cards = (b) => (b.match(/TPostMv/g) || []).length;

for (const p of ["/series-populares/", "/nuevas-series/", "/nuevas-peliculas/", "/peliculas-populares/?page=2", "/peliculas-populares/", "/?s=simpson&page=2"]) {
  const r = await get(PP + p);
  console.log(`${p.padEnd(30)} ${r.s} ${String(r.b.length).padEnd(7)} cards=${cards(r.b)}`);
}

const s = await get(PP + "/serie/456/los-simpson/");
console.log("\nserie detalle", s.s, s.b.length + "b cards=" + cards(s.b));
const opts = [...s.b.matchAll(/<option value="([^"]+)"\s*>\s*([^<]*)</gi)].map((m) => [m[1], m[2].trim()]);
console.log("options:", opts.length, opts.slice(0, 4).map((o) => o.join(" => ")).join("  |  "));
const og = (k) => (s.b.match(new RegExp('property="' + k + '"[^>]*content="([^"]*)"')) || [])[1] || "-";
console.log("og:title:", og("og:title").slice(0, 80));
console.log("og:image:", og("og:image").slice(0, 90));
console.log("og:desc:", og("og:description").slice(0, 100));

const se = await get(PP + "/serie/456-1/los-simpson/");
const eps = [...new Set([...se.b.matchAll(/href="(\/serie\/\d+-\d+-\d+\/[^"]+)"/gi)].map((m) => m[1]))];
console.log("\nseason 1 eps:", eps.length, eps.slice(0, 3).join("  "));
