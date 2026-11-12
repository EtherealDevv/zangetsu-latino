const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const r = await fetch("https://ww3.gnulahd.nu/ver/godzilla-minus-zero/", { headers: H, redirect: "follow" });
const b = await r.text();
console.log("len", b.length, "status", r.status);

const hunters = {
  "h1": /<h1[\s\S]{0,300}?<\/h1>/i,
  "og:title": /property="og:title" content="[^"]*"/i,
  "ldjson": /<script[^>]*ld\+json[^>]*>[\s\S]{0,600}/i,
  "gnrd-title": /class="[^"]*gnrd-[a-z-]*title[^"]*"[\s\S]{0,200}/i,
  "gn-title": /class="[^"]*title[^"]*"[\s\S]{0,160}/i,
  "sinopsis": /class="[^"]*(?:sinopsis|desc|synopsis|overview)[^"]*"[\s\S]{0,300}/i,
  "genre": /"genre"[\s\S]{0,120}/i,
  "og:image": /property="og:image" content="[^"]*"/i
};
for (const [k, re] of Object.entries(hunters)) {
  const m = b.match(re);
  console.log(`\n[${k}]`, m ? m[0].replace(/\s+/g, " ").slice(0, 320) : "-");
}
