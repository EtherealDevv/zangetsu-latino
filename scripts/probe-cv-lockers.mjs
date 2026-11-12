// Which lockers does Cuevana3 actually expose, per language, across the
// current front page? Tells us whether any title has a resolvable latino mirror.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try { const r = await fetch(u, { headers: H, redirect: "follow" }); return { s: r.status, b: await r.text() }; }
  catch (e) { return { s: 0, b: "" }; }
};
const pp = (b) => {
  const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!m) return null;
  try { return JSON.parse(m[1]).props.pageProps; } catch { return null; }
};
const home = pp((await get("https://wv3.cuevana3.eu/")).b);
const movies = (home.tabLastMovies || []).slice(0, 10);
let withLatino = 0, withVimeos = 0;
for (const m of movies) {
  const slug = (m.url && m.url.slug || "").split("/").pop();
  if (!slug) continue;
  const p = pp((await get("https://wv3.cuevana3.eu/ver-pelicula/" + slug)).b);
  const node = p && (p.thisMovie || p.thisSerie);
  const v = node && node.videos;
  if (!v) { console.log(slug.padEnd(34), "no videos"); continue; }
  const fmt = (lang) => (v[lang] || []).map((e) => e.cyberlocker).join(",") || "-";
  const lat = fmt("latino");
  if ((v.latino || []).length) withLatino++;
  if ((v.latino || []).some((e) => /vimeos/i.test(e.cyberlocker || ""))) withVimeos++;
  console.log(slug.slice(0, 33).padEnd(34), "latino:", lat.padEnd(30), "| eng:", fmt("english").slice(0, 40));
}
console.log(`\n${withLatino}/${movies.length} with latino, ${withVimeos} with a vimeos latino mirror`);
