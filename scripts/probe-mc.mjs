const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = { "User-Agent": UA, "Accept-Language": "es-419,es;q=0.9" };
const pg = await (await fetch("https://monoschinos.st/anime/gensou-suikoden-sub-espanol", { headers: H })).text();
console.log("len:", pg.length);
const i = pg.indexOf("caplist");
console.log("caplist ctx:", pg.slice(Math.max(0,i-200), i+420).replace(/\s+/g," "));
const ajax = (pg.match(/data-ajax="([^"]+)"/) || [])[1];
console.log("\ndata-ajax:", ajax);
console.log("episodios links:", [...new Set([...pg.matchAll(/href="([^"]*episodio[^"]*)"/g)].map(m=>m[1]))].slice(0,6));
if (ajax) {
  const r = await fetch(ajax.startsWith("http")?ajax:"https://monoschinos.st"+ajax, { headers: { ...H, Referer: "https://monoschinos.st/anime/gensou-suikoden-sub-espanol", "X-Requested-With": "XMLHttpRequest" } });
  const b = await r.text();
  console.log("\najax:", r.status, r.url, b.length);
  console.log(b.replace(/\s+/g," ").slice(0, 500));
}
