const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: H }); return { s: r.status, u: r.url, b: await r.text() }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };

for (const base of ["https://wv3.cuevana3.eu", "https://www.poseidonhd2.co"]) {
  const h = await get(base + "/");
  const p = pp(h.b);
  console.log("\n==", base, "pageProps keys:", p ? Object.keys(p) : null);
  if (p) {
    for (const k of Object.keys(p)) {
      const v = p[k];
      console.log("  ", k, Array.isArray(v) ? `array(${v.length})` : typeof v, Array.isArray(v) && v[0] ? JSON.stringify(v[0]).slice(0, 200) : (typeof v === "object" && v ? JSON.stringify(v).slice(0, 200) : String(v).slice(0, 80)));
    }
  }
  const hrefs = [...new Set([...h.b.matchAll(/href="(\/(?:pelicula|serie|movie|tv)[^"]*)"/g)].map(m => m[1]))];
  console.log("  sample hrefs:", hrefs.slice(0, 6));
  if (hrefs[0]) {
    const d = await get(base + hrefs[0]);
    const q = pp(d.b);
    const node = q && (q.thisSerie || q.serie || q.thisMovie);
    console.log("  detail pp keys:", q ? Object.keys(q) : null);
    console.log("  node:", node ? { name: node.titles, vids: node.videos ? Object.keys(node.videos) : null, seasons: node.seasons ? node.seasons.length : 0 } : null);
  }
}
