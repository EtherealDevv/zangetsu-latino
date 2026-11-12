const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, Referer: "https://wv3.cuevana3.eu/ver-pelicula/the-floaters" };
const get = async (u) => { const r = await fetch(u, { headers: H, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; };
const entries = [
  "https://player.cuevana3.eu/player.php?h=fXuMjvaiA4iZ_F_4aa6TH6oRvbVv3L4stwgYcAyo3yo-",
  "https://player.cuevana3.eu/player.php?h=b4V4QCQH04mLSy2ukvmtf1UShkWlgD60ObeCGHoPp8JZfJSu35ijhk_Lxc8_XuGL",
  "https://player.cuevana3.eu/player.php?h=rxPRsRSX4IlkyS1F21W5j5d0aDuLmOOytnWnDTvccLxeFdqZk5KHSyW7XiiEToPF",
  "https://player.cuevana3.eu/player.php?h=Nt6DnBaJ_hOcjWbELk7u0KO56QYAPqP1yaMWjg2xJcnhUse7PMiXo.AjD1hNYIsz"
];
for (const e of entries) {
  const p = await get(e);
  const m = p.b.match(/var url\s*=\s*['"]([^'"]+)['"]/i);
  const emb = m && m[1];
  const x = emb ? await get(emb) : null;
  console.log("\n", (emb || "NO EMBED").slice(0, 60), x ? `-> ${x.s} len=${x.b.length} final=${x.u.slice(0,50)}` : "");
  if (x) console.log("   packer:", /eval\(function\(p,a,c,k,e,d\)/.test(x.b), "pass_md5:", x.b.includes("pass_md5"), "m3u8:", (x.b.match(/https?:[^"'\\ ]+\.m3u8/g)||[])[0] || "-", "loc:", (x.b.match(/window\.location[^;]{0,80}/)||[])[0] || "-");
}
