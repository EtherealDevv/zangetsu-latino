const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

console.log("### gnulahd card completa (buscador)");
const q = await get("https://ww3.gnulahd.nu/?s=naruto");
const cards = [...q.b.matchAll(/<a class="gnrd-card"[\s\S]{0,1600}?<\/a>/gi)];
console.log("tarjetas:", cards.length);
if (cards[0]) console.log(cards[0][0].replace(/\s+/g, " "));

console.log("\n### gnulahd card completa (/ver/peliculas/)");
const p = await get("https://ww3.gnulahd.nu/ver/peliculas/");
const pc = [...p.b.matchAll(/<a class="gnrd-card"[\s\S]{0,1600}?<\/a>/gi)];
console.log("tarjetas:", pc.length);
if (pc[0]) console.log(pc[0][0].replace(/\s+/g, " "));
console.log("gnrd-type?:", (p.b.match(/gnrd-type[^"]*/g) || []).slice(0, 5).join(" | ") || "-");

console.log("\n### magistv24 torofilm-public.js — selector de temporada");
const js = await get("https://magistv24.com/wp-content/themes/torofilm/public/js/torofilm-public.js?ver=1755703904");
console.log("js", js.s, js.b.length + "b");
const i = js.b.indexOf("data-season");
console.log(i > 0 ? js.b.slice(Math.max(0, i - 900), i + 900).replace(/\s+/g, " ") : "sin data-season");
const acts = [...new Set([...js.b.matchAll(/action\s*:\s*['"]([a-z0-9_]+)['"]/gi)].map((m) => m[1]))];
console.log("actions:", acts.join(", ") || "-");
