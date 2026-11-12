// JKAnime — Mangayomi / Zangetsu extension
// lang: es · anime sub/latino · top, búsqueda y servidores en JSON embebido

const mangayomiSources = [
  {
    "name": "JKAnime",
    "id": 957216043,
    "lang": "es",
    "baseUrl": "https://jkanime.net",
    "iconUrl": "https://www.google.com/s2/favicons?sz=256&domain=https://jkanime.net",
    "typeSource": "single",
    "itemType": 1,
    "version": "0.1.0",
    "pkgPath": "javascript/anime/src/es/jkanime.js",
    "isManga": false,
    "isNsfw": false,
    "hasCloudflare": false,
    "isFullData": false,
    "appMinVerReq": "0.5.0",
    "sourceCodeUrl": "",
    "dateFormat": "",
    "dateFormatLocale": "",
    "additionalParams": "",
    "sourceCodeLanguage": 1,
    "notes": "Anime sub y latino. Servidores Mega, Streamwish, Vidhide, Voe, Filemoon y JKPlayer."
  }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function absUrl(path, base) {
  if (!path) return "";
  if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
  if (path.charAt(0) === "/") return base + path;
  return base + "/" + path;
}

function b64decode(input) {
  var s = String(input || "").replace(/[^A-Za-z0-9+/=_-]/g, "").replace(/-/g, "+").replace(/_/g, "/");
  var out = "";
  var i = 0;
  while (i < s.length) {
    var c1 = B64.indexOf(s.charAt(i++));
    var c2 = B64.indexOf(s.charAt(i++));
    var c3 = B64.indexOf(s.charAt(i++));
    var c4 = B64.indexOf(s.charAt(i++));
    if (c1 < 0 || c2 < 0) break;
    out += String.fromCharCode((c1 << 2) | (c2 >> 4));
    if (c3 >= 0) out += String.fromCharCode(((c2 & 15) << 4) | (c3 >> 2));
    if (c4 >= 0) out += String.fromCharCode(((c3 & 3) << 6) | c4);
  }
  return out;
}

function asArray(x) { return Array.isArray(x) ? x : []; }

function toVideoList(raw) {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { raw = JSON.parse(raw); } catch (e) { return []; }
  }
  return Array.isArray(raw) ? raw : asArray(raw.list);
}

class DefaultExtension extends MProvider {
  constructor() {
    super();
    this.client = new Client();
    this.h = {
      "User-Agent": UA,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "es-419,es;q=0.9,en;q=0.8"
    };
  }

