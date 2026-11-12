const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u) => {
  const r = await fetch(u, { headers: { "User-Agent": UA } });
  return { status: r.status, url: r.url, body: await r.text() };
};

const t = await get("https://jkanime.net/top");
console.log("/top", t.status, t.url, t.body.length);
console.log("title:", (t.body.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
console.log("headings:", [...t.body.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi)].map((m) => m[1].replace(/<[^>]*>/g, "").trim()).slice(0, 10));
console.log("anime links:", [...new Set([...t.body.matchAll(/href="(https:\/\/jkanime\.net\/[a-z0-9-]+\/)"/g)].map((m) => m[1]))].slice(0, 8));
console.log("classes:", [...new Set([...t.body.matchAll(/class="([a-z0-9_ -]{3,40})"/gi)].map((m) => m[1]))].slice(0, 25));

const d = await get("https://jkanime.net/one-piece/");
const i = d.body.indexOf('id="uep"');
console.log("\nuep ctx:", d.body.slice(Math.max(0, i - 200), i + 200).replace(/\s+/g, " "));
console.log("\nepisode list classes:", [...new Set([...d.body.matchAll(/class="([a-z0-9_ -]{3,40})"/gi)].map((m) => m[1]))].filter((c) => /ep|cap|list|pagin/i.test(c)).slice(0, 20));
const eps = [...new Set([...d.body.matchAll(/href="(https:\/\/jkanime\.net\/one-piece\/(\d+)\/?)"/g)].map((m) => m[2]))];
console.log("episode numbers on page:", eps.length, eps.slice(0, 5), "max:", Math.max(...eps.map(Number)));
