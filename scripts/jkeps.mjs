const base = "https://jkanime.net/";
const page = await (await fetch(base + "one-piece/", { headers: { "User-Agent": "Mozilla/5.0 Chrome/135" } })).text();
const token = (page.match(/name="csrf-token" content="([^"]+)"/) || [])[1];
console.log("token", token ? token.slice(0,8) : "none");
for (const method of ["GET", "POST"]) {
  const r = await fetch(base + "ajax/episodes/201/1", {
    method,
    headers: {
      "User-Agent": "Mozilla/5.0 Chrome/135",
      "X-Requested-With": "XMLHttpRequest",
      "Referer": base + "one-piece/",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "POST" ? "_token=" + encodeURIComponent(token || "") : undefined,
  });
  const t = await r.text();
  console.log(method, r.status, t.slice(0, 380).replace(/\s+/g, " "));
}
