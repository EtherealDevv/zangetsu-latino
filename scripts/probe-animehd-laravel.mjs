// API de la app de AnimeLatinoHD (Laravel): forma real de las respuestas.
const UA = "okhttp/4.12.0";
const H = { "User-Agent": UA, "Accept": "application/json" };
const B = "https://api.animelatinohd.com/api/";
const get = async (p) => {
  try {
    const r = await fetch(B + p, { headers: H, redirect: "follow", signal: AbortSignal.timeout(15000) });
    const b = await r.text();
    return { s: r.status, b };
  } catch (e) { return { s: 0, b: String(e.cause?.code || e.message) }; }
};
const show = (label, r, n) => {
  console.log(`\n=== ${label}  ${r.s}  ${r.b.length}b`);
  console.log(r.b.replace(/\s+/g, " ").slice(0, n || 400));
};

show("config?v=3.1.1", await get("config?v=3.1.1"), 700);
show("app/home", await get("app/home"), 900);
show("anime/search?search=naruto", await get("anime/search?search=naruto"), 700);
show("anime/list?type=tv&page=1", await get("anime/list?type=tv&page=1"), 500);
show("anime/naruto", await get("anime/naruto"), 900);
show("episodes/naruto/1", await get("episodes/naruto/1"), 1200);
