const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: H }); return { s: r.status, b: await r.text() }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };
for (const q of ["resident evil", "madre siniestra"]) {
  const r = await get("https://wv3.cuevana3.eu/search?q=" + encodeURIComponent(q));
  const p = pp(r.b);
  const titles = (p.movies || []).slice(0, 6).map(m => (m.titles && m.titles.name) || m.name);
  console.log(q, "->", r.s, titles.join(" | "));
}
