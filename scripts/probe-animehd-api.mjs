// La web está detrás de Cloudflare, pero api.animelatinohd.com responde.
// Buscar la forma del API que usa la app.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const J = { "User-Agent": UA, "Accept": "application/json, text/plain, */*", "Origin": "https://www.animelatinohd.com", "Referer": "https://www.animelatinohd.com/" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: J, redirect: "follow", signal: AbortSignal.timeout(15000) });
    const b = await r.text();
    return { s: r.status, b, ct: r.headers.get("content-type") || "" };
  } catch (e) { return { s: 0, b: "", ct: String(e.cause?.code || e.message) }; }
};

const paths = [
  "/", "/api", "/api/", "/api/v1", "/api/v1/", "/v1", "/v1/",
  "/api/v1/anime", "/api/anime", "/api/v1/series", "/api/series",
  "/api/v1/home", "/api/home", "/api/v1/search?q=naruto", "/api/search?q=naruto",
  "/api/v1/animes", "/animes", "/api/v1/catalog", "/api/catalog",
  "/api/v1/latest", "/api/v1/popular", "/graphql"
];
for (const p of paths) {
  const r = await get("https://api.animelatinohd.com" + p);
  const head = r.b.replace(/\s+/g, " ").slice(0, 110);
  console.log(`${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(6)} ${p.padEnd(30)} ${head}`);
}
