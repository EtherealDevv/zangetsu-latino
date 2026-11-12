import * as cheerio from "cheerio";
const url = process.argv[2];
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
const pats = ["__NEXT_DATA__","self.__next_f","m3u8","streamwish","filemoon","voe.sx","dood","player","embed","servers","sources","videoUrl","link"];
for (const p of pats) {
  const idx = [];
  let i = -1;
  while ((i = html.indexOf(p, i + 1)) >= 0 && idx.length < 4) idx.push(i);
  console.log(`\n### ${p}  x${(html.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),"g"))||[]).length}`);
  for (const k of idx) console.log("   ..." + html.slice(Math.max(0,k-220), k+320).replace(/\s+/g," ") + "...");
}
