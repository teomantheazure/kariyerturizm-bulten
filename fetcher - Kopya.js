const axios = require('axios');
const cheerio = require('cheerio');
const SITE_CONFIGS = require('./config');

async function fetchSite(config) {
  try {
    const { data: html } = await axios.get(config.listUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 15000
    });
    const $ = cheerio.load(html);
    const articles = [];
    const seen = new Set();

    $(config.titleSelector).each((i, el) => {
      const $el = $(el);
      const title = $el.text().trim();
      let link = $el.attr('href');
      
      if (!title || !link) return;
      if (title.length < 25) return;
      if (title === title.toUpperCase()) return;
      if (link === '#' || link === '/' || link.includes('/kategori/') || link.includes('/etiket/')) return;

      if (link.startsWith('/')) link = config.baseUrl + link;
      if (!link.startsWith('http')) return;
      if (seen.has(link)) return;
      seen.add(link);

      if (config.filterKeywords.length > 0) {
        const t = title.toLowerCase();
        const hit = config.filterKeywords.some(kw => t.includes(kw.toLowerCase()));
        if (!hit) return;
      }

      // GÖRSEL ÇEKME MANTIĞI: Haberin linkine tıklamadan, sadece listedeki HTML'den görseli bulmaya çalış
      let imageUrl = null;
      // Bazen resim <a> etiketinin içindedir, bazen de hemen yanındadır. En yakın <img> etiketini arıyoruz.
      const $parent = $el.parent();
      const $img = $parent.find('img').first(); 
      
      if ($img.length > 0) {
        imageUrl = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = config.baseUrl + imageUrl;
        }
      }

      articles.push({ title, link, source: config.name, image: imageUrl });
    });

    console.log(`[${config.name}] ${articles.length} haber çıkarıldı`);
    return articles;
  } catch (err) {
    console.error(`[${config.name}] çekme hatası:`, err.message);
    return [];
  }
}

async function fetchAllSites() {
  const all = [];
  for (const cfg of SITE_CONFIGS) {
    const items = await fetchSite(cfg);
    all.push(...items);
  }
  return all;
}

module.exports = { fetchAllSites };