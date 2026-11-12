// Cuarto pase: los <script> inline que montan el reproductor.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", err: String(e.cause?.code || e.message) }; }
};

const PAGES = [
  ["pelisplus-play", "https://pelisplus2.vip/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/play/"],
  ["3cuevana3", "https://3cuevana3.org/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/"],
  ["dcuevana", "https://dcuevana.pro/pelicula/naruto-shippuden-la-pelicula-the-last-2014/"],
  ["pelisflixhd", "https://pelisflixhd.love/pelicula/avedon/"],
  ["tudorama", "https://tudorama.com/serie/make-me-tingle/"]
];

for (const [name, u] of PAGES) {
  const r = await get(u);
  console.log(`\n############ ${name} ${r.s} ${r.b.length}b`);
  if (r.s !== 200) { console.log("  ", r.err || ""); continue; }
  const bodies = [...r.b.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  const hits = bodies.filter((x) => /m3u8|\.mp4|sources\s*[:=]|file\s*:|embedUrl|iframe|videoUrl|dataLink|streamUrl/i.test(x));
  console.log("  scripts inline:", bodies.length, "| con pinta de player:", hits.length);
  hits.slice(0, 4).forEach((x, i) => console.log(`  ---[${i}]---`, x.replace(/\s+/g, " ").slice(0, 620)));
  if (!hits.length) {
    const ext = [...new Set([...r.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 8);
    console.log("  externos:", ext.join("  "));
  }
}
