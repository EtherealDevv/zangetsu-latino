// MonosChinos — Mangayomi / Zangetsu extension
// lang: es · anime sub · lista de capítulos por AJAX · players en base64

const mangayomiSources = [
  {
    "name": "MonosChinos",
    "id": 305784612,
    "lang": "es",
    "baseUrl": "https://monoschinos.st",
    "iconUrl": "https://www.google.com/s2/favicons?sz=256&domain=https://monoschinos.st",
    "typeSource": "single",
    "itemType": 1,
    "version": "0.1.0",
    "pkgPath": "javascript/anime/src/es/monoschinos.js",
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
    "notes": "Anime sub español. Servidores Mega, Filemoon, Doodstream, Voe, SaveFiles y Mixdrop."
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

  parseList(doc) {
    var out = [];
    var els = doc.select("article a.card-wrap");
    for (var i = 0; i < els.length; i++) {
      var a = els[i];
      var href = a.attr("href") || "";
      var img = a.selectFirst("img.card-img") || a.selectFirst("img");
      var titleEl = a.selectFirst("h3");
      var name = titleEl ? titleEl.text.trim() : "";
      if (!name && img) name = (img.attr("alt") || "").trim();
      var image = img ? (img.attr("data-src") || img.attr("src") || "") : "";
      if (!href || !name) continue;
      out.push({ name: name, imageUrl: absUrl(image, this.source.baseUrl), link: absUrl(href, this.source.baseUrl) });
    }
    return out;
  }

  async fetchList(path) {
    var res = await this.client.get(absUrl(path, this.source.baseUrl), this.h);
    return this.parseList(new Document(res.body || ""));
  }

  async getPopular(page) {
    var p = page > 0 ? page : 1;
    try {
      var list = await this.fetchList("/animes?p=" + p);
      return { list: list, hasNextPage: list.length > 0 && p < 500 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    var p = page > 0 ? page : 1;
    try {
      var list = p === 1 ? await this.fetchList("/") : await this.fetchList("/animes?p=" + p);
      return { list: list, hasNextPage: list.length > 0 && p < 500 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    var p = page > 0 ? page : 1;
    try {
      var list = await this.fetchList("/buscar?q=" + encodeURIComponent(query) + "&p=" + p);
      return { list: list, hasNextPage: list.length > 0 && p < 100 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getDetail(url) {
    var res = await this.client.get(url, this.h);
    var html = res.body || "";
    var doc = new Document(html);

    var name = "";
    var h1 = doc.selectFirst("h1");
    if (h1) name = h1.text.trim();

    var img = doc.selectFirst("img[data-src]");
    var imageUrl = img ? absUrl(img.attr("data-src") || "", this.source.baseUrl) : "";

    var description = "";
    var desc = doc.selectFirst("meta[name='description']");
    if (desc) description = desc.attr("content") || "";

    var genre = [];
    var gl = doc.select("a[href*='/genero/']");
    for (var g = 0; g < gl.length; g++) {
      var gt = gl[g].text.trim();
      if (gt && genre.indexOf(gt) < 0) genre.push(gt);
    }

    var status = 5;
    var pageText = doc.selectFirst("main") ? doc.selectFirst("main").text.toLowerCase() : html.toLowerCase();
    if (pageText.indexOf("en emisión") >= 0 || pageText.indexOf("en emision") >= 0) status = 0;
    else if (pageText.indexOf("finalizado") >= 0) status = 1;

    // Slug base del anime: /anime/<slug>-sub-espanol  ->  <slug>
    var slug = "";
    var mm = url.match(/\/anime\/([^\/\?#]+)/);
    if (mm) slug = mm[1].replace(/-sub-espanol$/, "").replace(/-latino$/, "");

    var chapters = [];
    var list = doc.selectFirst("section.caplist");
    var ajax = list ? (list.attr("data-ajax") || "") : "";
    if (ajax && slug) {
      try {
        var jr = await this.client.get(ajax, {
          "User-Agent": UA,
          "Referer": url,
          "X-Requested-With": "XMLHttpRequest",
          "Accept": "application/json, text/javascript, */*; q=0.01"
        });
        var data = JSON.parse(jr.body || "{}");
        var eps = asArray(data.eps);
        for (var i = 0; i < eps.length; i++) {
          var num = eps[i].num;
          if (!num) continue;
          chapters.push({
            name: "Episodio " + num,
            url: this.source.baseUrl + "/ver/" + slug + "-episodio-" + num
          });
        }
      } catch (e) {
        console.log("caplist fallo: " + e);
      }
    }
    chapters.reverse();

    return {
      name: name,
      imageUrl: imageUrl,
      description: description,
      author: "",
      artist: "",
      genre: genre,
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
      } else if (low.indexOf("filemoon") >= 0 || low.indexOf("bysekoze") >= 0) {
        out = toVideoList(await filemoonExtractor(embed, referer));
      } else if (low.indexOf("dood") >= 0 || low.indexOf("dsvplay") >= 0 || low.indexOf("ds2play") >= 0) {
        out = toVideoList(await doodExtractor(embed, referer));
      } else if (low.indexOf("streamwish") >= 0 || low.indexOf("hgcloud") >= 0 || low.indexOf("savefiles") >= 0 || low.indexOf("vidhide") >= 0) {
        out = toVideoList(await streamWishExtractor(embed, referer));
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
    var doc = new Document(html);
    var buttons = doc.select(".srv[data-player]");
    var out = [];

    for (var i = 0; i < buttons.length; i++) {
      var raw = buttons[i].attr("data-player") || "";
      if (!raw) continue;
      var embed = b64decode(raw);
      if (embed.indexOf("http") !== 0) continue;
      var server = buttons[i].text.trim() || "Online";
      try {
        var videos = await this.resolveEmbed(embed, url);
        for (var v = 0; v < videos.length; v++) {
          var video = videos[v];
          var stream = video.url || video.link || "";
          if (!stream) continue;
          out.push({
            url: stream,
            originalUrl: video.originalUrl || stream,
            quality: server + " " + (video.quality || "SUB"),
            headers: video.headers || { "Referer": url, "User-Agent": UA }
          });
        }
      } catch (e) {
        console.log("player fallo: " + embed + " :: " + e);
      }
    }
    return out;
  }

  getFilterList() { return []; }

  getSourcePreferences() { return []; }
}
