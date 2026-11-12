// PelisPlus: forma real de las tarjetas en /peliculas-populares/ y en ?s=.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const PP = "https://pelisplus2.vip";
for (const p of ["/peliculas-populares/", "/?s=simpson"]) {
  const r = await get(PP + p);
  console.log(`\n#### ${p} ${r.s} ${r.b.length}b`);
  const all = [...r.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);
  const pats = {};
  for (const h of all) { const k = h.split("/").slice(0, 2).join("/"); pats[k] = (pats[k] || 0) + 1; }
  console.log("  patrones:", Object.entries(pats).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k}(${v})`).join("  "));
  const cards = [...new Set(all.filter((h) => /\/(?:pelicula|serie)s?\/[^/]+\/?$/i.test(h)))];
  console.log("  fichas:", cards.length, cards.slice(0, 3).join("  "));
  const i = r.b.search(/<article|class="[^"]*card|TPost|TpRw/);
  console.log("  ctx:", i > 0 ? r.b.slice(i, i + 700).replace(/\s+/g, " ") : "-");
}
