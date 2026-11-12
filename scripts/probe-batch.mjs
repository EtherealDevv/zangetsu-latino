// Barrido ancho: un título real por sitio y qué mecanismo de player usa.
// Salida compacta para decidir de un vistazo qué se puede montar.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(18000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const norm = (b) => b.replace(/&#0?38;/g, "&").replace(/&amp;/g, "&");

function analyze(name, r, extra) {
  const b = norm(r.b);
  const ifr = [...new Set([...b.matchAll(/<iframe[^>]*src=["']([^"'\s]+)["']/gi)].map((m) => m[1]))].filter((x) => !/youtu|googletag|facebook/i.test(x)).slice(0, 4);
  const opt = [...new Set([...b.matchAll(/data-option=["']([^"']+)["']/gi)].map((m) => m[1]))].slice(0, 4);
  const tr = [...new Set([...b.matchAll(/[?&](trembed|trid|trtype|id|pid|server|option)=[^"'&\s]+/gi)].map((m) => m[0]))].slice(0, 6);
  const emb = [...new Set([...b.matchAll(/https?:\/\/[^"'\s]+?\/(?:e|v|embed|player|stream|video)\/[^"'\s]{2,50}/gi)].map((m) => m[0]))].slice(0, 5);
  const apis = [...new Set([...b.matchAll(/["'](\/[a-z0-9/_.-]*(?:api|ajax|player|embed)[a-z0-9/_.?=&-]*)["']/gi)].map((m) => m[1]))].slice(0, 5);
  const hosts = [...new Set([...b.matchAll(/(?:https?:)?\/\/([a-z0-9.-]+)\/(?:e|v|embed|player)\//gi)].map((m) => m[1]))].slice(0, 5);
  const m3 = (b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || "";
  const flags = [];
  if (/POW_CHALLENGE|POW_DIFFICULTY/.test(b)) flags.push("POW");
  if (/Altcha|altcha/i.test(b)) flags.push("altcha");
  if (/decrypt|AES|CryptoJS/i.test(b)) flags.push("aes");
  if (/_gnrdPid/.test(b)) flags.push("gnrd");
  if (/"@type"\s*:\s*"TVSeries"/.test(b)) flags.push("TVSeries");
  console.log(`\n=== ${name} ${r.s} ${r.b.length}b ${r.u.slice(0, 62)}`);
  if (r.s !== 200) { console.log("   ", r.err || "sin cuerpo"); return; }
  console.log("   flags:", flags.join(",") || "-", "| ifr:", ifr.length, "| opts:", opt.length, "| qs:", tr.length, "| m3u8:", m3 ? "SI" : "no");
  if (hosts.length) console.log("   hosts:", hosts.join(", "));
  if (ifr.length) console.log("   iframes:", ifr.join("\n            "));
  if (opt.length) console.log("   data-option:", opt.join(" | "));
  if (tr.length) console.log("   qs:", tr.join(" "));
  if (emb.length) console.log("   embeds:", emb.join("\n           "));
  if (apis.length) console.log("   api:", apis.join("  "));
  if (extra) console.log("   (extra)");
}

const SITES = [
  ["animeflv", "https://www3.animeflv.net", "/anime/naruto", "/browse?q=naruto"],
  ["pelisplus2", "https://pelisplus2.vip", "", "/?s=naruto"],
  ["tudorama", "https://tudorama.com", "/serie/make-me-tingle/", "/?s=make+me+tingle"],
  ["pelisflixhd", "https://pelisflixhd.love", "", "/busqueda/avedon"],
  ["doramasflix", "https://doramasflix.in", "", "/?s=aquel+invierno"],
  ["seriesturcas", "https://tbg.seriesturcastv.to", "", "/?s=amor"],
  ["icuevana3", "https://icuevana3.lat", "", "/?s=naruto"],
  ["dcuevana", "https://dcuevana.pro", "", "/?s=naruto"],
  ["3cuevana3", "https://3cuevana3.org", "", "/?s=naruto"],
  ["fanpelis", "https://fanpelis.to", "", "/?s=naruto"],
  ["flixlatam", "https://flixlatam.com", "", "/search?s=naruto"]
];

for (const [name, base, direct, searchPath] of SITES) {
  let target = direct ? base + direct : "";
  if (!target) {
    const s = await get(base + searchPath);
    const links = [...new Set([...s.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))]
      .map((h) => (h.startsWith("http") ? h : base + (h.startsWith("/") ? "" : "/") + h))
      .filter((h) => /(\/(pelicula|serie|dorama|anime|ver|watch|peliculas|series)\/[a-z0-9-]{5,})/i.test(h) && !/\/(genero|category|tag|page|busqueda\?)/i.test(h));
    target = links[0] || "";
    if (!target) { console.log(`\n=== ${name} — sin objetivo (${s.s}, ${s.b.length}b)`); continue; }
  }
  analyze(name, await get(target), true);
}
