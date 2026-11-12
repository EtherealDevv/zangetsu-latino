// Capa 2: en una página de detalle REAL, ¿dónde está el reproductor y a qué
// host apunta? Sin esto no hay provider, sólo HTML bonito.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

const pages = [
  ["tudorama", "https://tudorama.com/serie/make-me-tingle/"],
  ["gnulahd", "https://ww3.gnulahd.nu/ver/godzilla-minus-zero/"],
  ["magistv24", "https://magistv24.com/pelicula/proyecto-almanac/"],
  ["cuevana3.la", "https://cuevana3.la/pelicula/f1-la-pelicula-online-en-cuevana"],
  ["repelisplus", "https://repelisplus.uno/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/"]
];

for (const [name, url] of pages) {
  const r = await get(url);
  console.log(`\n=== ${name} ${r.s} ${r.b.length}b  ${r.u.slice(0, 60)}`);
  if (r.s !== 200) { console.log("  ", r.err || "sin cuerpo"); continue; }
  const grab = (re) => [...new Set([...r.b.matchAll(re)].map((m) => m[1]))].slice(0, 6);
  const iframes = grab(/<iframe[^>]*src="([^"]+)"/gi);
  const opts = grab(/data-option="([^"]+)"/gi);
  const trembed = grab(/(?:trembed|trid|trtype)=[^"'&\s]+/gi);
  const embeds = grab(/https?:\/\/[^"'\s]+\/(?:e|v|embed|player)[\/?][^"'\s]{0,60}/gi);
  const scripts = grab(/<script[^>]*src="([^"]*player[^"]*)"/gi);
  console.log("  iframes:", iframes.length ? "\n           " + iframes.join("\n           ") : "-");
  console.log("  data-option:", opts.length ? opts.join(" | ") : "-");
  console.log("  trembed:", trembed.length ? trembed.join(" ") : "-");
  console.log("  embeds:", embeds.length ? "\n          " + embeds.join("\n          ") : "-");
  console.log("  player scripts:", scripts.length ? scripts.join(" | ") : "-");
  const servers = grab(/<li[^>]*(?:server|player|option)[^>]*>([\s\S]{0,120}?)<\/li>/gi);
  if (servers.length) console.log("  server <li>:", servers.map((s) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).join(" | "));
}
