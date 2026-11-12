const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

console.log("### gnulahd timing de 4 detalles en paralelo");
const urls = [
  "https://ww3.gnulahd.nu/ver/naruto/",
  "https://ww3.gnulahd.nu/ver/naruto-shippuden/",
  "https://ww3.gnulahd.nu/ver/marshalls-miracle/",
  "https://ww3.gnulahd.nu/ver/godzilla-minus-zero/"
];
const t0 = Date.now();
const res = await Promise.all(urls.map((u) => get(u)));
console.log("total", Date.now() - t0, "ms");
res.forEach((r, i) => {
  const pid = (r.b.match(/_gnrdPid\s*=\s*(\d+)/) || [])[1] || "-";
  const ld = (r.b.match(/"@type"\s*:\s*"(Movie|TVSeries|TVEpisode|CreativeWork)"/) || [])[1] || "-";
  console.log(`  ${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(8)} pid=${String(pid).padEnd(8)} ld=${ld}`);
});

console.log("\n### magistv24 torofilm-public.js season handler");
const js = await get("https://magistv24.com/wp-content/themes/torofilm/public/js/torofilm-public.js?ver=1755703904");
console.log("js", js.s, js.b.length + "b");
const idx = js.b.indexOf("data-season");
if (idx < 0) {
  console.log("sin data-season; buscando 'season'...");
  const j2 = js.b.search(/season/i);
  console.log(j2 > 0 ? js.b.slice(Math.max(0, j2 - 400), j2 + 600).replace(/\s+/g, " ") : "nada");
} else {
  console.log(js.b.slice(Math.max(0, idx - 700), idx + 1200).replace(/\s+/g, " "));
}
const acts = [...new Set([...js.b.matchAll(/action\s*:\s*["']([a-z0-9_]+)["']/gi)].map((m) => m[1]))];
console.log("actions:", acts.join(", ") || "-");
