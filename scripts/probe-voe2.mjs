// Voe bounces once to a rotating mirror domain, then serves the real embed.
// Follow the JS redirect by hand (no DOM in QuickJS) and look for the m3u8.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => {
  try { const r = await fetch(u, { headers: H, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; }
  catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; }
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

let url = process.argv[2] || "https://voe.sx/e/lhvwq83jid0h";
for (let hop = 0; hop < 4; hop++) {
  const p = await get(url);
  const next = (p.b.match(/window\.location\.href\s*=\s*'([^']+)'/) || p.b.match(/window\.location\.href\s*=\s*"([^"]+)"/) || [])[1];
  console.log(`hop ${hop}`, p.s, p.b.length, p.u, next ? `-> ${next}` : "(final)");
  if (!next || p.b.length > 5000) {
    const code = unpack(p.b);
    const m3u8 = (code.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/gi) || []);
    const sources = (code.match(/["'](?:file|source|src)["']\s*:\s*["']([^"']+)["']/gi) || []);
    console.log("  m3u8:", m3u8.slice(0, 3));
    console.log("  sources:", sources.slice(0, 3));
    console.log("  packer found:", code !== p.b, "| altcha:", /altcha|widget/i.test(p.b), "| len after unpack:", code.length);
    if (!m3u8.length) console.log("  head:", p.b.replace(/\s+/g, " ").slice(0, 300));
    break;
  }
  url = next;
}
