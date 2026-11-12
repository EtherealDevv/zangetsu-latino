// Why does CineCalidad search return 0 for real queries while the harness
// gets 2 for "naruto"? Dump what the search page actually contains.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };

for (const q of ["The Simpsons", "Project Hail Mary", "naruto", "madre"]) {
  const r = await fetch("https://www.cinecalidad.am/?s=" + encodeURIComponent(q), { headers: H });
  const b = await r.text();
  const articles = b.split(/<article\b[^>]*>/i).length - 1;
  const inTitle = (b.match(/in_title/g) || []).length;
  const hrefs = [...new Set([...b.matchAll(/href="(https?:\/\/www\.cinecalidad\.am\/ver-[^"]+)"/g)].map(m => m[1]))];
  console.log(`${q.padEnd(20)} ${r.status} len=${b.length} articles=${articles} in_title=${inTitle} ver-links=${hrefs.length}`);
  if (hrefs.length) console.log("   ", hrefs.slice(0, 3).join("\n    "));
}

const r = await fetch("https://www.cinecalidad.am/?s=The%20Simpsons", { headers: H });
const b = await r.text();
const i = b.search(/ver-(pelicula|serie)/);
console.log("\n=== context around first ver- link ===");
console.log(b.slice(Math.max(0, i - 900), i + 400).replace(/\s+/g, " "));
