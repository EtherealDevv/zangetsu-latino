const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, ref) => { const r = await fetch(u, { headers: ref ? { ...H, Referer: ref } : H }); return { s: r.status, b: await r.text(), u: r.url }; };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };
const d = await get("https://wv3.cuevana3.eu/ver-pelicula/the-floaters");
const p = pp(d.b);
const node = p.thisMovie;
console.log("videos:", node.videos ? JSON.stringify(node.videos).slice(0, 700) : "NONE");
console.log("has episodes key:", Object.keys(node).filter(k => /video|player|server|link/i.test(k)));
const all = JSON.stringify(p);
const res = [...new Set([...all.matchAll(/"(https?:[^"]*player[^"]*)"/g)].map(m => m[1]))].slice(0, 4);
console.log("player urls:", res);
if (res[0]) {
  const pj = await get(res[0], "https://wv3.cuevana3.eu/ver-pelicula/the-floaters");
  console.log("\nplayer", pj.s, pj.b.length);
  console.log(pj.b.replace(/\s+/g, " ").slice(0, 700));
}
