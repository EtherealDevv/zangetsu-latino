// byse (clones streamwish): los endpoints reales que llama el bundle.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const b = await (await fetch("https://bysefujedu.com/assets/index-DocunfmE.js", { headers: { "user-agent": UA, referer: "https://bysefujedu.com/" }, signal: AbortSignal.timeout(30000) })).text();
console.log("bundle", b.length + "b");
const calls = [...new Set([...b.matchAll(/Gv\(\s*["'`]([^"'`]+)["'`]/g)].map((m) => m[1]))];
console.log("Gv endpoints:", calls.join("  ") || "-");
// otras llamadas con plantilla
const tpl = [...new Set([...b.matchAll(/["'`](api\/[a-z0-9/_${}.-]{2,40})["'`]/gi)].map((m) => m[1]))];
console.log("api/*:", tpl.slice(0, 20).join("  ") || "-");
// el host base del api
for (const k of ["gp=", "const gp", "VITE_", "apiBase", "API_BASE"]) {
  const i = b.indexOf(k);
  if (i > 0) console.log(`\n[${k}]`, b.slice(Math.max(0, i - 250), i + 350).replace(/\s+/g, " "));
}
