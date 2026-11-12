const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u) => (await fetch(u, { headers: { "User-Agent": UA } })).text();

for (const p of ["/", "/?s=naruto"]) {
  const h = await get("https://www.cinecalidad.am" + p);
  const parts = h.split(/<article\b[^>]*>/i);
  console.log(`\n=== ${p} articles=${parts.length - 1}`);
  console.log(parts[1].replace(/\s+/g, " ").slice(0, 700));
  console.log("--- alt article ---");
  console.log((parts[2] || "").replace(/\s+/g, " ").slice(0, 400));
}
