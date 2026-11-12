// Tudorama: markup de home, categoría, búsqueda y ficha.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", accept: "text/html,*/*" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};

const home = await get(BASE + "/");
console.log("home", home.s, home.b.length + "b");
// headings + bloques
const heads = [...home.b.matchAll(/<h([1-3])[^>]*>([\s\S]{0,80}?)<\/h\1>/gi)].map((m) => m[2].replace(/<[^>]*>/g, "").trim()).filter(Boolean);
console.log("headings:", heads.slice(0, 20).join(" | "));
const i = home.b.indexOf("/serie/");
console.log("\nctx serie:", home.b.slice(Math.max(0, i - 800), i + 500).replace(/\s+/g, " "));

for (const p of ["/genero/series/", "/genero/emision/", "/?s=goblin", "/series/?s=goblin", "/page/2/"]) {
  const r = await get(BASE + p);
  const cards = [...new Set([...r.b.matchAll(/href="(https:\/\/tudorama\.com\/serie\/[a-z0-9-]+\/)"/gi)].map((m) => m[1]))];
  console.log(`\n${p} ${r.s} ${r.b.length}b series=${cards.length}`);
  cards.slice(0, 4).forEach((c) => console.log("   ", c));
  const nx = [...new Set([...r.b.matchAll(/href="([^"]*\/page\/\d+\/)"/gi)].map((m) => m[1]))];
  console.log("   paginación:", nx.slice(0, 3).join("  ") || "-");
}

const s = await get(BASE + "/serie/goblin-10th-aniversario/");
console.log("\n#### ficha", s.s, s.b.length + "b");
for (const k of ["og:title", "og:image", "og:description"]) {
  const m = s.b.match(new RegExp('property="' + k + '"[^>]*content="([^"]*)"', "i"));
  console.log(`  ${k}:`, m ? m[1].slice(0, 90) : "-");
}
const h1 = (s.b.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "";
console.log("  h1:", h1.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90));
const gen = [...new Set([...s.b.matchAll(/href="https:\/\/tudorama\.com\/genero\/([a-z0-9-]+)\/"/gi)].map((m) => m[1]))];
console.log("  generos:", gen.join(" ") || "-");
const desc = (s.b.match(/(?:class="[^"]*(?:sinopsis|desc|argumento|overview)[^"]*"[^>]*>)([\s\S]{0,600}?)<\/(?:p|div)>/i) || [])[1] || "";
console.log("  desc:", desc.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "-");
const eps = [...new Set([...s.b.matchAll(/href="(https:\/\/tudorama\.com\/ver\/[^"]+)"/gi)].map((m) => m[1]))];
console.log("  eps:", eps.length, eps.slice(0, 3).join("  "));
const seasons = [...new Set([...s.b.matchAll(/data-season="(\d+)"/gi)].map((m) => m[1]))];
console.log("  temporadas:", seasons.join(" ") || "-");