  parseTop(doc) {
    var out = [];
    var els = doc.select(".toplist");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var a = el.selectFirst("a[href]");
      if (!a) continue;
      var href = a.attr("href") || "";
      var img = el.selectFirst("img");
      var titleEl = el.selectFirst(".card-title") || el.selectFirst("h5");
      var name = titleEl ? titleEl.text.trim() : "";
      if (!name && img) name = (img.attr("alt") || "").trim();
      var image = img ? (img.attr("src") || img.attr("data-src") || "") : "";
      if (!href || !name) continue;
      out.push({ name: name, imageUrl: absUrl(image, this.source.baseUrl), link: absUrl(href, this.source.baseUrl) });
    }
    return out;
  }

  parseSearch(doc) {
    var out = [];
    var els = doc.select(".anime__item");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var a = el.selectFirst("h5 a") || el.selectFirst("a[href]");
      if (!a) continue;
      var href = a.attr("href") || "";
      var titleEl = el.selectFirst("h5 a") || el.selectFirst("a[title]");
      var name = titleEl ? (titleEl.attr("title") || titleEl.text).trim() : "";
      var pic = el.selectFirst(".anime__item__pic");
      var img = el.selectFirst("img");
      var image = img ? (img.attr("src") || "") : "";
      if (!image && pic) image = pic.attr("data-setbg") || "";
      image = (image || "").replace(/^url\((["\']?)(.*?)\1\)$/, "$2");
      if (!href || !name) continue;
      out.push({ name: name, imageUrl: absUrl(image, this.source.baseUrl), link: absUrl(href, this.source.baseUrl) });
    }
    return out;
  }

  async getPopular(page) {
    var p = page > 0 ? page : 1;
    try {
      var res = await this.client.get(this.source.baseUrl + "/top", this.h);
      var list = this.parseTop(new Document(res.body || ""));
      var start = (p - 1) * 25;
      return { list: list.slice(start, start + 25), hasNextPage: p * 25 < list.length };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    return await this.getPopular(page);
  }

  async search(query, page, filters) {
    try {
      var res = await this.client.get(this.source.baseUrl + "/buscar/" + encodeURIComponent(query), this.h);
      var list = this.parseSearch(new Document(res.body || ""));
      return { list: list, hasNextPage: false };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    var res = await this.client.get(url, this.h);
    var html = res.body || "";
    var doc = new Document(html);

    var name = "";
    var h3 = doc.selectFirst(".anime_info h3") || doc.selectFirst("h1") || doc.selectFirst("h3");
    if (h3) name = h3.text.trim();

    var img = doc.selectFirst(".anime_pic img") || doc.selectFirst(".anime_info img");
    var imageUrl = img ? absUrl(img.attr("src") || "", this.source.baseUrl) : "";

    var description = "";
    var p = doc.selectFirst(".anime_info p.scroll") || doc.selectFirst(".anime_info p");
    if (p) description = p.text.trim();

    var status = 5;
    var infoText = doc.selectFirst(".anime_info") ? doc.selectFirst(".anime_info").text.toLowerCase() : "";
    if (infoText.indexOf("en emisión") >= 0 || infoText.indexOf("en emision") >= 0) status = 0;
    else if (infoText.indexOf("finalizado") >= 0) status = 1;

    var latest = 0;
    var uep = doc.selectFirst("#uep");
    if (uep) {
      var hm = (uep.attr("href") || "").match(/\/(\d+)\/?$/);
      if (hm) latest = parseInt(hm[1], 10);
    }
    if (!latest) {
      var um = html.match(/\/[^\/]+\/(\d+)\/">\s*\d*/);
      if (um) latest = parseInt(um[1], 10);
    }

    var slug = url.replace(/^https?:\/\/[^\/]+/, "").replace(/\/$/, "");
    var chapters = [];
    for (var n = latest; n >= 1; n--) {
      chapters.push({ name: "Episodio " + n, url: this.source.baseUrl + slug + "/" + n + "/" });
    }

    return {
      name: name,
      imageUrl: imageUrl,
      description: description,
      author: "",
      artist: "",
      genre: [],
      status: status,
      chapters: chapters
    };
  }

  async resolveEmbed(embed, referer) {
    var low = embed.toLowerCase();
    var out = [];
    try {
      if (low.indexOf("voe.sx") >= 0) {
        out = toVideoList(await voeExtractor(embed, referer));
      } else if (low.indexOf("streamwish") >= 0 || low.indexOf("hgcloud") >= 0 || low.indexOf("vidhide") >= 0) {
        out = toVideoList(await streamWishExtractor(embed, referer));
      } else if (low.indexOf("filemoon") >= 0 || low.indexOf("bysekoze") >= 0) {
        out = toVideoList(await filemoonExtractor(embed, referer));
      } else if (low.indexOf("dood") >= 0 || low.indexOf("dsvplay") >= 0) {
        out = toVideoList(await doodExtractor(embed, referer));
      } else if (low.indexOf("yourupload") >= 0) {
        out = toVideoList(await yourUploadExtractor(embed, referer));
      } else if (low.indexOf("ok.ru") >= 0 || low.indexOf("okru") >= 0) {
        out = toVideoList(await okruExtractor(embed));
      }
    } catch (e) {
      console.log("extractor fallo: " + embed + " :: " + e);
    }
    // Mega/Mediafire no se pueden reproducir en el reproductor interno: se descartan.
    if (out.length === 0 && !/mega\.nz|mediafire|1fichier/.test(embed)) {
      out = [{ url: embed, originalUrl: embed, quality: "", headers: { "Referer": referer, "User-Agent": UA } }];
    }
    return out;
  }

  async getVideoList(url) {
    var res = await this.client.get(url, this.h);
    var html = res.body || "";
    var out = [];

    var sm = html.match(/var servers = (\[[\s\S]*?\]);/);
    if (sm) {
      var servers = [];
      try { servers = JSON.parse(sm[1]); } catch (e) { servers = []; }
      for (var i = 0; i < servers.length; i++) {
        var s = servers[i] || {};
        var embed = b64decode(s.remote || "");
        if (embed.indexOf("http") !== 0) continue;
        var server = s.server || "Online";
        var lang = s.lang === 1 ? "SUB" : (s.lang === 2 ? "LAT" : "SUB");
        try {
          var videos = await this.resolveEmbed(embed, url);
          for (var v = 0; v < videos.length; v++) {
            var video = videos[v];
            var stream = video.url || video.link || "";
            if (!stream) continue;
            out.push({
              url: stream,
              originalUrl: video.originalUrl || stream,
              quality: server + " " + lang + " " + (video.quality || ""),
              headers: video.headers || { "Referer": url, "User-Agent": UA }
            });
          }
        } catch (e) {
          console.log("player fallo: " + embed + " :: " + e);
        }
      }
    }

    // JKPlayer: iframes propios (fallback cuando el servidor externo no responde)
    var re = /video\[\d+\]\s*=\s*'<iframe[^>]*src="([^"]+)"/g;
    var mm;
    while ((mm = re.exec(html)) !== null) {
      var jk = mm[1].replace(/&amp;/g, "&");
      if (!jk) continue;
      out.push({
        url: jk,
        originalUrl: jk,
        quality: "JKPlayer",
        headers: { "Referer": url, "User-Agent": UA }
      });
    }

    return out;
  }

  getFilterList() { return []; }

  getSourcePreferences() { return []; }
}
