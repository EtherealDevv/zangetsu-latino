// Los cuatro hosts vivos: qué trae exactamente cada página.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const get = async (u, extra) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, "accept-language": "es-419,es;q=0.9", ...(extra || {}) }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    return { s: r.status, b: await r.text(), u: r.url };
  } catch (e) { return { s: 0, b: "", u, err: String(e.cause?.code || e.message) }; }
};
function unpack(s) {
  s = String(s);
  const h = s.indexOf("}('");
  if (h < 0 || s.indexOf(".split('|')") < 0) return s;
  let i = h + 3, payload = "";
  while (i < s.length) { const c = s[i]; if (c === "\\") { payload += s[i + 1]; i += 2; continue; } if (c === "'") break; payload += c; i++; }
  const rest = s.slice(i + 1);
  const m = rest.match(/^,(\d+),(\d+),/);
  if (!m) return s;
  const base = parseInt(m[1], 10), count = parseInt(m[2], 10);
  let j = rest.indexOf("'", m[0].length) + 1, dict = "";
  while (j < rest.length) { const d = rest[j]; if (d === "\\") { dict += rest[j + 1]; j += 2; continue; } if (d === "'") break; dict += d; j++; }
  const words = dict.split("|");
  const enc = (n) => (n < base ? "" : enc(Math.floor(n / base))) + ((n = n % base) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  let out = payload;
  for (let k = count - 1; k >= 0; k--) if (words[k]) out = out.replace(new RegExp("\\b" + enc(k) + "\\b", "g"), words[k]);
  return out;
}

const API = "https://sv1.fluxcedene.net/api/gql";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => JSON.parse(await (await fetch(API, { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) })).text());

// un episodio con muchos hosts
const eps = await gql("listEpisodes", { serie_id: "6144809996deca380bd2c93e", season_number: 1 },
  `query listEpisodes($season_number: Float!, $serie_id: MongoID!) { listEpisodes(sort: NUMBER_ASC, filter: {type_serie: "dorama", serie_id: $serie_id, season_number: $season_number}) { _id episode_number } }`);
const ep = eps.data.listEpisodes[0];
const a = await gql("detailEpisode", { filter: { _id: ep._id } }, `query detailEpisode($filter: FilterFindOneEpisodeInput) { detailEpisode(filter: $filter) { links_online } }`);
const links = a.data.detailEpisode.links_online;
const byHost = {};
for (const l of links) { const h = new URL(l.embed || l.link).host; (byHost[h] = byHost[h] || []).push(l); }
console.log("hosts del episodio:", Object.keys(byHost).join(" "));

for (const host of Object.keys(byHost)) {
  if (/primeload|dood|playmogo/.test(host)) continue;
  const l = byHost[host][0];
  const u = (l.embed || l.link).replace(/\\\//g, "/");
  const r = await get(u, { referer: "https://doramasflix.in/" });
  console.log(`\n#### ${host} ${r.s} ${r.b.length}b  ${u.slice(0, 80)}`);
  const code = unpack(r.b);
  console.log("  unpack len:", code.length);
  const show = code.length < 4000 ? code : code.slice(0, 1200);
  console.log("  ", show.replace(/\s+/g, " ").slice(0, 900));
  if (r.b.length < 1600) console.log("  RAW:", r.b.replace(/\s+/g, " ").slice(0, 900));
}
