// AnimeLatinoHD: qué plataforma es, cómo busca y por dónde saca el player.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

const base = "https://www.animelatinohd.com";
const home = await get(base + "/");
console.log("home", home.s, home.b.length + "b", home.u);
const title = ((home.b.match(/<title[^>]*>([\s\S]{0,80}?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim();
console.log("title:", title);
const marks = [];
if (/wp-content/.test(home.b)) marks.push("wp");
if (/__NEXT_DATA__/.test(home.b)) marks.push("next");
if (/dooplay/i.test(home.b)) marks.push("dooplay");
if (/laravel|csrf-token/i.test(home.b)) marks.push("laravel");
if (/livewire/.test(home.b)) marks.push("livewire");
console.log("stack:", marks.join(",") || "?");

const hrefs = [...new Set([...home.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))];
const patterns = {};
for (const h of hrefs) {
  const k = (h.match(/\/([a-z-]{3,})\//i) || [])[1];
  if (k) patterns[k] = (patterns[k] || 0) + 1;
}
console.log("rutas:", Object.entries(patterns).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => `${k}(${v})`).join(" "));
console.log("ejemplos:", hrefs.filter((h) => /\/[a-z-]+\/[a-z0-9-]{6,}/i.test(h)).slice(0, 6).join("\n  "));
const apiish = [...new Set([...home.b.matchAll(/["'](\/[a-z0-9/_.-]*(?:api|ajax)[a-z0-9/_.?=&-]*)["']/gi)].map((m) => m[1]))].slice(0, 6);
console.log("api:", apiish.join("  ") || "-");

const srch = await get(base + "/buscar?q=naruto");
const srch2 = await get(base + "/?s=naruto");
console.log("\nsearch /buscar?q :", srch.s, srch.b.length + "b", "| /?s= :", srch2.s, srch2.b.length + "b");
const sh = [...new Set([...srch2.b.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]))].filter((h) => /\/[a-z-]+\/[a-z0-9-]{6,}/i.test(h) && !/genero|category|tag|page/i.test(h));
console.log("  hits:", sh.slice(0, 6).join("\n    ") || "-");
