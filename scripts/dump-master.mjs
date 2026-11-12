// Show the raw vimeos master: variant + audio rendition lines, and how many
// EXT-X-MEDIA tracks it declares (>=3 makes Zangetsu rewrite it locally).
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, ref) => {
  try {
    const r = await fetch(u, { headers: ref ? { ...H, Referer: ref } : H, redirect: "follow" });
    return { s: r.status, u: r.url, b: await r.text() };
  } catch (e) { return { s: 0, u, b: "" }; }
};
function unpack(s) {
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i + 1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/); if (!m) return s;
  const base = +m[1], count = +m[2];
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const c = rest[j]; if (c === "\\") { dict += rest[j + 1]; j += 2; continue; } if (c === "'") break; dict += c; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let res = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) res = res.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return res;
}
const findStream = (code) => { const m = code.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || code.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/i); return m ? String(m[1] || m[0]).replace(/\\\//g, "/") : ""; };

const page = await get("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/");
const emb = (page.b.match(/data-option="([^"]+)"/) || [])[1];
const p = await get(emb, page.u);
const s = findStream(unpack(p.b));
const abs = /^https?:/.test(s) ? s : "https:" + s.replace(/^\/\//, "//");
const master = await get(abs, emb);
const lines = master.b.split(/\r?\n/);
console.log("master len:", master.b.length, "lines:", lines.length);
console.log("EXT-X-MEDIA count:", lines.filter(l => l.startsWith("#EXT-X-MEDIA")).length);
console.log("EXT-X-STREAM-INF count:", lines.filter(l => l.startsWith("#EXT-X-STREAM-INF")).length);
console.log("--- first 40 lines ---");
for (const l of lines.slice(0, 40)) console.log(l.slice(0, 200));
