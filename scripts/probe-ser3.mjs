const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) {
    return { s: 0, u, b: "", err: String(e.cause?.code || e.message) };
  }
};

console.log("### magistv24 — JS del selector de temporada");
const s = await get("https://magistv24.com/serie/los-simpson/");
const i = s.b.indexOf("data-season");
console.log("ctx:", s.b.slice(Math.max(0, i - 800), i + 200).replace(/\s+/g, " "));
// busca el handler ajax
const h = s.b.search(/admin-ajax[\s\S]{0,80}action/);
console.log("\najax handler:", h > 0 ? s.b.slice(Math.max(0, h - 400), h + 600).replace(/\s+/g, " ") : "-");
const acts = [...new Set([...s.b.matchAll(/action\s*:\s*['"]([a-z0-9_]+)['"]/gi)].map((m) => m[1]))];
console.log("actions:", acts.join(", ") || "-");

console.log("\n\n### gnulahd — tarjetas de /ver/peliculas/ y del buscador");
const p = await get("https://ww3.gnulahd.nu/ver/peliculas/");
console.log("peliculas", p.s, p.b.length + "b");
const art = [...p.b.matchAll(/<article[^>]*class="[^"]*"[\s\S]{0,1400}?<\/article>/gi)].slice(0, 2);
for (const a of art) console.log("\n--- card ---\n" + a[0].replace(/\s+/g, " ").slice(0, 800));
const q = await get("https://ww3.gnulahd.nu/?s=naruto");
const cards = [...q.b.matchAll(/<article[^>]*class="[^"]*"[\s\S]{0,1400}?<\/article>/gi)].slice(0, 3);
console.log("\nsearch cards:", cards.length);
for (const c of cards) console.log("\n--- s-card ---\n" + c[0].replace(/\s+/g, " ").slice(0, 500));
