const u = "https://jkanime.net/top";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } });
const h = await r.text();
const out = new Set();
for (const m of h.matchAll(/href="([^"]+)"/g)) if (/jkanime\.net\/[a-z0-9-]+\/?$/i.test(m[1]) && !/\/top|\/dash|\/usuario|\/directorio|\/buscar|\/pedidos|\/historial/.test(m[1])) out.add(m[1]);
console.log("links", out.size, [...out].slice(0,10).join("\n"));
console.log("--- api probes");
for (const p of ["/api/last_episodes","/api/ultimos_episodios","/api/top","/api/animes?p=1","/api/directorio?p=1"]) {
  const rr = await fetch("https://jkanime.net" + p, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "X-Requested-With": "XMLHttpRequest", "Accept": "application/json" } });
  const t = await rr.text();
  console.log(p, rr.status, rr.headers.get("content-type"), t.slice(0, 160).replace(/\s+/g," "));
}
