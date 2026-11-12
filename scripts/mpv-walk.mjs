// Full mpv-like walk: master -> variant -> first segment, with only a libmpv UA.
// Proves the chain is playable by a minimal client (no Referer, no browser UA).
const UA = "libmpv";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "User-Agent": UA, ...(extra || {}) }, redirect: "follow" });
    const ab = await r.arrayBuffer();
    return { s: r.status, u: r.url, type: r.headers.get("content-type"), buf: Buffer.from(ab), len: ab.byteLength };
  } catch (e) { return { s: 0, u, buf: Buffer.alloc(0), len: 0, err: String(e.cause && e.cause.code || e.message) }; }
};

const page = await get("https://www.cinecalidad.am/ver-pelicula/madre-siniestra/");
const emb = (page.buf.toString().match(/data-option="([^"]+)"/) || [])[1];
const embed = await get(emb, { Referer: "https://www.cinecalidad.am/" });
const src = (embed.buf.toString().match(/["']file["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/i) || [])[1];
const master = await get(src);
console.log("master ", master.s, master.len, master.type);
if (master.s !== 200) process.exit(0);
const text = master.buf.toString();
const variant = text.split(/\r?\n/).find(l => l && l[0] !== "#");
console.log("variant url:", variant.slice(0, 80) + "...");
const t0 = Date.now();
const vp = await get(variant);
console.log("variant", vp.s, vp.len, vp.type, `${Date.now() - t0}ms`);
if (vp.s !== 200) process.exit(0);
const vtext = vp.buf.toString();
const lines = vtext.split(/\r?\n/);
console.log("segments in playlist:", lines.filter(l => l && l[0] !== "#").length,
  "| EXTINF:", lines.filter(l => l.startsWith("#EXTINF")).length,
  "| ENDLIST:", vtext.includes("#EXT-X-ENDLIST"),
  "| type:", (vtext.match(/#EXT-X-PLAYLIST-TYPE:(\w+)/) || [])[1] || "-");
const seg = lines.find(l => l && l[0] !== "#");
const segUrl = seg.startsWith("http") ? seg : variant.replace(/[^/]*$/, "") + seg;
const t1 = Date.now();
const sg = await get(segUrl, { Range: "bytes=0-" });
console.log("segment", sg.s, sg.len, "bytes", `${Date.now() - t1}ms`, sg.type);
console.log("ts sync byte:", sg.buf[0] === 0x47 ? "0x47 OK" : "0x" + (sg.buf[0] || 0).toString(16));
