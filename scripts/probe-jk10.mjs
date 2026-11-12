const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const h = await (await fetch("https://jkanime.net/top", { headers: { "User-Agent": UA } })).text();
const i = h.indexOf("col toplist");
console.log("idx:", i);
console.log(JSON.stringify(h.slice(i - 40, i + 60)));
console.log("test1:", /<div class="col toplist/.test(h));
console.log("test2:", /col toplist/.test(h));
