// Capa 3: seguir el reproductor hasta el host final en cada candidato.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9", "Accept": "text/html,application/xhtml+xml,*/*" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
const show = (label, r) => {
  const hosts = [...new Set([...r.b.matchAll(/(?:https?:)?\/\/([a-z0-9.-]+)\//gi)].map((m) => m[1].toLowerCase()))].slice(0, 8);
  const m3 = (r.b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || "";
  console.log(`${label}  ${r.s} ${String(r.b.length).padEnd(7)} ${r.u.slice(0, 55)}`);
  if (hosts.length) console.log(`   hosts: ${hosts.join(", ")}`);
  if (m3) console.log(`   m3u8: ${m3.slice(0, 70)}`);
};

console.log("=== magistv24 / trembed ===");
for (const n of [0, 1, 2]) {
  show(`trembed=${n}`, await get(`https://magistv24.com/?trembed=${n}&trid=39856&trtype=1`, { Referer: "https://magistv24.com/pelicula/proyecto-almanac/" }));
}

console.log("\n=== pelisplus2.vip (destino de repelisplus.uno) ===");
const pp2 = await get("https://pelisplus2.vip/peliculas/naruto-shippuden-la-pelicula-the-last-2014-P317442L/");
show("detalle", pp2);
const opts = [...new Set([...pp2.b.matchAll(/data-option="([^"]+)"/gi)].map((m) => m[1]))];
console.log("   data-option:", opts.length ? opts.join(" | ") : "-");
for (const o of opts.slice(0, 3)) show("   embed", await get(o, { Referer: pp2.u }));

console.log("\n=== tudorama / capítulo ===");
const t = await get("https://tudorama.com/serie/make-me-tingle/");
const epLinks = [...new Set([...t.b.matchAll(/href="(https:\/\/tudorama\.com\/[^"]*(?:capitulo|episodio)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 3);
console.log("   episodios:", epLinks.join(" | ") || "no encontrados");
for (const e of epLinks.slice(0, 1)) {
  const r = await get(e);
  show("   ep", r);
  const ifr = [...r.b.matchAll(/<iframe[^>]*src="([^"]+)"/gi)].map((m) => m[1]);
  const opt = [...new Set([...r.b.matchAll(/data-option="([^"]+)"/gi)].map((m) => m[1]))];
  console.log("   iframes:", ifr.join(" | ") || "-");
  console.log("   options:", opt.join(" | ") || "-");
  if (ifr[0]) show("   iframe", await get(ifr[0], { Referer: e }));
}

console.log("\n=== gnulahd / lista de servidores ===");
const g = await get("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/");
const i = g.b.indexOf("'+src+'");
console.log(g.b.slice(Math.max(0, i - 700), i + 300).replace(/\s+/g, " ").slice(0, 900));
