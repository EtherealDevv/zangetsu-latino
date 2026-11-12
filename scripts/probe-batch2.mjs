// Segundo pase: en páginas de detalle reales, ¿cómo monta el player cada sitio?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const norm = (b) => b.replace(/&#0?38;/g, "&").replace(/&amp;/g, "&");

const ctx = (b, re, pad, n) => {
  const m = b.match(re);
  if (!m || m.index == null) return "";
  const i = m.index;
  return b.slice(Math.max(0, i - (pad || 200)), i + (n || 700)).replace(/\s+/g, " ");
};

const PAGES = [
  ["pelisplus2", "https://pelisplus2.vip/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/"],
  ["icuevana3", "https://icuevana3.lat/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/"],
  ["3cuevana3", "https://3cuevana3.org/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/"],
  ["dcuevana", "https://dcuevana.pro/pelicula/naruto-shippuden-la-pelicula-the-last-2014/"],
  ["tudorama", "https://tudorama.com/serie/make-me-tingle/"],
  ["pelisflixhd", "https://pelisflixhd.love/pelicula/avedon/"],
  ["flixlatam", "https://flixlatam.com/pelicula/angel-y-el-pistolero-ev2BxB"]
];

for (const [name, u] of PAGES) {
  const r = await get(u);
  const b = norm(r.b);
  console.log(`\n############ ${name} ${r.s} ${b.length}b ${r.u.slice(0, 55)}`);
  if (r.s !== 200) { console.log("  ", r.err || ""); continue; }
  for (const k of ["player", "iframe", "<video", "embed", "data-url", "data-src", "ajax", "api/"]) {
    console.log(`  "${k}": ${(b.match(new RegExp(k, "gi")) || []).length}`);
  }
  console.log("  player ctx:", ctx(b, /player/i, 250, 550) || "-");
  const scr = [...new Set([...b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].filter((s) => !/jquery|wp-includes|googletag|ads|analytics/i.test(s)).slice(0, 6);
  console.log("  scripts:", scr.join("  ") || "-");
  const api2 = [...new Set([...b.matchAll(/["']([^"']*(?:ajax|api|player|stream)[^"']*)["']/gi)].map((m) => m[1]))].filter((s) => s.length < 90).slice(0, 6);
  console.log("  api-ish:", api2.join("  ") || "-");
}
