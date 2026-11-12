const u = "https://vimeos.net/embed-7t0r7ooe2llz.html";
const r = await fetch(u, { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "Referer": "https://www.cinecalidad.am/" } });
const h = await r.text();
const m = h.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
if (!m) { console.log("no packer"); process.exit(0); }
const [, p, aStr, cStr, kStr] = m;
const a = parseInt(aStr, 10), c = parseInt(cStr, 10), k = kStr.split("|");
let s = p;
const e = (n) => { if (n >= a) return (n < a + 62 ? String.fromCharCode(n + 29) : (n < a + 62 + 26 ? String.fromCharCode(n + 29 + 7) : "_")); return ""; };
for (let i = c - 1; i >= 0; i--) { if (k[i]) s = s.replace(new RegExp("\\b" + i.toString(a) + "\\b", "g"), k[i]); }
console.log(s.slice(0, 2500));
