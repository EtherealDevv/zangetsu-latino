// AnimeLatinoHD detrás de Cloudflare: ¿alguna ruta o UA pasa el reto?
const DESK = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const MOB = "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Mobile Safari/537.36";
const FULL = {
  "User-Agent": DESK,
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "es-419,es;q=0.9,en;q=0.8",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "Cache-Control": "no-cache"
};
const get = async (u, h) => {
  try {
    const r = await fetch(u, { headers: h, redirect: "follow", signal: AbortSignal.timeout(18000) });
    const b = await r.text();
    const t = ((b.match(/<title[^>]*>([\s\S]{0,60}?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim();
    return `${String(r.status).padEnd(4)} ${String(b.length).padEnd(7)} ${r.url.slice(0, 52).padEnd(54)} ${t.slice(0, 34)}`;
  } catch (e) { return `DEAD ${String(e.cause?.code || e.message).slice(0, 40)}`; }
};

const targets = [
  ["https://www.animelatinohd.com/", FULL],
  ["https://animelatinohd.com/", FULL],
  ["http://www.animelatinohd.com/", FULL],
  ["https://www.animelatinohd.com/", { ...FULL, "User-Agent": MOB }],
  ["https://www.animelatinohd.com/wp-json/wp/v2/posts?per_page=2", { "User-Agent": DESK, "Accept": "application/json" }],
  ["https://www.animelatinohd.com/anime/naruto", { ...FULL, Referer: "https://www.animelatinohd.com/" }],
  ["https://www.animelatinohd.com/sitemap.xml", { "User-Agent": DESK }],
  ["https://api.animelatinohd.com/", { "User-Agent": DESK, "Accept": "application/json" }]
];
for (const [u, h] of targets) console.log(String(await get(u, h)), " <-", u.slice(0, 66));
