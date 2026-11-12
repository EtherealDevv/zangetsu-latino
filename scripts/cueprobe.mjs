const u = "https://wv3.cuevana3.eu/";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } });
const h = await r.text();
const i = h.indexOf("TPost C hentry");
console.log(h.slice(Math.max(0, i - 100), i + 1200).replace(/\s+/g, " "));
console.log("--- forms");
for (const m of h.matchAll(/<form[^>]*>/g)) console.log(m[0]);
console.log("--- search input");
for (const m of h.matchAll(/<input[^>]*name="[^"]*"[^>]*>/g)) { if (/search|buscar|q=/i.test(m[0])) console.log(m[0]); }
const p = await (await fetch("https://wv3.cuevana3.eu/peliculas", { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } })).text();
console.log("--- peliculas len", p.length);
for (const m of p.matchAll(/href="([^"]*(?:page|pagina)[^"]*)"/g)) console.log("  ", m[1]);
