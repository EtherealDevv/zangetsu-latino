// Tercer pase: los iframes reales de cada player y la página /play/ de pelisplus.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const norm = (b) => b.replace(/&#0?38;/g, "&").replace(/&amp;/g, "&");
const iframes = (b) => [...new Set([...norm(b).matchAll(/<iframe[^>]*?(?:src|data-src)=["']([^"'\s]+)["']/gi)].map((m) => m[1]))];
const m3u8 = (b) => (b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || "";

for (const [name, u] of [
  ["3cuevana3", "https://3cuevana3.org/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/"],
  ["dcuevana", "https://dcuevana.pro/pelicula/naruto-shippuden-la-pelicula-the-last-2014/"],
  ["pelisflixhd", "https://pelisflixhd.love/pelicula/avedon/"],
  ["tudorama", "https://tudorama.com/serie/make-me-tingle/"],
  ["pelisplus-play", "https://pelisplus2.vip/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/play/"]
]) {
  const r = await get(u);
  const list = iframes(r.b);
  console.log(`\n=== ${name} ${r.s} ${r.b.length}b -> iframes ${list.length}`);
  list.slice(0, 6).forEach((s) => console.log("   ", s.slice(0, 100)));
  if (r.s === 200 && !list.length) {
    const i = norm(r.b).search(/video-player|tab-video|video-sandbox|player-list/i);
    console.log("   ctx:", i > 0 ? norm(r.b).slice(Math.max(0, i - 200), i + 700).replace(/\s+/g, " ") : "-");
  }
}

console.log("\n\n### one hop sobre el primer iframe de cada uno");
for (const e of [
  "https://3cuevana3.org/player/naruto?x=1",
  ""
]) { if (!e) continue; }
