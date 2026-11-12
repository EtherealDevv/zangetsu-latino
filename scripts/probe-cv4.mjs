const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { const r = await fetch(u, { headers: H }); return { s: r.status, b: await r.text() }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };
for (const u of ["https://wv3.cuevana3.eu/movies/1238735/the-floaters"]) {
  const d = await get(u);
  const p = pp(d.b);
  console.log(u, d.s, "keys:", p ? Object.keys(p) : null);
  if (p) for (const k of Object.keys(p)) {
    const v = p[k];
    console.log(" ", k, Array.isArray(v) ? "array(" + v.length + ")" : typeof v, (typeof v === "object" && v && !Array.isArray(v)) ? Object.keys(v).slice(0,14).join(",") : JSON.stringify(v).slice(0,120));
  }
}
