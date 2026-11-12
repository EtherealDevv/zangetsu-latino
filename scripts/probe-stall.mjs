const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u, h) => { try { const r = await fetch(u, { headers: h || { "User-Agent": UA } }); return { s: r.status, u: r.url, b: await r.text(), h: r.headers }; } catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; } };
function unpack(s) {
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i+1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/); if (!m) return s;
  const base = +m[1], count = +m[2];
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const c = rest[j]; if (c === "\\") { dict += rest[j+1]; j += 2; continue; } if (c === "'") break; dict += c; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let res = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) res = res.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return res;
}
const findStream = (code) => { const m = code.match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || code.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/i); return m ? String(m[1] || m[0]).replace(/\\\//g, "/") : ""; };

const page = await get("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/");
const opts = [...page.b.matchAll(/<li[^>]*dooplay_player_option[^>]*>/gi)].map(m => (m[0].match(/data-option="([^"]+)"/) || [])[1]).filter(Boolean).filter(u => !/youtu/i.test(u));
console.log("embeds:", opts);
for (const emb of opts) {
  const p = await get(emb, { "User-Agent": UA, Referer: page.u });
  const s = findStream(unpack(p.b));
  console.log("\nembed", emb, "-> stream:", s ? s.slice(0, 100) : "NONE");
  if (!s) { console.log("  len", p.b.length, "head:", p.b.replace(/\s+/g," ").slice(0,200)); continue; }
  for (const [label, h] of [
    ["UA+Referer(embed)", { "User-Agent": UA, Referer: emb }],
    ["UA solo", { "User-Agent": UA }],
    ["UA+Referer(site)", { "User-Agent": UA, Referer: "https://www.cinecalidad.am/" }],
  ]) {
    const m = await get(s, h);
    console.log(`  ${label}: ${m.s} len=${m.b.length} type=${(m.h && m.h.get && m.h.get("content-type")) || "-"}`);
    if (m.s === 200 && m.b.includes("#EXTM3U")) {
      const v = (m.b.match(/^[^#\s].*$/m) || [])[0];
      if (v) {
        const vu = v.startsWith("http") ? v : s.replace(/[^/]*$/, "") + v;
        const seg = await get(vu, h);
        console.log(`     variant ${vu.slice(-45)} -> ${seg.s} len=${seg.b.length}`);
      }
      break;
    }
  }
}
