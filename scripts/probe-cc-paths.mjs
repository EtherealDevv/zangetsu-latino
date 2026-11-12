const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
for (const p of ["/", "/peliculas/", "/series/", "/ver-series/", "/page/2/", "/?s=naruto"]) {
  const r = await fetch("https://www.cinecalidad.am" + p, { headers: { "User-Agent": UA } });
  const h = await r.text();
  const items = (h.match(/<article[^>]*class="[^"]*\bitem\b/g) || []).length;
  console.log(p.padEnd(14), r.status, String(h.length).padStart(7), "items:", items);
}
