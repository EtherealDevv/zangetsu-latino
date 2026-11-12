const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, h) => {
  const r = await fetch(u, { headers: h || H });
  return { status: r.status, url: r.url, body: await r.text() };
};

const top = await get("https://jkanime.net/top");
console.log("/top anime__item:", (top.body.match(/anime__item/g) || []).length);
const blocks = top.body.split(/class="anime__item"/i);
console.log("blocks:", blocks.length - 1);
console.log(blocks[1]?.replace(/\s+/g, " ").slice(0, 420));

const d = await get("https://jkanime.net/one-piece/");
const ids = [...d.body.matchAll(/(?:anime_id|var\s+id|data-id)\s*[=:]\s*['"]?(\d{2,6})/gi)].map((m) => m[0]);
console.log("\nid hints:", ids.slice(0, 10));
for (const pat of [/ajax\/[^"')\s]{0,60}/gi]) {
  console.log("ajax urls:", [...new Set([...d.body.matchAll(pat)].map((m) => m[0]))].slice(0, 12));
}
const proto = d.body.match(/protocol\s*:\s*['"]([^'"]+)/);
console.log("protocol:", proto && proto[1]);
console.log("related eps block:", (d.body.match(/id="episodes-content"[\s\S]{0,200}/) || [])[0]?.replace(/\s+/g, " "));

// try the classic ajax endpoints with a guessed id from the numeric hint
const maybe = d.body.match(/url\s*:\s*['"]([^'"]*ajax[^'"]*)['"]/gi) || [];
console.log("\nurl: ajax:", maybe.slice(0, 8));

for (const u of [
  "https://jkanime.net/ajax/episodes/21/1/",
  "https://jkanime.net/ajax/pagination_anime/21/1/",
  "https://jkanime.net/ajax/episodes/one-piece/1/",
]) {
  const r = await get(u, { ...H, "X-Requested-With": "XMLHttpRequest", Referer: "https://jkanime.net/one-piece/" });
  console.log(u, "->", r.status, r.body.length, r.body.replace(/\s+/g, " ").slice(0, 200));
}
