const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const list = [
  "pelispop.com","pelispop.es","pelispop.pw","pelispop.top","pelispop2.com","pelispop.tv","pelispop.net",
  "pelispop.cc","pelispop.to","pelispop.la","pelispop.co","pelispop.online","pelispop.org","pelispop.lat",
  "www.pelispop.com","pelispop.pics","pelispop.xyz","pelispop.click","pelispop.site","pelispop.ink",
  "tudorama.com","www.tudorama.com","tudorama.tv","tudorama.net","tudorama.la","tudorama.org","tudorama.lat","tudorama.es"
];
const one = async (d) => {
  try {
    const r = await fetch("https://" + d, { headers: H, redirect: "follow", signal: AbortSignal.timeout(9000) });
    const b = await r.text();
    const t = ((b.match(/<title[^>]*>([\s\S]{0,70}?)<\/title>/i) || [])[1] || "").replace(/\s+/g, " ").trim();
    return `${d.padEnd(20)} ${String(r.status).padEnd(4)} ${String(b.length).padEnd(8)} ${r.url.slice(0, 38).padEnd(40)} ${t.slice(0, 40)}`;
  } catch (e) { return `${d.padEnd(20)} DEAD ${String(e.cause?.code || e.message).slice(0, 50)}`; }
};
const out = await Promise.all(list.map(one));
console.log(out.join("\n"));
