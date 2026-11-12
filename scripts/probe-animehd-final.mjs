// ¿Alguna ruta del sitio escapa del reto de Cloudflare? ¿Y el resolver /stream?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, h) => {
  try {
    const r = await fetch(u, { headers: h || H, redirect: "follow", signal: AbortSignal.timeout(12000) });
    const b = await r.text();
    return { s: r.status, b, st: r.headers.get("cf-mitigated") || "", ct: r.headers.get("content-type") || "" };
  } catch (e) { return { s: 0, b: "", st: String(e.cause?.code || e.message), ct: "" }; }
};
const line = (u, r) => `${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(7)} ${r.st ? "cf:" + r.st : ""} ${r.ct.slice(0, 20).padEnd(22)} ${u.slice(0, 58)}`;

const list = [
  "https://www.animelatinohd.com/robots.txt",
  "https://www.animelatinohd.com/favicon.ico",
  "https://www.animelatinohd.com/_next/static/chunks/pages/_app.js",
  "https://www.animelatinohd.com/sitemap.xml",
  "https://www.animelatinohd.com/animes?page=1",
  "https://api.animelatinohd.com/releases",
  "https://api.animelatinohd.com/api/releases",
  "https://api.animelatinohd.com/stream/1"
];
for (const u of list) console.log(line(u, await get(u)));

console.log("\n-- con cabecera key (la del scraper público) --");
const K = { ...H, "key": "l7z8rIhQDXIH6pl66ZEQgPkNwkDlilgdOHMMWkxkzzE=", "Accept": "application/json" };
for (const u of ["https://api.animelatinohd.com/api/releases", "https://api.animelatinohd.com/api/anime/naruto", "https://api.animelatinohd.com/api/anime/list?type=tv&page=1"]) {
  const r = await get(u, K);
  console.log(line(u, r), "|", r.b.replace(/\s+/g, " ").slice(0, 60));
}
