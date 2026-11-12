for (const u of ["https://wv3.cuevana3.eu/?q=naruto", "https://wv3.cuevana3.eu/buscar?q=naruto", "https://wv3.cuevana3.eu/buscar/naruto"]) {
  const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } });
  const h = await r.text();
  const n = (h.match(/TPost C hentry/g) || []).length;
  console.log(u, r.status, h.length, "cards", n, "title", (h.match(/<title>([^<]*)/) || [])[1]);
}
