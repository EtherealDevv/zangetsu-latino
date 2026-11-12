// Candidatos sacados de streamflix-reborn2: ¿viven desde esta red y qué
// reproductor usan? Sólo sigue el que tenga host vivo.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

const SITES = [
  ["anymovie", "https://anymovie.cc"],
  ["doramasflix", "https://doramasflix.in"],
  ["fanpelis", "https://fanpelis.to"],
  ["flixlatam", "https://flixlatam.com"],
  ["latanime", "https://latanime.org"],
  ["pelisflixhd", "https://pelisflixhd.win"],
  ["tioplus", "https://tioplus.app"],
  ["seriesflixhd", "https://seriesflixhd.lol"],
  ["seriesturcas", "https://tbg.seriesturcastv.to"],
  ["sololatino", "https://sololatino.net"]
];

for (const [name, base] of SITES) {
  const home = await get(base + "/");
  const title = ((home.b.match(/<title[^>]*>([\s\S]{0,70}?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim();
  const plat = [];
  if (/__NEXT_DATA__/.test(home.b)) plat.push("next");
  if (/wp-content/.test(home.b)) plat.push("wp");
  if (/dooplay|doodstream|dooood/i.test(home.b)) plat.push("dooplay");
  if (/laravel|csrf-token/i.test(home.b)) plat.push("laravel");
  console.log(`\n=== ${name.padEnd(12)} ${base}`);
  console.log(`  home ${home.s} ${home.b.length}b  ${plat.join(",") || "?"}  "${title.slice(0, 45)}"`);
  if (home.s !== 200) { console.log("  ", home.err || ""); continue; }
  const kinds = [...new Set([...home.b.matchAll(/href="([^"]*\/(?:pelicula|ver-pelicula|serie|ver-serie|dorama|anime|movie|tv|watch)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 4);
  console.log("  rutas:", kinds.join("  ") || "-");
  const apiish = [...new Set([...home.b.matchAll(/["'](\/[a-z0-9/_.-]*(?:api|ajax)[a-z0-9/_.?=&-]*)["']/gi)].map((m) => m[1]))].slice(0, 5);
  if (apiish.length) console.log("  api:", apiish.join("  "));
}
