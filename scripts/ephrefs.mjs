const u = "https://wv3.cuevana3.eu/ver-serie/merry-berry-love";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "Accept-Language": "es-419,es;q=0.9" } });
const h = await r.text();
console.log("len", h.length);
const out = new Set();
for (const m of h.matchAll(/href="([^"]+)"/g)) if (/episod|temporada|season|ver-/i.test(m[1])) out.add(m[1]);
console.log([...out].slice(0, 25).join("\n"));
