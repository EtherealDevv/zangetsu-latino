// TioAnime — Mangayomi / Zangetsu extension
// lang: es · anime sub · episodios y players embebidos en el HTML

const mangayomiSources = [
  {
    "name": "TioAnime",
    "id": 619337480,
    "lang": "es",
    "baseUrl": "https://tioanime.com",
    "iconUrl": "https://www.google.com/s2/favicons?sz=256&domain=https://tioanime.com",
    "typeSource": "single",
    "itemType": 1,
    "version": "0.1.0",
    "pkgPath": "javascript/anime/src/es/tioanime.js",
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
    "notes": "Anime subtitulado al español. Servidores Mega, Voe y YourUpload."
  }
];

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

function absUrl(path, base) {
  if (!path) return "";
  if (path.indexOf("http://") === 0 || path.indexOf("https://") === 0) return path;
  if (path.charAt(0) === "/") return base + path;
  return base + "/" + path;
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
    var els = doc.select("article.anime");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      var a = el.selectFirst("a[href^='/anime/']") || el.selectFirst("a");
      if (!a) continue;
      var href = a.attr("href") || "";
      var titleEl = el.selectFirst("h3.title") || el.selectFirst("h3");
      var name = titleEl ? titleEl.text.trim() : "";
      var img = el.selectFirst("img");
      if (!name && img) name = (img.attr("alt") || "").trim();
      var image = img ? (img.attr("src") || img.attr("data-src") || "") : "";
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
      var list = await this.fetchList("/directorio?p=" + p);
      return { list: list, hasNextPage: list.length > 0 && p < 500 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async getLatestUpdates(page) {
    var p = page > 0 ? page : 1;
    try {
      var list = p === 1 ? await this.fetchList("/") : await this.fetchList("/directorio?p=" + p);
      return { list: list, hasNextPage: list.length > 0 && p < 500 };
    } catch (e) {
      return { list: [], hasNextPage: false };
    }
  }

  async search(query, page, filters) {
    var p = page > 0 ? page : 1;
    try {
      var list = await this.fetchList("/directorio?q=" + encodeURIComponent(query) + "&p=" + p);
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
    var h1 = doc.selectFirst("h1.title") || doc.selectFirst("h1");
    if (h1) name = h1.text.trim();

    var img = doc.selectFirst(".thumb img") || doc.selectFirst("img");
    var imageUrl = img ? absUrl(img.attr("src") || img.attr("data-src") || "", this.source.baseUrl) : "";

    var description = "";
    var desc = doc.selectFirst(".sinopsis") || doc.selectFirst(".description") || doc.selectFirst("meta[name='description']");
    if (desc) description = desc.attr("content") || desc.text.trim();

    var genre = [];
    var gl = doc.select(".genres a");
    for (var g = 0; g < gl.length; g++) {
      var gt = gl[g].text.trim();
      if (gt && genre.indexOf(gt) < 0) genre.push(gt);
    }

    var status = 5;
    var st = doc.selectFirst(".status");
    if (st) {
      var stt = st.text.toLowerCase();
      if (stt.indexOf("emision") >= 0 || stt.indexOf("emisi") >= 0) status = 0;
      else if (stt.indexOf("final") >= 0) status = 1;
    }

    var chapters = [];
    var info = html.match(/var anime_info = (\[[\s\S]*?\]);/);
    var eps = html.match(/var episodes = (\[[\s\S]*?\]);/);
    var slug = "";
    if (info) {
      try { slug = JSON.parse(info[1])[1] || ""; } catch (e) { }
    }
    if (!slug) {
      var mm = url.match(/\/anime\/([^\/]+)/);
      if (mm) slug = mm[1];
    }
    if (eps) {
      var nums = [];
      try { nums = JSON.parse(eps[1]); } catch (e) { }
      nums = asArray(nums);
      for (var i = 0; i < nums.length; i++) {
        chapters.push({
          name: "Episodio " + nums[i],
          url: this.source.baseUrl + "/ver/" + slug + "-" + nums[i]
        });
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
      } else if (low.indexOf("streamwish") >= 0 || low.indexOf("hgcloud") >= 0 || low.indexOf("vidhide") >= 0) {
        out = toVideoList(await streamWishExtractor(embed, referer));
      } else if (low.indexOf("filemoon") >= 0 || low.indexOf("bysekoze") >= 0) {
        out = toVideoList(await filemoonExtractor(embed, referer));
      } else if (low.indexOf("yourupload") >= 0) {
        out = toVideoList(await yourUploadExtractor(embed, referer));
      } else if (low.indexOf("dood") >= 0 || low.indexOf("dsvplay") >= 0) {
        out = toVideoList(await doodExtractor(embed, referer));
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
    var m = html.match(/var videos = (\[[\s\S]*?\]);/);
    if (!m) return [];
    var rows = [];
    try { rows = JSON.parse(m[1]); } catch (e) { return []; }

    var out = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (!row || row.length < 2) continue;
      var server = String(row[0] || "");
      var embed = String(row[1] || "");
      if (!embed) continue;
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
