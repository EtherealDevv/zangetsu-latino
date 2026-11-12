// Deep probe: follow the Voe client-side redirect and pull StreamWish's player bundle.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

async function get(url, ref) {
  const r = await fetch(url, { headers: { "User-Agent": UA, "Referer": ref || url, "Accept-Language": "es-419,es;q=0.9" } });
  return { body: await r.text(), url: r.url, status: r.status };
}

const voe = await get("https://voe.sx/e/a85fx82czpxx");
const target = (voe.body.match(/window\.location\.href = '([^']+)'/) || [])[1];
console.log("voe redirect ->", target);
if (target) {
  const page = await get(target, "https://voe.sx/");
  const b = page.body;
  console.log("final", page.status, b.length);
  console.log("packer:", /eval\(function\(p,a,c,k,e,d\)/.test(b));
  console.log("json scripts:", (b.match(/<script[^>]*type="application\/json"[^>]*>/g) || []).length);
  console.log("m3u8:", (b.match(/[^"'\\ ]+\.m3u8[^"'\\ ]*/g) || []).slice(0, 4));
  console.log("mp4:", (b.match(/[^"'\\ ]+\.mp4[^"'\\ ]*/g) || []).slice(0, 4));
  console.log("BODY:", b.replace(/\s+/g, " ").slice(0, 2200));
}

const sw = await get("https://streamwish.to/main.js?v=1.1.9", "https://streamwish.to/");
console.log("\nmain.js", sw.status, sw.body.length);
const js = sw.body;
console.log("packer:", /eval\(function\(p,a,c,k,e,d\)/.test(js));
console.log("m3u8 in js:", (js.match(/[^"'\\ ]+\.m3u8[^"'\\ ]*/g) || []).slice(0, 4));
console.log("file:", (js.match(/["']file["']\s*:\s*["'][^"']+["']/g) || []).slice(0, 4));
console.log("head:", js.replace(/\s+/g, " ").slice(0, 900));
