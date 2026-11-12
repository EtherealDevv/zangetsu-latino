// Pase 6: PelisPlus (cards reales, serie con temporadas), Tudorama (corvus_get_servers), Doramasflix (RSC).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const links = (b, re) => [...new Set([...b.matchAll(re)].map((m) => m[1]))];

const PP = "https://pelisplus2.vip";
console.log("### PELISPLUS");
const srch = await get(PP + "/?s=los+simpson");
console.log("search", srch.s, srch.b.length + "b");
const sp = links(srch.b, /href="([^"]*\/(?:pelicula|serie)\/[^"]+)"/gi);
console.log("  hits:", sp.length);
sp.slice(0, 6).forEach((h) => console.log("   ", h.slice(0, 100)));
const firstSeries = sp.find((h) => /\/serie\//.test(h));
if (firstSeries) {
  const s = await get(firstSeries.startsWith("http") ? firstSeries : PP + firstSeries);
  console.log("\n  SERIE", firstSeries.slice(0, 70), s.s, s.b.length + "b");
  const eps = links(s.b, /href="([^"]*\/(?:episodio|capitulo|temporada)\/[^"]+)"/gi);
  console.log("  eps:", eps.length, eps.slice(0, 5).join("  "));
  const seasons = [...s.b.matchAll(/data-(?:season|temporada|tab)[^=]*="([^"]{1,20})"/gi)].map((m) => m[1]);
  console.log("  seasons attr:", [...new Set(seasons)].slice(0, 10).join(" "));
  const i = s.b.search(/temporada/i);
  console.log("  ctx:", i > 0 ? s.b.slice(Math.max(0, i - 400), i + 600).replace(/\s+/g, " ").slice(0, 800) : "-");
  const play = links(s.b, /href="([^"]*\/play\/?)"/gi);
  console.log("  play links:", play.slice(0, 4).join("  "));
}

console.log("\n### TUDORAMA");
const T = "https://tudorama.com";
const page = await get(T + "/serie/make-me-tingle/");
console.log("serie", page.s, page.b.length + "b");
const corv = page.b.match(/var\s+corvutils\s*=\s*(\{[\s\S]{0,1200}?\});/);
console.log("  corvutils:", corv ? corv[1].replace(/\s+/g, " ").slice(0, 600) : "-");
const pid = (page.b.match(/post_id["']?\s*[:=]\s*["']?(\d+)/) || [])[1] || (page.b.match(/data-post=["'](\d+)["']/) || [])[1];
console.log("  post_id:", pid || "-");
const nonce = (page.b.match(/"nonce"\s*:\s*"([a-f0-9]{6,})"/) || [])[1] || (page.b.match(/nonce["']?\s*[:=]\s*["']([a-f0-9]{6,})/) || [])[1];
console.log("  nonce:", nonce || "-");
if (pid && nonce) {
  const body = new URLSearchParams({ action: "corvus_get_servers", nonce, post_id: pid });
  const r = await fetch(T + "/wp-admin/admin-ajax.php", { method: "POST", headers: { ...H, "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(), signal: AbortSignal.timeout(20000) });
  const txt = await r.text();
  console.log("  AJAX", r.status, txt.length + "b:", txt.replace(/\s+/g, " ").slice(0, 900));
}

console.log("\n### DORAMASFLIX");
const D = "https://doramasflix.in";
const dh = await get(D + "/");
console.log("home", dh.s, dh.b.length + "b");
const rsc = (dh.b.match(/self\.__next_f\.push/g) || []).length;
console.log("  rsc pushes:", rsc);
const j = [...new Set([...dh.b.matchAll(/https?:\\?\/\\?\/[a-z0-9.-]+\\?\/[^"'\s\\]{0,40}/gi)].map((m) => m[0].replace(/\\\//g, "/")))].filter((x) => /api|seriesapi|fluxcedene|cdn/i.test(x)).slice(0, 8);
console.log("  hosts:", j.join("\n         ") || "-");
const slugs = [...new Set([...dh.b.matchAll(/"(?:slug|href)\\?"\s*:\s*"(\/(?:dorama|serie|ver|pelicula)[^"]*)"/gi)].map((m) => m[1]))].slice(0, 6);
console.log("  slugs:", slugs.join("  ") || "-");
const anyLink = [...new Set([...dh.b.matchAll(/href="([^"]{6,80})"/gi)].map((m) => m[1]))].slice(0, 14);
console.log("  hrefs:", anyLink.join("  "));
