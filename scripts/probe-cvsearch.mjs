const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const get = async (u) => { try { const r = await fetch(u, { headers: H, redirect: "follow" }); return { s: r.status, u: r.url, b: await r.text() }; } catch (e) { return { s: 0, u, b: "" }; } };
const pp = (b) => { const m = b.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/); if (!m) return null; try { return JSON.parse(m[1]).props.pageProps; } catch { return null; } };
const count = (b) => { const p = pp(b); if (!p) return "no-pp"; const k = Object.keys(p); const arr = []; for (const key of k) if (Array.isArray(p[key])) arr.push(key + "=" + p[key].length); return arr.join(" "); };
for (const path of ["/?q=resident+evil", "/buscar?q=resident+evil", "/search?q=resident+evil", "/peliculas?q=resident+evil"]) {
  const r = await get("https://wv3.cuevana3.eu" + path);
  console.log(path.padEnd(30), r.s, "len", r.b.length, "|", count(r.b));
}
