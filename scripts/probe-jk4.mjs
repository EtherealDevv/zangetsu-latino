const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u, h) => (await fetch(u, { headers: h || H })).text();

const top = await get("https://jkanime.net/top");
const i = top.indexOf("one-piece");
console.log("ctx before link:", top.slice(Math.max(0, i - 900), i + 500).replace(/\s+/g, " "));

const d = await get("https://jkanime.net/one-piece/");
const tok = (d.match(/csrf-token" content="([^"]+)/) || [])[1]
  || (d.match(/name="_token" value="([^"]+)/) || [])[1];
console.log("\ncsrf:", tok);

for (const u of ["https://jkanime.net/ajax/episodes/201/", "https://jkanime.net/ajax/search_episode/201/"]) {
  const r = await fetch(u, {
    method: "POST",
    headers: { ...H, "X-Requested-With": "XMLHttpRequest", Referer: "https://jkanime.net/one-piece/", "Content-Type": "application/x-www-form-urlencoded" },
    body: "_token=" + encodeURIComponent(tok || ""),
  });
  const b = await r.text();
  console.log("\nPOST", u, "->", r.status, b.length);
  console.log(b.replace(/\s+/g, " ").slice(0, 600));
}
