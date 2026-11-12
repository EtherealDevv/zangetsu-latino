// How does vidara build `t` (the object with streaming_url)?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const get = async (u, ref) => {
  try { const r = await fetch(u, { headers: ref ? { "User-Agent": UA, Referer: ref } : { "User-Agent": UA }, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; }
  catch (e) { return { s: 0, u, b: "", err: String(e.cause && e.cause.code || e.message) }; }
};
const p = await get(process.argv[2] || "https://vidara.to/e/Yf1BfKUc0oMjG");
const b = p.b;
let i = -1;
while ((i = b.indexOf("streaming_url", i + 1)) >= 0) {
  console.log(`\n@${i}:`, b.slice(Math.max(0, i - 400), i + 200).replace(/\s+/g, " "));
}
console.log("\n=== api-ish strings ===");
for (const kw of ["/api/", "fetch(", "XMLHttpRequest", "getSources", "var t=", "let t=", "const t=", "data-src", "hlswish", "GET"]) {
  const k = b.indexOf(kw);
  if (k >= 0) console.log(`[${kw}] @${k}:`, b.slice(Math.max(0, k - 100), k + 220).replace(/\s+/g, " ").slice(0, 320));
}
