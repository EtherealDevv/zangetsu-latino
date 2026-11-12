// FlixLatam y PelisflixHD: página de título real, iframes, y qué hay dentro
// del embed (dataLink, go_to_playerVast o PoW/AES).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(18000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

const targets = [
  ["flixlatam", "https://flixlatam.com/peliculas/"],
  ["pelisflixhd", "https://pelisflixhd.love/peliculas"],
  ["seriesflixhd", "https://seriesflixhd.boats/peliculas"],
  ["fanpelis", "https://fanpelis.to/peliculas/"],
  ["doramasflix", "https://doramasflix.in/peliculas/"]
];

for (const [name, list] of targets) {
  const l = await get(list);
  const links = [...new Set([...l.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))]
    .filter((h) => /\/(pelicula|serie|ver-pelicula|ver-serie)\/[a-z0-9-]{4,}\/?$/i.test(h) && !/\/genero\/|\/page\//.test(h));
  console.log(`\n=== ${name} ${l.s} ${l.b.length}b -> ${links.length} títulos`);
  if (!links.length) { console.log("  ejemplos crudos:", [...new Set([...l.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))].filter(h => /\/(pelicula|serie)\//.test(h)).slice(0, 5).join("  ")); continue; }
  const det = await get(links[0].startsWith("http") ? links[0] : new URL(links[0], list).toString(), { Referer: list });
  const ifr = [...new Set([...det.b.matchAll(/<iframe[^>]*src=["']([^"']+)["']/gi)].map((m) => m[1].replace(/&#0?38;/g, "&")))];
  const opt = [...new Set([...det.b.matchAll(/data-option=["']([^"']+)["']/gi)].map((m) => m[1]))];
  console.log(`  ${links[0].slice(0, 72)}`);
  console.log(`  detalle ${det.s} ${det.b.length}b | iframes=${ifr.length} opts=${opt.length}`);
  for (const e of [...ifr, ...opt].slice(0, 3)) {
    const full = e.startsWith("//") ? "https:" + e : (e.startsWith("/") ? new URL(e, det.u).toString() : e);
    const r = await get(full, { Referer: det.u });
    const flags = [
      /POW_CHALLENGE/.test(r.b) ? "POW(" + ((r.b.match(/POW_DIFFICULTY\s*=\s*(\d+)/) || [])[1] || "?") + ")" : "",
      /dataLink/.test(r.b) ? "dataLink" : "",
      /go_to_playerVast/.test(r.b) ? "Vast" : "",
      /<iframe/.test(r.b) ? "iframe-anidado" : "",
      /\.m3u8/.test(r.b) ? "m3u8" : "",
      /jwplayer|playerjs/i.test(r.b) ? "player-js" : ""
    ].filter(Boolean).join(",");
    console.log(`   embed ${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(7)} ${String((r.u.match(/^https?:\/\/([^/]+)/) || [])[1] || r.u).slice(0, 26).padEnd(28)} ${flags || "?"}`);
    if (flags.includes("dataLink")) {
      const i = r.b.indexOf("dataLink");
      console.log("     dataLink:", r.b.slice(i, i + 700).replace(/\s+/g, " "));
      const vast = [...new Set([...r.b.matchAll(/go_to_playerVast\(\s*'([^']+)'/g)].map((m) => m[1]))];
      if (vast.length) console.log("     vast:", vast.join(" | "));
    }
    if (flags.includes("POW")) {
      console.log("     challenge:", ((r.b.match(/POW_CHALLENGE\s*=\s*'([^']+)'/) || [])[1] || "").slice(0, 40));
      console.log("     salt:", ((r.b.match(/POW_SALT\s*=\s*'([^']+)'/) || [])[1] || "").slice(0, 40));
    }
  }
}
