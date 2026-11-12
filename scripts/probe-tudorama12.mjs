// Tudorama: género peliculas (¿otra ruta?) y resolvers earnvids/pixeldrain en varios episodios.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const BASE = "https://tudorama.com";
const H = { "user-agent": UA, "accept-language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, "accept": "text/html,*/*", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(25000) });
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
function unpack(s) {
  s = String(s);
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i + 1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  const base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const d = rest[j]; if (d === "\\") { dict += rest[j + 1]; j += 2; continue; } if (d === "'") break; dict += d; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let out = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) out = out.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return out;
}

const g = await get(BASE + "/genero/peliculas/");
console.log("/genero/peliculas/", g.s, g.b.length + "b");
const kinds = {};
for (const m of g.b.matchAll(/href="https:\/\/tudorama\.com\/([a-z]+)\/[a-z0-9-]+\/"/gi)) kinds[m[1]] = (kinds[m[1]] || 0) + 1;
console.log("  rutas:", Object.entries(kinds).map(([k, v]) => `${k}(${v})`).join("  "));
const cards = [...new Set([...g.b.matchAll(/href="(https:\/\/tudorama\.com\/(?:serie|pelicula)\/[a-z0-9-]+\/)"/gi)].map((m) => m[1]))];
console.log("  fichas:", cards.slice(0, 4).join("  ") || "-");

console.log("\n### resolvers en episodios latinos");
const eps = [
  "/ver/in-your-radiant-season-s1x2/",
  "/ver/mi-adorable-demonio-s1x3/",
  "/ver/a-love-other-than-yours-s1x1/",
  "/ver/mi-adorable-demonio-s1x8/"
];
for (const e of eps) {
  const epUrl = BASE + e;
  const ep = await get(epUrl);
  const nonce = (ep.b.match(/nonce["']?\s*[:=]\s*["']([a-z0-9]{6,})["']/i) || [])[1];
  const id = (ep.b.match(/(?:post_id|data-id)["']?\s*[:=]\s*["']?(\d{3,})/i) || [])[1];
  let list = [];
  try { list = JSON.parse(await ajax({ action: "corvus_get_servers", nonce, post_id: id }, epUrl)); } catch {}
  const lat = list.filter((x) => x.lang === "es");
  const out = [];
  for (const s of lat) {
    const w = await get(s.url, { referer: epUrl });
    const src = (w.b.match(/iframe\.src\s*=\s*"([^"]+)"/) || [])[1] || "";
    if (!src) continue;
    if (/pixeldrain/.test(src)) {
      const pid = src.split("/").filter(Boolean).pop();
      const info = await get(`https://pixeldrain.com/api/file/${pid}/info`);
      let j = {}; try { j = JSON.parse(info.b); } catch {}
      out.push(`${s.name}: pixeldrain ${info.s} ${j.name || "?"} ${j.mime_type || "?"}`);
      continue;
    }
    const r = await get(src, { referer: w.u });
    const code = unpack(r.b);
    const m = code.match(/["']?hls[2-4]["']?\s*:\s*["']([^"']+)["']/i) || code.match(/file\s*:\s*["']([^"']+\.(?:m3u8|mp4)[^"']*)["']/i);
    out.push(`${s.name}: ${src.split("/")[2]} ${r.s} ${m ? "OK " + m[1].slice(0, 60) : "sin fuente " + r.b.length + "b"}`);
  }
  console.log(`${e}\n   ${out.join("\n   ")}`);
}

console.log("\n### pixeldrain stream (Range)");
const rr = await fetch("https://pixeldrain.com/api/file/MGrURDx9", { headers: { range: "bytes=0-1023", referer: "https://pixeldrain.com/" }, signal: AbortSignal.timeout(20000) });
console.log("  ", rr.status, rr.headers.get("content-type"), rr.headers.get("content-range") || rr.headers.get("content-length"));
