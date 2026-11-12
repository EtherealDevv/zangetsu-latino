// GnulaHD: /wp-json/gnrd/v1/player?id=&t= devuelve un payload empaquetado.
// Magistv24: ?trembed=N -> iframe a fastream. Comprobar si alguno da HLS vivo.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(18000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};
function unpack(payload) {
  const s = String(payload || "");
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, p = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { p += s[i + 1]; i += 2; continue; } if (c === "'") break; p += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/); if (!m) return s;
  const base = +m[1], count = +m[2];
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const c = rest[j]; if (c === "\\") { dict += rest[j + 1]; j += 2; continue; } if (c === "'") break; dict += c; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let res = p;
  for (let k = count - 1; k >= 0; k--) if (words[k]) res = res.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return res;
}

console.log("=== gnulahd ===");
const page = await get("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/");
const pid = (page.b.match(/_gnrdPid\s*=\s*([^;]+);/) || [])[1] || (page.b.match(/id=([0-9]+)&t=/) || [])[1];
const tok = (page.b.match(/_gnrdTok\s*=\s*'([^']*)'/) || [])[1] || (page.b.match(/t=([^&"']+)/) || [])[1];
console.log("pid:", pid, "tok:", String(tok).slice(0, 30));
const keysAround = page.b.slice(Math.max(0, page.b.indexOf("_gnrdPid") - 200), page.b.indexOf("_gnrdPid") + 300).replace(/\s+/g, " ");
console.log("ctx:", keysAround);
if (pid) {
  const api = await get(`https://ww3.gnulahd.nu/wp-json/gnrd/v1/player?id=${encodeURIComponent(pid)}&t=${encodeURIComponent(tok || "")}`, { Referer: page.u });
  console.log("api:", api.s, api.b.length);
  let payload = "";
  try { payload = JSON.parse(api.b).p || ""; } catch (e) { payload = api.b.slice(0, 120); }
  console.log("payload head:", String(payload).slice(0, 120));
  const html = unpack(payload);
  const srcs = [...new Set([...html.matchAll(/src=["']([^"']+)["']/g)].map((m) => m[1]))].slice(0, 4);
  console.log("unpacked len:", html.length, "| srcs:", srcs.join(" | ") || "-");
  for (const s of srcs.slice(0, 2)) {
    const full = s.startsWith("//") ? "https:" + s : s;
    const r = await get(full, { Referer: page.u });
    const m3 = (r.b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || "";
    console.log(`  src ${String(r.s).padEnd(4)} ${String(r.b.length).padEnd(7)} ${String((r.u.match(/^https?:\/\/([^/]+)/) || [])[1] || r.u).slice(0, 30)} ${m3 ? "m3u8 " + m3.slice(0, 55) : ""}`);
  }
}

console.log("\n=== magistv24 ===");
const tr = await get("https://magistv24.com/?trembed=0&trid=39856&trtype=1", { Referer: "https://magistv24.com/pelicula/proyecto-almanac/" });
console.log("trembed:", tr.s, tr.b.length);
console.log(tr.b.replace(/\s+/g, " ").slice(0, 700));
const ifr = (tr.b.match(/<iframe[^>]*src=["']([^"']+)/i) || [])[1];
if (ifr) {
  const f = await get(ifr.startsWith("//") ? "https:" + ifr : ifr, { Referer: tr.u });
  console.log(`  fastream ${f.s} ${f.b.length}b ${(f.b.match(/https?:[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || ""}`);
}
