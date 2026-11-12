const u = process.argv[2];
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "Accept-Language": "es-419,es;q=0.9" } });
const h = await r.text();
console.log("len", h.length);
console.log("--- scripts");
for (const m of h.matchAll(/<script[^>]*src="([^"]+)"/g)) console.log("  ", m[1]);
console.log("--- episode occurrences");
let i = -1, k = 0;
while ((i = h.toLowerCase().indexOf("episode", i + 1)) >= 0 && k < 8) { k++; console.log("  ", h.slice(Math.max(0, i - 120), i + 160).replace(/\s+/g, " ")); }
