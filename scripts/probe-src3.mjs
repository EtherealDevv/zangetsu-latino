// ¿Hay una tercera fuente latina cuyos mirrors NO sean la infra muerta de
// streamwish/filelions? Catálogo primero, hosts después.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try { const r = await fetch(u, { headers: H, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; }
  catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; }
};
const sites = ["https://www.pelisplushd.biz", "https://pelisplushd.nz", "https://pelisplushd.to", "https://gnula.nu", "https://www.pelisplus.lat", "https://seriesflix.la"];
for (const s of sites) {
  const r = await get(s);
  const title = (r.b.match(/<title[^>]*>([\s\S]{0,60})/i) || [])[1] || "";
  console.log(s.padEnd(30), String(r.s).padEnd(4), String(r.b.length).padEnd(8), r.u.slice(0, 40).padEnd(42), title.replace(/\s+/g, " ").trim().slice(0, 40));
}
