// Verificación end-to-end de los dos candidatos viables, con el mismo algoritmo
// que irá en los providers.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { ...H, ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "", err: String(e.cause?.code || e.message) }; }
};

// ── gnulahd: base64 + xor con "gN7d"
function gnrdUnpack(s) {
  const raw = Buffer.from(String(s || ""), "base64");
  const k = [103, 78, 55, 100];
  const out = Buffer.alloc(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw[i] ^ k[i & 3];
  return JSON.parse(out.toString("utf8"));
}

console.log("=== gnulahd ===");
const page = await get("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/");
const pid = (page.b.match(/_gnrdPid\s*=\s*(\d+)/) || [])[1];
const tok = (page.b.match(/_gnrdTok\s*=\s*"([^"]+)"/) || [])[1];
console.log("pid", pid, "tok", tok);
const api = await get(`https://ww3.gnulahd.nu/wp-json/gnrd/v1/player?id=${pid}&t=${tok}`, { Referer: page.u });
let payload = "";
try { payload = JSON.parse(api.b).p || ""; } catch (e) { console.log("api raw:", api.b.slice(0, 80)); }
const data = payload ? gnrdUnpack(payload) : null;
console.log("payload len", String(payload).length, "| keys:", data && typeof data === "object" ? Object.keys(data).join(",") : typeof data);
console.log(JSON.stringify(data).slice(0, 700));

// ── magistv24: trembed -> fastream -> packer -> m3u8
function unpackPacker(s) {
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

console.log("\n=== magistv24 -> fastream ===");
const det = await get("https://magistv24.com/pelicula/proyecto-almanac/");
const trids = [...det.b.matchAll(/trembed=(\d+)&#0?38;trid=(\d+)&trtype=(\d+)/g)].map((m) => ({ n: m[1], id: m[2], t: m[3] }));
console.log("embeds en la página:", trids.length, JSON.stringify(trids.slice(0, 3)));
for (const t of trids.slice(0, 2)) {
  const tr = await get(`https://magistv24.com/?trembed=${t.n}&trid=${t.id}&trtype=${t.t}`, { Referer: det.u });
  const ifr = (tr.b.match(/SRC=["']([^"']+)["']/i) || [])[1];
  console.log(`trembed ${t.n} -> ${ifr || "sin iframe"}`);
  if (!ifr) continue;
  const f = await get(ifr, { Referer: tr.u });
  const code = unpackPacker(f.b);
  const m3 = (code.match(/https?:\\?\/\\?\/[^"'\s\\]+\.m3u8[^"'\s\\]*/i) || [])[0] || "";
  const clean = m3.replace(/\\\//g, "/");
  console.log(`  fastream ${f.s} ${f.b.length}b -> unpacked ${code.length}b | m3u8: ${clean ? clean.slice(0, 90) : "no"}`);
  if (clean) {
    const m = await get(clean, { Referer: ifr });
    console.log(`  master ${m.s} ${m.b.length}b ${m.b.startsWith("#EXTM3U") ? "EXTM3U" : m.b.slice(0, 40)}`);
  }
}
