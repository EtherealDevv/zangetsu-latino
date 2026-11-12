const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const probe = async (q) => {
  const r = await fetch("https://www.cinecalidad.am/?s=" + encodeURIComponent(q), { headers: H });
  const b = await r.text();
  const inTitle = (b.match(/in_title/g) || []).length;
  const hrefs = [...new Set([...b.matchAll(/href="(https?:[^"]+\/ver-(?:pelicula|serie)\/[^"]+)"/g)].map(m => m[1]))];
  console.log(q.padEnd(24), "in_title=" + inTitle, "links=" + hrefs.length, hrefs.slice(0,2).join(" | "));
};
for (const q of ["The Simpsons", "Simpsons", "Los Simpson", "Simpson", "Project Hail Mary", "Hail Mary", "Hail"]) await probe(q);
