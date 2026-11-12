const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

console.log("### gnulahd /ver/peliculas/ markup");
const p = await get("https://ww3.gnulahd.nu/ver/peliculas/");
const i = p.b.indexOf("/ver/godzilla");
console.log(p.b.slice(Math.max(0, i - 1200), i + 400).replace(/\s+/g, " "));

console.log("\n\n### gnulahd buscador markup");
const q = await get("https://ww3.gnulahd.nu/?s=naruto");
const j = q.b.indexOf("/ver/naruto/");
console.log(j > 0 ? q.b.slice(Math.max(0, j - 900), j + 300).replace(/\s+/g, " ") : "no hay /ver/naruto/");

console.log("\n\n### gnulahd serie: lista de episodios");
const s = await get("https://ww3.gnulahd.nu/ver/los-simpson/");
for (const k of ["episodedl", "eplister", "bsx", "epwrapper", "bixbox"]) {
  console.log(`  ${k}: ${(s.b.match(new RegExp(k, "g")) || []).length}`);
}
const k2 = s.b.indexOf("class=\"bixbox episodedl");
console.log("\nepisodedl ctx:", k2 > 0 ? s.b.slice(k2, k2 + 900).replace(/\s+/g, " ") : "-");
const k3 = s.b.search(/Temporada\s*1/);
console.log("\nTemporada 1 ctx:", k3 > 0 ? s.b.slice(Math.max(0, k3 - 600), k3 + 400).replace(/\s+/g, " ") : "-");

console.log("\n\n### magistv24 scripts");
const m = await get("https://magistv24.com/serie/los-simpson/");
const srcs = [...new Set([...m.b.matchAll(/<script[^>]*src="([^"]+)"/gi)].map((x) => x[1]))];
console.log(srcs.join("\n  "));
const inline = [...m.b.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]{0,400}?)<\/script>/gi)]
  .map((x) => x[1]).filter((x) => /season|temp|ajax/i.test(x));
console.log("\ninline con season/ajax:", inline.length);
inline.slice(0, 2).forEach((x) => console.log("---\n" + x.replace(/\s+/g, " ").slice(0, 500)));
