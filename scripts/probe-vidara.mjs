// Dig into vidara.to — 33KB means a real embed. Find where the stream URL hides.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u, ref) => {
  try { const r = await fetch(u, { headers: ref ? { "User-Agent": UA, Referer: ref } : { "User-Agent": UA }, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; }
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
const p = await get(process.argv[2] || "https://vidara.to/e/Yf1BfKUc0oMjG");
const code = unpack(p.b);
console.log("status", p.s, "len", p.b.length, "| unpacked", code.length, "| packer:", code !== p.b);
console.log("m3u8 in raw:", (p.b.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/gi) || []).slice(0, 3));
console.log("m3u8 in unpacked:", (code.match(/https?:\/\/[^"'\\\s]+\.m3u8[^"'\\\s]*/gi) || []).slice(0, 3));
for (const kw of ["eval(", "jwplayer", "sources", "file:", "atob", "p,a,c,k,e,d", "packed", "hls", "master"]) {
  const i = code.indexOf(kw);
  if (i >= 0) console.log(`\n[${kw}] @${i}:`, code.slice(Math.max(0, i - 120), i + 260).replace(/\s+/g, " "));
}
