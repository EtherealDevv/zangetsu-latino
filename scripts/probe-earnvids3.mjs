// earnvids: hls2 con varias cabeceras y hls4 contra varios hosts.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const HLS2 = "https://HI3THh5OxxWw.acek-cdn.com/hls2/01/08218/ujc0y27exkq7_h/master.m3u8?t=xPoY1E8zzeusggzFI4nEhcS-nSuSBnjzRHD8Zcuz_Eg&s=1794502224&e=129600&f=41094229&srv=yBYPq7qTAXaZkdT2&i=0.4&sp=500&p1=yBYPq7qTAXaZkdT2&p2=yBYPq7qTAXaZkdT2&asn=13335";
const HLS4 = "/stream/JSy272xhHcFFek4WqU0VLw/hjkrhuihghfvu/1794545425/41094229/master.m3u8";
const tryGet = async (u, h, tag) => {
  try {
    const r = await fetch(u, { headers: { "user-agent": UA, ...h }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const t = await r.text();
    console.log(`${tag} ${r.status} ${r.headers.get("content-type")} ${t.slice(0, 90).replace(/\s+/g, " ")}`);
  } catch (e) { console.log(`${tag} ERR ${String(e.cause?.code || e.message)}`); }
};
await tryGet(HLS2, { referer: "https://callistanise.com/" }, "hls2 ref=embed");
await tryGet(HLS2, { referer: "https://callistanise.com/", origin: "https://callistanise.com" }, "hls2 +origin");
await tryGet(HLS2, { referer: "https://minochinos.com/", accept: "*/*" }, "hls2 ref=minochinos");
await tryGet(HLS2, {}, "hls2 sin ref");

for (const host of ["https://minochinos.com", "https://callistanise.com", "https://earnvids.com"]) {
  await tryGet(host + HLS4, { referer: host + "/embed/ujc0y27exkq7" }, "hls4 " + host.replace("https://", ""));
}
