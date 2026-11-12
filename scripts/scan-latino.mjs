// Barrido de dominios latinos: cuáles están vivos AHORA y qué plataforma usan.
// Sin directorio fiable, la única verdad es abrir cada uno.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };

const CANDIDATES = [
  // familia cuevana
  "cuevana3.sc", "3cuevana3.org", "dcuevana.pro", "icuevana3.lat", "cuevana3g.pro",
  "cuevana3.ai", "cuevana3.la", "cuevana3.biz", "cuevana3.com.co", "cuevana3.vc",
  "cuevana3.now", "cuevana3.blog", "vercuevana3.com", "cuevana3hd.com",
  // pelisplus / hd
  "pelisplus.tel", "pelisplus2.io", "pelisplus.com.co", "ww3.pelisplus.to", "pelisplus.nz",
  "pelisplushd.lat", "pelisplushd.top", "pelisplushd.lol",
  // repelis
  "repelis.la", "repelistv.cc", "repelisplus.uno", "repelis2.com",
  // pelisflix
  "pelisflix2.uno", "pelisflix.top", "pelisflix.vip", "pelisflix3.com",
  // otros
  "pelisgratis.cc", "pelisgratis.nz", "pelisgratis.tv", "gnula.se", "gnula.com.co",
  "pelismart.tv", "cinehoy.la", "serieslatino.tv", "sololatino.net", "pelispop.pw",
  "pelispedia.tv", "cinefox.net", "verpelis.tel", "pelisjuanita.com"
];

const get = async (u) => {
  try {
    const r = await fetch(u, { headers: H, redirect: "follow", signal: AbortSignal.timeout(9000) });
    const b = await r.text();
    return { s: r.status, u: r.url, b };
  } catch (e) {
    return { s: 0, u, b: "", err: String(e.cause?.code || e.message) };
  }
};

const fingerprint = (b) => {
  const f = [];
  if (/dooplay/i.test(b)) f.push("dooplay");
  if (__NEXT_DATA__check(b)) f.push("nextjs");
  if (/wp-content|wp-json/i.test(b)) f.push("wp");
  if (/streamwish|vidhide|filelions|vidara|voe\.sx|dood|vimeos/i.test(b)) f.push("lockers-embebidos");
  return f.join(",");
};
function __NEXT_DATA__check(b) { return b.includes("__NEXT_DATA__"); }

const pool = 6;
const results = [];
let idx = 0;
async function worker() {
  while (idx < CANDIDATES.length) {
    const d = CANDIDATES[idx++];
    const r = await get("https://" + d);
    const title = ((r.b.match(/<title[^>]*>([\s\S]{0,80}?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim();
    results.push({ d, s: r.s, len: r.b.length, final: r.u, title: title.slice(0, 42), fp: fingerprint(r.b), err: r.err || "" });
  }
}
await Promise.all(Array.from({ length: pool }, worker));
results.sort((a, b) => (b.len - a.len));
for (const r of results) {
  const verdict = r.s === 200 && r.len > 20000 ? "VIVO " : (r.s === 200 ? "dudoso" : "muerto");
  console.log(`${verdict.padEnd(7)} ${r.d.padEnd(22)} ${String(r.s).padEnd(4)} ${String(r.len).padEnd(8)} ${String(r.fp).padEnd(22)} ${r.title || r.err}`);
}
