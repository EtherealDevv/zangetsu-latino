const u = process.argv[2];
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "Accept-Language": "es-419,es;q=0.9" } });
const h = await r.text();
const out = new Set();
for (const m of h.matchAll(/href="([^"]+)"/g)) {
  const x = m[1];
  if (/serie/i.test(x)) out.add(x);
}
console.log([...out].slice(0, 20).join("\n"));
