const [url, needle, spanArg] = process.argv.slice(2);
const span = parseInt(spanArg || "900", 10);
const res = await fetch(url, {headers:{"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/135.0.0.0 Safari/537.36","Accept-Language":"es-419,es;q=0.9"}});
const html = await res.text();
let i = html.indexOf(needle);
if (i < 0) { console.log("not found:", needle); process.exit(0); }
console.log(`found at ${i} of ${html.length}`);
console.log(html.slice(Math.max(0, i - span), i + span).replace(/\s+/g, " "));
