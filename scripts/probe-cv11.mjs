const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, ref) => { try { const r = await fetch(u, { headers: ref ? { ...H, Referer: ref } : H }); return { s: r.status, u: r.url, b: await r.text() }; } catch (e) { return { s: 0, u, b: "" }; } };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };
const d = await get("https://wv3.cuevana3.eu/ver-pelicula/madre-siniestra");
const p = pp(d.b);
const node = p && (p.thisMovie || p.thisSerie);
const v = node && node.videos;
console.log("langs:", v ? Object.keys(v).map(k => k + "=" + v[k].length).join(" ") : null);
const first = v && (v.latino || v.spanish || [])[0];
console.log("first:", first && first.result, first && first.cyberlocker);
if (first) {
  const pl = await get(first.result, "https://wv3.cuevana3.eu/ver-pelicula/madre-siniestra");
  const emb = (pl.b.match(/var url\s*=\s*['"]([^'"]+)['"]/i) || [])[1];
  console.log("embed:", emb);
  if (emb) { const x = await get(emb, "https://wv3.cuevana3.eu/"); console.log("embed page:", x.s, x.b.length, "packer:", /eval\(function/.test(x.b), "m3u8:", (x.b.match(/https?:[^"'\\ ]+\.m3u8/g)||[])[0] || "-"); }
}
