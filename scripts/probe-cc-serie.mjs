const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const r = await fetch("https://www.cinecalidad.am/ver-serie/naruto-shippuden/", { headers: { "User-Agent": UA } });
const h = await r.text();
const i = h.indexOf("numerando");
console.log(h.slice(Math.max(0, i - 700), i + 900).replace(/\s+/g, " "));
console.log("\n-- hrefs with 12x or temporada:");
console.log([...new Set([...h.matchAll(/href="([^"]+)"/g)].map((m) => m[1]).filter((u) => /temporada|12x|capitulo|episodio/i.test(u)))].slice(0, 12));
console.log("\n-- select/option blocks:");
console.log([...h.matchAll(/<select[\s\S]{0,300}?<\/select>/g)].map((m) => m[0].replace(/\s+/g, " ").slice(0, 260)));
