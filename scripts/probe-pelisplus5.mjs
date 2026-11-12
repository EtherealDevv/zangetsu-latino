// ¿Los episodios tienen mp4 real o solo el relleno de GitHub?
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0 Safari/537.36";
const get = async (u) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", referer: "https://pelisplus2.vip/" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text() };
  } catch (e) { return { s: 0, b: "" }; }
};
const eps = [
  "/serie/456-10-5/los-simpson/play/",
  "/serie/456-12-3/los-simpson/play/",
  "/serie/456-20-10/los-simpson/play/",
  "/serie/456-30-2/los-simpson/play/",
  "/serie/158101-1-1/unspun-world-with-john-simpson/play/"
];
for (const p of eps) {
  const r = await get("https://pelisplus2.vip" + p);
  const m = (r.b.match(/player\.src\(\{\s*src:\s*'([^']+)'/) || [])[1] || "";
  console.log(p.padEnd(56), r.s, (m ? m.slice(0, 78) : "SIN SRC").padEnd(80), r.b.length + "b");
}
