// CineCalidad — Mangayomi / Zangetsu extension
// lang: es · películas (WordPress + Dooplay) · player Vimeos/JW con unpack propio

const mangayomiSources = [
  {
    "name": "CineCalidad",
    "id": 730219554,
    "lang": "es",
    "baseUrl": "https://www.cinecalidad.am",
    "iconUrl": "https://www.google.com/s2/favicons?sz=256&domain=https://cinecalidad.am",
    "typeSource": "single",
    "itemType": 1,
    "version": "0.1.0",
    "pkgPath": "javascript/movie/src/es/cinecalidad.js",
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
    "notes": "Películas en audio latino. Los mirrors Vimeos se abren con unpacker propio (m3u8 directo)."
  }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function absUrl(path, base) {
  if (!path) return "";
  if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
  if (path.charAt(0) === "/") return base + path;
  return base + "/" + path;
}

function unpackPacker(p, a, c, k) {
  var encode = function (n) {
    return (n < a ? "" : encode(parseInt(n / a))) + ((n = n % a) > 35 ? String.fromCharCode(n + 29) : n.toString(36));
  };
  var s = p;
  for (var i = c - 1; i >= 0; i--) {
    if (k[i]) s = s.replace(new RegExp("\\b" + encode(i) + "\\b", "g"), k[i]);
  }
  return s;
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

  parseList(doc) {
    var out = [];
    var els = doc.select("article.item");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var cls = (el.attr("class") || "").toLowerCase();
      if (cls.indexOf("naadb") >= 0) continue;
      var a = el.selectFirst("h3 a") || el.selectFirst("a");
      if (!a) continue;
      var href = a.attr("href") || "";
      var img = el.selectFirst("img");
      var name = img ? (img.attr("alt") || "").trim() : "";
      if (!name) {
        var titleEl = el.selectFirst(".in_title");
        if (titleEl) name = titleEl.text.trim();
      }
      if (!name) name = a.text.trim();
      var image = img ? (img.attr("data-src") || img.attr("src") || "") : "";
      if (!href || !name) continue;
      out.push({ name: name, imageUrl: image, link: absUrl(href, this.source.baseUrl) });
    }
    return out;
  }

  async fetchList(path) {
    var res = await this.client.get(absUrl(path, this.source.baseUrl), this.h);
    return this.parseList(new Document(res.body || ""));
  }

  async getPopular(page) {
    var p = page > 0 ? page : 1;
    var path = p === 1 ? "/" : "/page/" + p + "/";
    try {
      var list = await this.fetchList(path);
      return { list: list, hasNextPage: list.length > 0 && p < 100 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    var p = page > 0 ? page : 1;
    var path = p === 1 ? "/" : "/page/" + p + "/";
    try {
      var list = await this.fetchList(path);
      return { list: list, hasNextPage: list.length > 0 && p < 100 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    var p = page > 0 ? page : 1;
    var url = this.source.baseUrl + "/?s=" + encodeURIComponent(query);
    if (p > 1) url += "&paged=" + p;
    try {
      var res = await this.client.get(url, this.h);
      var list = this.parseList(new Document(res.body || ""));
      return { list: list, hasNextPage: list.length > 0 && p < 50 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    var res = await this.client.get(url, this.h);
    var html = res.body || "";
    var doc = new Document(html);

    var name = "";
    var hs = doc.select("h1");
    for (var i = 0; i < hs.length; i++) {
      var t = (hs[i].text || "").trim();
      if (t && t.toLowerCase() !== "cinecalidad") { name = t; break; }
    }
    if (!name) {
      var og = doc.selectFirst("meta[property='og:title']");
      if (og) name = (og.attr("content") || "").replace(/\s*[-|].*$/, "");
    }

    var img = doc.selectFirst("img.alignnone");
    var imageUrl = img ? (img.attr("data-src") || img.attr("src") || "") : "";

    var description = "";
    var desc = doc.selectFirst("meta[name='description']");
    if (desc) description = desc.attr("content") || "";

    var genre = [];
    var gl = doc.select("a[href*='/genero/']");
    for (var g = 0; g < gl.length; g++) {
      var gt = gl[g].text.trim();
      if (gt && genre.indexOf(gt) < 0) genre.push(gt);
    }

    var chapters = [];
    if (/\/ver-pelicula\//.test(url)) {
      chapters.push({ name: "Ver película", url: url });
    } else {
      var eps = doc.select("a[href*='/ver-serie/']");
      for (var e = 0; e < eps.length; e++) {
        var href = eps[e].attr("href") || "";
        if (!href || href === url.replace(this.source.baseUrl, "")) continue;
        var et = eps[e].text.trim();
        if (!et) continue;
        if (chapters.length < 500) chapters.push({ name: et, url: absUrl(href, this.source.baseUrl) });
      }
      if (chapters.length === 0) chapters.push({ name: "Ver online", url: url });
    }

    return {
      name: name,
      imageUrl: imageUrl,
      description: description,
      author: "",
      artist: "",
      genre: genre,
      status: 1,
      chapters: chapters
    };
  }

  async resolveVimeos(embedUrl, referer) {
    var res = await this.client.get(embedUrl, {
      "User-Agent": UA,
      "Referer": referer,
      "Accept-Language": "es-419,es;q=0.9"
    });
    var html = res.body || "";
    var code = html;
    var m = html.match(/eval\(function\(p,a,c,k,e,d\)\{[\s\S]*?\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
    if (m) {
      code = unpackPacker(m[1], parseInt(m[2], 10), parseInt(m[3], 10), m[4].split("|"));
    }
    var f = code.match(/file:\s*"([^"]+\.m3u8[^"]*)"/) || code.match(/file:\s*'([^']+\.m3u8[^']*)'/);
    if (!f) return [];
    var stream = f[1].replace(/\\\//g, "/");
    return [{
      url: stream,
      originalUrl: embedUrl,
      quality: "HD",
      headers: { "Referer": embedUrl, "User-Agent": UA }
    }];
  }

  async resolveEmbed(embed, referer) {
    var low = embed.toLowerCase();
    var out = [];
    try {
      if (low.indexOf("vimeos") >= 0) {
        out = await this.resolveVimeos(embed, referer);
      } else if (low.indexOf("voe.sx") >= 0) {
        out = toVideoList(await voeExtractor(embed, referer));
      } else if (low.indexOf("streamwish") >= 0 || low.indexOf("hgcloud") >= 0 || low.indexOf("awish") >= 0 || low.indexOf("vidhide") >= 0) {
        out = toVideoList(await streamWishExtractor(embed, referer));
      } else if (low.indexOf("filemoon") >= 0 || low.indexOf("bysekoze") >= 0) {
        out = toVideoList(await filemoonExtractor(embed, referer));
      } else if (low.indexOf("dood") >= 0 || low.indexOf("dsvplay") >= 0) {
        out = toVideoList(await doodExtractor(embed, referer));
      } else if (low.indexOf("yourupload") >= 0) {
        out = toVideoList(await yourUploadExtractor(embed, referer));
      }
    } catch (e) {
      console.log("extractor fallo: " + embed + " :: " + e);
    }
    return out;
  }

  async getVideoList(url) {
    var res = await this.client.get(url, this.h);
    var doc = new Document(res.body || "");
    var opts = doc.select("li.dooplay_player_option");
    var out = [];
    for (var i = 0; i < opts.length; i++) {
      var cls = (opts[i].attr("class") || "").toLowerCase();
      if (cls.indexOf("trailer") >= 0) continue;
      var embed = opts[i].attr("data-option") || opts[i].attr("data-url") || "";
      if (!embed || embed.indexOf("youtube") >= 0 || embed.indexOf("youtu.be") >= 0) continue;
      var label = (opts[i].text || "").replace(/Recomendado/gi, " ").replace(/\s+/g, " ").trim() || "Online";
      try {
        var videos = await this.resolveEmbed(embed, url);
        for (var v = 0; v < videos.length; v++) {
          var video = videos[v];
          var stream = video.url || video.link || "";
          if (!stream) continue;
          out.push({
            url: stream,
            originalUrl: video.originalUrl || stream,
            quality: label + " " + (video.quality || "HD"),
            headers: video.headers || { "Referer": url, "User-Agent": UA }
          });
        }
      } catch (e) {
        console.log("player fallo: " + embed + " :: " + e);
      }
      if (out.length >= 8) break;
    }
    return out;
  }

  getFilterList() { return []; }

  getSourcePreferences() { return []; }
}
