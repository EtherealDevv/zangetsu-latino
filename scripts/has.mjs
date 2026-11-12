const url = process.argv[2];
const need = process.argv.slice(3);
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
console.log("len", html.length, "status", res.status);
for (const n of need) {
  console.log(`\n##### ${n}`);
  let i=-1,k=0;
  while ((i=html.indexOf(n,i+1))>=0 && k<5) { k++; console.log("  ..."+html.slice(Math.max(0,i-200),i+360).replace(/\s+/g," ")+"..."); }
}
