// earnvids/minochinos: el `var links=...` completo y de dónde sale el host.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
  return { s: r.status, b: await r.text(), u: r.url };
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
const page = await get("https://minochinos.com/embed/ujc0y27exkq7", { referer: "https://cdn.tudorama.com/" });
console.log("page", page.s, page.b.length + "b ->", page.u);
const code = unpack(page.b);
console.log("unpack", code.length + "b");
const i = code.indexOf("links");
console.log("\n[links]", code.slice(Math.max(0, i - 300), i + 700).replace(/\s+/g, " "));
for (const k of ["decodedLink", "https", "m3u8", "master", "cdn", "sources"]) {
  const at = code.indexOf(k, i >= 0 ? i : 0);
  if (at > 0) console.log(`\n[${k} @${at}]`, code.slice(Math.max(0, at - 200), at + 300).replace(/\s+/g, " "));
}
console.log("\n--- primeros 1200 del unpack ---");
console.log(code.replace(/\s+/g, " ").slice(0, 1200));
