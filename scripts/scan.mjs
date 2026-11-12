const url = process.argv[2];
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
for (const needle of ["directorio","fetch(","$.ajax","axios",".get(","api/"]) {
  console.log(`\n##### ${needle}`);
  let i=-1, n=0;
  while ((i = html.indexOf(needle, i+1)) >= 0 && n < 8) { n++;
    console.log("  ...", html.slice(Math.max(0,i-160), i+220).replace(/\s+/g," "), "...");
  }
}
console.log("\n##### inline scripts with src");
for (const m of html.matchAll(/<script[^>]*src="([^"]+)"/g)) console.log("  ", m[1]);
