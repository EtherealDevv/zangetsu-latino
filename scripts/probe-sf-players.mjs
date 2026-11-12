// Capa final: en cada sitio vivo, abrir un título real y seguir el reproductor
// hasta el host. Si el host está muerto, el sitio no sirve como fuente.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(18000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const m3u8 = (b) => (b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || "";
const sig = (r) => {
  const m = m3u8(r.b);
  const ifr = [...new Set([...r.b.matchAll(/<iframe[^>]*src="([^"]+)"/gi)].map((x) => x[1].replace(/&#0?38;/g, "&")))].slice(0, 4);
  const opt = [...new Set([...r.b.matchAll(/data-option="([^"]+)"/gi)].map((x) => x[1]))].slice(0, 4);
  const tr = [...new Set([...r.b.matchAll(/(?:\?|&)trembed=[^"'&\s]+(?:&[^"'\s]+)?/gi)].map((x) => x[0]))].slice(0, 4);
  return { m, ifr, opt, tr };
};

const SITES = [
  { name: "flixlatam", list: "https://flixlatam.com/peliculas" },
  { name: "pelisflixhd", list: "https://pelisflixhd.love/peliculas" },
  { name: "seriesflixhd", list: "https://seriesflixhd.boats/series" },
  { name: "fanpelis", list: "https://fanpelis.to/" },
  { name: "doramasflix", list: "https://doramasflix.in/" },
  { name: "seriesturcas", list: "https://kaj.seriesturcastv.to/series/" }
];

for (const s of SITES) {
  const list = await get(s.list);
  const hrefs = [...new Set([...list.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))]
    .filter((h) => /\/(pelicula|peliculas|serie|series|dorama|ver|watch)\/[^/]+/.test(h) && !/\.(css|js|png|jpg|ico)/.test(h))
    .slice(0, 3);
  console.log(`\n=== ${s.name}  list ${list.s} ${list.b.length}b · ${hrefs.length} enlaces`);
  if (!hrefs.length) continue;
  const det = await get(hrefs[0], { Referer: list.u });
  const d = sig(det);
  console.log(`  detalle ${det.s} ${det.b.length}b ${det.u.slice(0, 70)}`);
  console.log(`  opts=${d.opt.length} iframes=${d.ifr.length} trembed=${d.tr.length} m3u8=${d.m ? "SI" : "no"}`);
  if (d.m) { console.log("   m3u8:", d.m.slice(0, 80)); continue; }
  const targets = [...d.opt, ...d.ifr.map((x) => (x.startsWith("//") ? "https:" + x : x)), ...d.tr.map((x) => det.u.split("?")[0] + x)].slice(0, 3);
  for (const t of targets) {
    const r = await get(t, { Referer: det.u });
    const rr = sig(r);
    const host = (r.u.match(/^https?:\/\/([^/]+)/) || [])[1] || "";
    console.log(`   -> ${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(7)} ${host.slice(0, 28).padEnd(30)} ${rr.m ? "m3u8 " + rr.m.slice(0, 50) : (rr.ifr[0] ? "iframe " + rr.ifr[0].slice(0, 50) : "")}`);
  }
}
