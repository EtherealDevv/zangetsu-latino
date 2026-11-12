const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: H }); return { s: r.status, u: r.url, b: await r.text() }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };

const base = "https://wv3.cuevana3.eu";
const h = await get(base + "/");
const p = pp(h.b);
const m0 = p.tabLastMovies[0];
console.log("movie keys:", Object.keys(m0));
console.log("url:", JSON.stringify(m0.url));
console.log("ep0:", JSON.stringify(p.episodes[0]).slice(0, 400));
const slug = m0.url && (m0.url.slug || m0.url.path);
for (const cand of [m0.url && m0.url.slug, "/pelicula/" + (slug||"")]) {
  if (!cand) continue;
  const u = cand.startsWith("http") ? cand : base + cand;
  const d = await get(u);
  const q = pp(d.b);
  console.log("\n== detail", u, d.s, d.b.length, "keys:", q ? Object.keys(q) : null);
  if (q) { const node = q.thisMovie || q.thisSerie || q.movie; console.log(" node keys:", node ? Object.keys(node).slice(0,20) : null);
    if (node) console.log(" videos:", JSON.stringify(node.videos).slice(0, 600));
  }
  if (d.s === 200) break;
}
