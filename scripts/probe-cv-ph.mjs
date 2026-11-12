const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: H }); return { s: r.status, u: r.url, b: await r.text() }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };

for (const base of ["https://wv3.cuevana3.eu", "https://www.poseidonhd2.co", "https://poseidonhd2.co"]) {
  const h = await get(base + "/");
  console.log("\n==", base, h.s, h.u, h.b.length, "TPost:", (h.b.match(/TPost/g)||[]).length, "next:", /__NEXT_DATA__/.test(h.b));
  const parts = h.b.split(/class="TPost/);
  if (parts[1]) console.log("card:", parts[1].replace(/\s+/g," ").slice(0, 380));
  const link = (parts[1]||"").match(/href="([^"]+)"/);
  console.log("first link:", link && link[1]);
  if (link) {
    const d = await get(link[1].startsWith("http") ? link[1] : base + link[1]);
    const p = pp(d.b);
    console.log(" detail:", d.s, d.b.length, "pp keys:", p ? Object.keys(p).slice(0,12) : null);
    const node = p && (p.thisSerie || p.serie || p.thisMovie);
    if (node) console.log(" node:", node.titles && node.titles.name, "| videos:", node.videos ? Object.keys(node.videos) : null, "| seasons:", node.seasons ? node.seasons.length : 0);
  }
}
