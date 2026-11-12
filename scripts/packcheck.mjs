const r = await fetch("https://vimeos.net/embed-7t0r7ooe2llz.html", { headers: { "User-Agent": "Mozilla/5.0 Chrome/135", "Referer": "https://www.cinecalidad.am/" } });
const h = await r.text();
const m = h.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
console.log("matched", !!m, "a =", m && m[2], "c =", m && m[3]);
