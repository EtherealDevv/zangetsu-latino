// Subcampos de genres en Dorama/Movie.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0 Safari/537.36";
const H = {
  "accept": "application/json, text/plain, */*", "content-type": "application/json",
  "origin": "https://doramasflix.in", "referer": "https://doramasflix.in/",
  "platform": "doramasflix", "authorization": "Bear", "x-access-jwt-token": "",
  "x-access-platform": "RxARncfg1S_MdpSrCvreoLu_SikCGMzE1NzQzODc3NjE2MQ==", "user-agent": UA
};
const gql = async (o, v, q) => {
  const r = await fetch("https://sv1.fluxcedene.net/api/gql", { method: "POST", headers: H, body: JSON.stringify({ operationName: o, variables: v, query: q }), signal: AbortSignal.timeout(20000) });
  return { s: r.status, t: await r.text() };
};
for (const [l, o, v, q] of [
  ["dorama genres name", "detailDorama", { filter: { slug: "squid-game" } }, `query detailDorama($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { _id name genres { name } } }`],
  ["movie genres name", "detailMovie", { filter: { slug: "colony" } }, `query detailMovie($filter: FilterFindOneMovieInput) { detailMovie(filter: $filter) { _id name genres { name } release_date runtime } }`],
  ["dorama intro fields", "detailDorama", { filter: { slug: "squid-game" } }, `query detailDorama($filter: FilterFindOneDoramaInput) { detailDorama(filter: $filter) { _id first_air_date status numberOfSeasons } }`]
]) {
  const r = await gql(o, v, q);
  console.log(`\n== ${l} ${r.s}\n${r.t.replace(/\s+/g, " ").slice(0, 460)}`);
}
