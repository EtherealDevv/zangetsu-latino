const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const h = await (await fetch("https://jkanime.net/top", { headers: { "User-Agent": UA, "Referer": "https://jkanime.net/" } })).text();
const chunks = h.split(/<div class="(?:col toplist[^"]*|mb-4 d-flex[^"]*dir1[^"]*|anime__item[^"]*)"/i);
console.log("chunks:", chunks.length - 1, "len:", h.length);
console.log((chunks[1]||"").replace(/\s+/g," ").slice(0,500));
const c = chunks[1] || "";
console.log("\nhref:", (c.match(/<a[^>]*href="([^"]+)"/i)||[])[1]);
console.log("title:", (c.match(/class="[^"]*card-title[^"]*"[^>]*>([\s\S]*?)<\/(?:h5|div)>/i)||[])[1]);
console.log("cover:", (c.match(/class="[^"]*card-img-top[^"]*"[^>]*src="([^"]+)"/i)||[])[1]);
