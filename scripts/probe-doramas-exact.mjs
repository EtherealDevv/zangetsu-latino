// doramasflix: un solo POST con varios root fields aliaseados = lookup exacto multiple.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const API = "https://sv1.fluxcedene.net/api/gql";
const SITE = "https://doramasflix.in";

const post = async (body) => {
  const r = await fetch(API, {
    method: "POST",
    headers: { "User-Agent": UA, "Accept": "application/json, text/plain, */*", "Content-Type": "application/json", "Origin": SITE, "Referer": SITE + "/", "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "", "x-access-platform": "doramasflix" },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000),
  });
  const t = await r.text();
  return { status: r.status, text: t };
};

const gq = (s) => '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
const titles = ["In Your Radiant Season", "En tu temporada más brillante", "Marry My Husband"];

let q = "query exact {";
let n = 0;
const map = [];
for (const t of titles) {
  for (const [kind, pag] of [["Dorama", "paginationDorama"], ["Movie", "paginationMovie"]]) {
    for (const field of ["name", "name_es"]) {
      const alias = "x" + n++;
      q += ` ${alias}: ${pag}(page:1, perPage:2, filter:{${field}: ${gq(t)}}) { items { name name_es slug } }`;
      map.push([alias, kind, field, t]);
    }
  }
}
q += " }";

const t0 = Date.now();
const res = await post({ operationName: "exact", variables: {}, query: q });
console.log(`HTTP ${res.status} en ${Date.now() - t0}ms | ${res.text.length}b`);
let j = null;
try { j = JSON.parse(res.text); } catch (e) { console.log(res.text.slice(0, 300)); process.exit(0); }
if (j.errors) console.log("errors:", j.errors.map((e) => e.message).join(" | ").slice(0, 200));
for (const [alias, kind, field, t] of map) {
  const items = (j.data && j.data[alias] && j.data[alias].items) || [];
  if (items.length) console.log(`${kind}.${field} "${t}" -> ${items.map((x) => x.name + " | " + x.name_es + " | " + x.slug).join(" · ")}`);
}
