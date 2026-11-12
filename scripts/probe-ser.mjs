const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { try { const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) }); return { s: r.status, u: r.url, b: await r.text() }; } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; } };

console.log("### magistv24 serie");
const s = await get("https://magistv24.com/serie/los-simpson/");
console.log(s.s, s.b.length + "b");
const eps = [...s.b.matchAll(/<article[^>]*class="[^"]*episodes[^"]*"[\s\S]{0,900}?<\/article>/gi)].slice(0, 2);
for (const e of eps) console.log("\n--- ep card ---\n" + e[0].replace(/\s+/g, " ").slice(0, 700));
console.log("\nseasons:", [...new Set([...s.b.matchAll(/<a[^>]*class="[^"]*sel-temp[^"]*"[^>]*>/gi)].map(m => m[0]))].slice(0, 4).join("\n  "));
const apiish = [...new Set([...s.b.matchAll(/['"]([^'"]*(?:admin-ajax|wp-json)[^'"]*)['"]/gi)].map(m => m[1]))].slice(0, 6);
console.log("ajax:", apiish.join("  ") || "-");
const seasonJs = s.b.match(/jQuery[\s\S]{0,400}?sel-temp[\s\S]{0,900}/);
console.log("\nseason js:", (seasonJs ? seasonJs[0] : "no").replace(/\s+/g, " ").slice(0, 900));

console.log("\n\n### gnulahd serie");
const g = await get("https://ww3.gnulahd.nu/ver/los-simpson/");
console.log(g.s, g.b.length + "b");
for (const k of ["temporada", "season", "episod", "capitul", "episode", "_gnrdPid", "wp-json", "ajax"]) {
  const n = (g.b.match(new RegExp(k, "gi")) || []).length;
  console.log(`  "${k}": ${n}`);
}
const i = g.b.search(/temporada/i);
console.log("\nctx temporada:", i > 0 ? g.b.slice(Math.max(0, i - 500), i + 500).replace(/\s+/g, " ") : "-");
const j = g.b.search(/episod/i);
console.log("\nctx episod:", j > 0 ? g.b.slice(Math.max(0, j - 400), j + 400).replace(/\s+/g, " ") : "-");
