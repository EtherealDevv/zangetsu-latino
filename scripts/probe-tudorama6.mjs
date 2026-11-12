// Tudorama: qué series tienen servidores latinos (es) y cuántos episodios.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
const ajax = async (fields, ref) => {
  const r = await fetch(BASE + "/wp-admin/admin-ajax.php", {
    method: "POST",
    headers: { ...H, "content-type": "application/x-www-form-urlencoded", origin: BASE, referer: ref, "x-requested-with": "XMLHttpRequest", accept: "application/json, text/javascript, */*; q=0.01" },
    body: new URLSearchParams(fields).toString(), signal: AbortSignal.timeout(20000)
  });
  return await r.text();
};

const home = await get(BASE + "/");
console.log("home", home.s, home.b.length + "b");
const series = [...new Set([...home.b.matchAll(/href="(https:\/\/tudorama\.com\/serie\/[a-z0-9-]+\/)"/gi)].map((m) => m[1]))];
console.log("series en home:", series.length, series.slice(0, 6).join("  "));

// tipo de tarjeta del home
const i = home.b.search(/class="[^"]*(?:lep|post|card|item)[^"]*"/i);
console.log("\nctx tarjeta:", home.b.slice(i, i + 600).replace(/\s+/g, " "));

let found = 0;
for (const s of series.slice(0, 8)) {
  const slug = s.replace(/\/$/, "").split("/").pop();
  const p = await get(s);
  const eps = [...new Set([...p.b.matchAll(new RegExp('href="(https://tudorama\\.com/ver/' + slug + '-s\\d+x\\d+/)"', "gi"))].map((m) => m[1]))];
  console.log(`\n${slug}: ${eps.length} eps`);
  // probar hasta 6 episodios buscando servidores es
  for (const e of eps.slice(0, 6)) {
    const ep = await get(e);
    const nonce = (ep.b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
    const id = (ep.b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
    if (!nonce || !id) { console.log("   sin nonce/id", e); continue; }
    const raw = await ajax({ action: "corvus_get_servers", nonce, post_id: id }, e);
    let list = []; try { list = JSON.parse(raw); } catch {}
    if (!Array.isArray(list)) { console.log("   ajax raro", raw.slice(0, 80)); continue; }
    const langs = [...new Set(list.map((x) => x.lang))].join(",");
    const lat = list.filter((x) => x.lang === "es").map((x) => x.name);
    console.log(`   ${e.split("/").pop()} -> ${list.length} [${langs}]${lat.length ? " LAT: " + lat.join(",") : ""}`);
    if (lat.length) found++;
  }
}
console.log("\nepisodios con lat:", found);
