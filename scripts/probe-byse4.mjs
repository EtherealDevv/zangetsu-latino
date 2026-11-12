// byse bundle: quién llama a Gv y con qué (contexto completo de cada llamada).
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B = "https://bysefujedu.com";
const cache = ".sfref/byse-bundle.js";
let b = "";
if (fs.existsSync(cache)) b = fs.readFileSync(cache, "utf8");
if (!b) {
  const pg = await (await fetch(B + "/e/f2rwhq07ydg3", { headers: { "user-agent": UA } })).text();
  const js = [...new Set([...pg.matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => m[1]))].find((x) => /assets\/index-.*\.js/.test(x));
  b = await (await fetch(B + js, { headers: { "user-agent": UA } })).text();
  fs.writeFileSync(cache, b);
}
console.log("bundle", b.length + "b");

const show = (label, re, max = 6, pad = 260) => {
  let m, n = 0;
  console.log(`\n===== ${label}`);
  while ((m = re.exec(b)) !== null && n < max) {
    console.log("  ...", b.slice(Math.max(0, m.index - pad), m.index + pad).replace(/\s+/g, " "), "\n");
    n++;
  }
  if (!n) console.log("  (nada)");
};

show("llamadas Gv(", /Gv\(/g, 8);
show("fetch(", /fetch\(/g, 6, 200);
show("m3u8", /m3u8/g, 4, 300);
show("filecode", /filecode/gi, 3, 300);
console.log("\n===== strings con pinta de ruta api");
const lit = [...new Set([...b.matchAll(/["'`]([a-z][a-z0-9_-]{1,18})["'`]/g)].map((m) => m[1]))];
const api = lit.filter((x) => /^(video|stream|embed|file|resolve|player|media|link|source|watch|info|data|cdn|hls|mp4|get)/.test(x));
console.log(api.join("  "));
