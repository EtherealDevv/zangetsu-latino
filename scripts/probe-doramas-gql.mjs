// doramasflix: como ordena searchAll, si acepta regex sobre name_es y si el slug resuelve.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const API = "https://sv1.fluxcedene.net/api/gql";
const SITE = "https://doramasflix.in";

const gql = async (op, vars, query) => {
  const r = await fetch(API, {
    method: "POST",
    headers: {
      "User-Agent": UA, "Accept": "application/json, text/plain, */*", "Content-Type": "application/json",
      "Origin": SITE, "Referer": SITE + "/", "platform": "doramasflix",
      "authorization": "Bear", "x-access-jwt-token": "", "x-access-platform": "doramasflix",
    },
    body: JSON.stringify({ operationName: op, variables: vars, query }),
    signal: AbortSignal.timeout(20000),
  });
  const t = await r.text();
  let j = null;
  try { j = JSON.parse(t); } catch (e) {}
  if (!j || j.errors) console.log(`  [${op}] HTTP ${r.status} err:`, (j && j.errors && j.errors[0] && j.errors[0].message || t.slice(0, 120)));
  return j && j.data;
};

const Q = "_id name name_es slug poster_path";

for (const q of ["En tu mejor momento", "en tu temporada mas brillante", "Cásate con mi esposo", "La gloria"]) {
  const d = await gql("searchAll", { input: q },
    `query searchAll($input: String!) { searchDorama(input: $input, limit: 32) { ${Q} } searchMovie(input: $input, limit: 32) { ${Q} } }`);
  const list = (d && d.searchDorama) || [];
  console.log(`\nsearchAll "${q}" -> ${list.length}`);
  list.slice(0, 5).forEach((it, i) => console.log(`  ${i + 1}. ${it.name} | es: ${it.name_es} | ${it.slug}`));
}

// regex sobre name / name_es (Mongoke FilterFindMany acepta regex como string?)
for (const field of ["name", "name_es"]) {
  const d = await gql("probeRegex", { field, rx: "mejor momento" },
    `query probeRegex { paginationDorama(page: 1, perPage: 8, filter: {${field}: {regex: "mejor momento"}}) { items { name name_es slug } } }`);
  const items = (d && d.paginationDorama && d.paginationDorama.items) || [];
  console.log(`\nregex ${field} "mejor momento" -> ${items.length ? items.map((x) => `${x.name} | ${x.name_es}`).join("  ·  ") : "(0)"}`);
}

// slug probe directo por detalle
for (const slug of ["in-your-radiant-season", "en-tu-mejor-momento", "en-tu-temporada-mas-brillante", "marry-my-husband"]) {
  const d = await gql("detailDorama", { filter: { slug } },
    `query detailDorama($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { name name_es slug } }`);
  const s = d && d.detailDorama;
  console.log(`\nslug ${slug} -> ${s ? s.name + " | es: " + s.name_es : "404"}`);
}

// el detalle trae titulos alternos?
const d2 = await gql("shape", { filter: { slug: "in-your-radiant-season" } },
  `query shape($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { __typename } }`);
console.log("\nshape keys:", d2 ? "ok" : "no");
for (const f of ["alternative_titles", "aliases", "also_known_as", "original_name", "title_es", "names"]) {
  const dd = await gql("probeField", { filter: { slug: "in-your-radiant-season" } },
    `query probeField($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { ${f} } }`);
  const s = dd && dd.detailDorama;
  if (s && s[f] !== undefined && s[f] !== null) console.log(`  campo ${f}:`, JSON.stringify(s[f]).slice(0, 200));
}
