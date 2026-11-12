const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: H }); return { s: r.status, b: await r.text() }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };
const d = await get("https://wv3.cuevana3.eu/ver-pelicula/the-floaters");
const p = pp(d.b);
console.log("status", d.s, "keys:", p ? Object.keys(p) : null);
if (p) {
  const node = p.thisMovie || p.movie || p.thisSerie || p.serie;
  console.log("node keys:", node ? Object.keys(node).slice(0, 25) : null);
  if (node) {
    console.log("name:", node.titles && node.titles.name);
    console.log("videos:", node.videos ? Object.keys(node.videos) : null);
    console.log("v0:", JSON.stringify((node.videos && (node.videos.latino || node.videos.spanish) || [])[0]).slice(0, 300));
  }
}
