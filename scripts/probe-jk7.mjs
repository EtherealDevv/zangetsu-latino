const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u) => { const r = await fetch(u, { headers: { "User-Agent": UA } }); return { s: r.status, u: r.url, b: await r.text() }; };
for (const p of ["/directorio", "/directorio?filtro=emision", "/top", "/"]) {
  const r = await get("https://jkanime.net" + p);
  console.log("\n==", p, r.s, r.u, r.b.length, "toplist:", (r.b.match(/class="col toplist|toplist/g)||[]).length, "card:", (r.b.match(/class="card"/g)||[]).length);
  const i = r.b.indexOf("card-img-top");
  if (i > 0) console.log(r.b.slice(Math.max(0, i-320), i+320).replace(/\s+/g," "));
}
