// El sitio está tras Cloudflare, pero hay dos hosts de API conocidos:
// api.animelatinohd.com y web.animelatinohd.com (resolver de /video/<enc>).
// La web manda header `key`; probamos ambas con y sin clave.
const KEY = "l7z8rIhQDXIH6pl66ZEQgPkNwkDlilgdOHMMWkxkzzE=";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const base = { "User-Agent": UA, "Accept": "application/json, text/plain, */*" };
const trial = async (u, withKey) => {
  const h = { ...base };
  if (withKey) h["key"] = KEY;
  try {
    const r = await fetch(u, { headers: h, redirect: "follow", signal: AbortSignal.timeout(12000) });
    const b = await r.text();
    return `${String(r.status).padEnd(4)} ${String(b.length).padEnd(6)} ${withKey ? "key" : "---"}  ${b.replace(/\s+/g, " ").slice(0, 90)}`;
  } catch (e) { return `${"DEAD"} ${"      "} ${withKey ? "key" : "---"}  ${String(e.cause?.code || e.message).slice(0, 40)}`; }
};

const paths = [
  "/", "/anime", "/animes", "/anime/naruto", "/anime/popular", "/animes/populares",
  "/search?q=naruto", "/anime/search?q=naruto", "/episode/naruto-1", "/video/test",
  "/api/anime", "/api/v1/anime", "/api/animes", "/api/search?q=naruto"
];
for (const host of ["https://api.animelatinohd.com", "https://web.animelatinohd.com"]) {
  console.log("\n=== " + host);
  for (const p of paths) {
    const a = await trial(host + p, false);
    const b = await trial(host + p, true);
    console.log(`  ${p.padEnd(24)} sin: ${a}`);
    console.log(`  ${"".padEnd(24)} con: ${b}`);
  }
}
