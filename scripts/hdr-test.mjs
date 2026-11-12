// Does vimeos care about the headers we hand mpv? Same master, four header sets.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const MASTER = process.argv[2];
if (!MASTER) { console.log("usage: node hdr-test.mjs <master url>"); process.exit(0); }
const cases = [
  ["none", {}],
  ["libmpv UA", { "User-Agent": "libmpv" }],
  ["UA only", { "User-Agent": UA }],
  ["Referer only", { "Referer": "https://vimeos.net/embed-7t0r7ooe2llz.html" }],
  ["UA+Referer", { "User-Agent": UA, "Referer": "https://vimeos.net/embed-7t0r7ooe2llz.html" }],
  ["mpv style", { "User-Agent": UA, "Referer": "https://vimeos.net/embed-7t0r7ooe2llz.html", "Accept": "*/*", "Range": "bytes=0-" }],
];
for (const [name, h] of cases) {
  try {
    const r = await fetch(MASTER, { headers: h });
    const b = await r.text();
    console.log(name.padEnd(15), r.status, "len", b.length, b.startsWith("#EXTM3U") ? "EXTM3U" : b.slice(0, 40).replace(/\s+/g, " "));
  } catch (e) { console.log(name.padEnd(15), "ERR", String(e.cause && e.cause.code || e.message)); }
}
