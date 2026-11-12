// earnvids relativo: ¿el /stream/ de minochinos sirve el m3u8 o hay que ir al CDN?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const head = async (u, ref) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, range: "bytes=0-200", referer: ref }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const b = await r.text();
    return { s: r.status, ct: r.headers.get("content-type"), b: b.slice(0, 120).replace(/\s+/g, " "), u: r.url };
  } catch (e) { return { s: 0, b: String(e.cause?.code || e.message), u }; }
};
const urls = [
  "https://minochinos.com/stream/Wxa1kQIFhc26tCSmXU1YVg/hjkrhuihghfvu/1794545300/4109",
  "https://HI3THh5OxxWw.acek-cdn.com/hls2/01/08218/ujc0y27exkq7_h/master.m3u8",
  "https://dD2STLiWT0bC.dramiyos-cdn.com/hls2/01/07475/7bgfu690qw0w_h/master.m3u8"
];
for (const u of urls) {
  const r = await head(u, "https://minochinos.com/");
  console.log(`${r.s} ${r.ct || "-"} ${r.u.slice(0, 70)}\n   ${r.b.slice(0, 100)}`);
}
// el HTML de earnvids: qué variables acompañan a hls2
const page = await fetch("https://minochinos.com/embed/ujc0y27exkq7", { headers: { "user-agent": UA, referer: "https://cdn.tudorama.com/" }, signal: AbortSignal.timeout(20000) });
const b = await page.text();
const i = b.indexOf("hls2");
console.log("\n[hls2 ctx]", b.slice(Math.max(0, i - 500), i + 400).replace(/\s+/g, " "));
