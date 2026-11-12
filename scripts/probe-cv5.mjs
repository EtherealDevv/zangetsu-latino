const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const r = await fetch("https://wv3.cuevana3.eu/", { headers: H });
const b = await r.text();
const hrefs = [...new Set([...b.matchAll(/href="(\/[^"#?]{2,80})"/g)].map(m => m[1]))];
console.log("hrefs:", hrefs.filter(u => !/^\/_next/.test(u)).slice(0, 30));
