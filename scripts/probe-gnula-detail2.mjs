const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(25000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

for (const u of ["https://ww3.gnulahd.nu/ver/godzilla-minus-zero/", "https://ww3.gnulahd.nu/ver/los-simpson/"]) {
  const r = await get(u);
  console.log(`\n=== ${u} ${r.s} ${r.b.length}b`);
  console.log("  Movie:", /"@type":"Movie"/.test(r.b), "| TVSeries:", /"@type":"TVSeries"/.test(r.b));
  const cands = [
    ["itemprop desc", /itemprop="description"[^>]*>([\s\S]{0,500}?)<\/(?:p|div|span)>/i],
    ["Sinopsis", /(?:Sinopsis|SINOPSIS)[\s\S]{0,40}?<\/[a-z]+>\s*<[^>]+>([\s\S]{0,600}?)<\//i],
    ["gnrd-fi-syn", /class="[^"]*(?:syn|sinop|desc|plot)[^"]*"[^>]*>([\s\S]{0,600}?)<\//i],
    ["og desc", /property="og:description" content="([^"]*)"/i]
  ];
  for (const [k, re] of cands) {
    const m = r.b.match(re);
    console.log(`  [${k}]`, m ? String(m[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 200) : "-");
  }
}

console.log("\n### paginación");
for (const p of ["https://ww3.gnulahd.nu/ver/peliculas/page/2/", "https://ww3.gnulahd.nu/ver/peliculas/?page=2"]) {
  const r = await get(p);
  const n = (r.b.match(/class="gnrd-card"/g) || []).length;
  const first = (r.b.match(/class="gnrd-card"[^>]*href="([^"]+)"/i) || [])[1] || "-";
  console.log(`  ${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(8)} cards=${String(n).padEnd(3)} ${p}  first=${first.slice(0, 60)}`);
}
