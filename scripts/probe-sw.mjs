// StreamWish / VidHide / Vidara family: does the 452-byte page bounce to a
// live mirror like Voe does, or is it a real block?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try { const r = await fetch(u, { headers: H, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; }
  catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; }
};

// Get real embed URLs straight from a Cuevana3 detail page.
const pp = (b) => {
  const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]).props.pageProps; } catch { return null; }
};
const d = await get("https://wv3.cuevana3.eu/ver-pelicula/una-creacion-del-senor");
const node = pp(d.b) && pp(d.b).thisMovie;
const entries = Object.values(node.videos).flat().filter(e => e && e.result).slice(0, 6);
const seen = new Set();
for (const e of entries) {
  const p = await get(e.result);
  const m = p.b.match(/var url\s*=\s*['"]([^'"]+)['"]/i);
  if (!m) { console.log(e.cyberlocker, "-> no var url"); continue; }
  const emb = m[1];
  if (seen.has(emb)) continue;
  seen.add(emb);
  const x = await get(emb);
  const next = (x.b.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/) || [])[1];
  console.log(`${e.cyberlocker.padEnd(12)} ${x.s} len=${String(x.b.length).padEnd(7)} ${x.u.slice(0, 40)} ${next ? "-> " + next.slice(0, 50) : ""}`);
  if (x.b.length < 1200) console.log("   body:", x.b.replace(/\s+/g, " ").slice(0, 200));
}
