// Estructura real de los candidatos vivos: cómo listan, cómo buscan y sobre
// todo QUÉ HOSTS usan sus reproductores (si son los muertos, no sirve).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(15000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const hosts = (b) => {
  const out = new Set();
  const re = /(?:https?:)?\/\/([a-z0-9.-]+)\/(?:e|v|embed|player)\//gi;
  let m;
  while ((m = re.exec(b)) !== null) out.add(m[1].toLowerCase());
  for (const k of ["vimeos", "vidara", "streamwish", "vidhide", "filelions", "voe.sx", "dood", "mp4upload", "yourupload", "streamtape", "ok.ru", "netu", "filemoon", "mixdrop", "uqload", "streamsb", "fembed", "embed66", "hgcloud", "playmogo"]) {
    if (b.toLowerCase().includes(k)) out.add("*" + k);
  }
  return [...out].slice(0, 12);
};

const sitios = [
  { name: "tudorama", base: "https://tudorama.com", home: "/", search: "/?s=squid+game" },
  { name: "gnula", base: "https://gnula.se", home: "/", search: "/?s=naruto" },
  { name: "cuevana3.la", base: "https://cuevana3.la", home: "/", search: "/?s=naruto" },
  { name: "repelisplus", base: "https://repelisplus.uno", home: "/", search: "/?s=naruto" },
  { name: "pelismart", base: "https://pelismart.tv", home: "/", search: "/?s=naruto" }
];

for (const s of sitios) {
  const home = await get(s.base + s.home);
  const links = [...new Set([...home.b.matchAll(/href="([^"]*\/(?:pelicula|serie|dorama|ver|movie|tv|episodio|capitulo)[^"]*)"/gi)].map((m) => m[1]))];
  console.log(`\n=== ${s.name} (${home.s} ${home.b.length}b)`);
  console.log("  patrones:", links.slice(0, 4).join("  "));
  const srch = await get(s.base + s.search);
  const sres = [...new Set([...srch.b.matchAll(/href="([^"]*\/(?:pelicula|serie|dorama|ver|movie|tv)[^"]*)"/gi)].map((m) => m[1]))];
  console.log(`  search ${srch.s} ${srch.b.length}b -> ${sres.length} enlaces`);
  if (sres.length) console.log("   ", sres.slice(0, 3).join("\n    "));
  const target = sres[0] || links[0];
  if (!target) { console.log("  sin objetivo"); continue; }
  const full = target.startsWith("http") ? target : s.base + target;
  const det = await get(full);
  console.log(`  detalle ${det.s} ${det.b.length}b  ${full.slice(0, 70)}`);
  console.log("  hosts:", hosts(det.b).join(", ") || "ninguno");
  const iframes = [...new Set([...det.b.matchAll(/<iframe[^>]*src="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 5);
  if (iframes.length) console.log("  iframes:", iframes.join("\n           "));
  const opts = [...new Set([...det.b.matchAll(/data-option="([^"]+)"/gi)].map((m) => m[1]))].slice(0, 5);
  if (opts.length) console.log("  data-option:", opts.join("\n               "));
}
