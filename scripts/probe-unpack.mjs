// Unpack each packed embed and look for a playable URL; dump small bodies whole.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

async function get(url, ref) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": ref || url }, redirect: "follow" });
    return { body: await r.text(), url: r.url, status: r.status };
  } catch (e) { return { body: "", url, status: 0 }; }
}

function unpack(s) {
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, out = "";
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") { out += s[i + 1]; i += 2; continue; }
    if (c === "'") break;
    out += c; i++;
  }
  const p = out;
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  const base = +m[1], count = +m[2];
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) {
    const c = rest[j];
    if (c === "\\") { dict += rest[j + 1]; j += 2; continue; }
    if (c === "'") break;
    dict += c; j++;
  }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let res = p;
  for (let k = count - 1; k >= 0; k--) {
    if (words[k]) res = res.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  }
  return res;
}

const targets = process.argv.slice(2);
for (const t of targets) {
  const r = await get(t);
  const b = r.body;
  console.log(`\n=== ${t}\n status=${r.status} len=${b.length} final=${r.url}`);
  if (b.length < 2000) { console.log(b.replace(/\s+/g, " ")); continue; }
  const u = unpack(b);
  const urls = [...new Set((u.match(/https?:\/\/[^"'\\ <)]+/g) || []).filter((x) => /\.(m3u8|mp4)|master|playlist|stream/i.test(x)))];
  console.log(" packer:", /eval\(function\(p,a,c,k,e,d\)/.test(b), "unpacked len:", u.length);
  console.log(" candidates:", urls.slice(0, 8));
  if (!urls.length) console.log(" unpacked head:", u.replace(/\s+/g, " ").slice(0, 700));
}
