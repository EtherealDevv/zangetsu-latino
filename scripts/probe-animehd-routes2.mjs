// api.animelatinohd.com/api responde a config pero 404 al resto: qué prefijo
// y qué forma esperan las rutas de catálogo.
const UA = "okhttp/4.12.0";
const H = { "User-Agent": UA, "Accept": "application/json" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(12000) });
    const b = await r.text();
    return `${String(r.status).padEnd(4)} ${String(b.length).padEnd(7)} ${b.replace(/\s+/g, " ").slice(0, 80)}`;
  } catch (e) { return `DEAD ${String(e.cause?.code || e.message).slice(0, 30)}`; }
};

const cands = [
  "https://api.animelatinohd.com/api/anime",
  "https://api.animelatinohd.com/api/animes",
  "https://api.animelatinohd.com/api/home",
  "https://api.animelatinohd.com/api/app",
  "https://api.animelatinohd.com/api/v2/app/home",
  "https://api.animelatinohd.com/api/v2/anime/search?search=naruto",
  "https://api.animelatinohd.com/api/v1/anime/search?search=naruto",
  "https://api.animelatinohd.com/api/anime/search?search=naruto&v=3.1.1",
  "https://api.animelatinohd.com/api/app/home?v=3.1.1",
  "https://api.animelatinohd.com/api/config",
  "https://api.animelatinohd.com/api/config?v=4.0.0",
  "https://api.animelatinohd.com/api/auth/token"
];
for (const u of cands) console.log(String(await get(u)).padEnd(96), u.replace("https://api.animelatinohd.com/api/", ""));
