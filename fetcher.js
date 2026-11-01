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

      // AKILLI GÖRSEL ÇEKME MANTIĞI
      let imageUrl = null;
      // Başlık etiketinin bulunduğu en yakın ana kapsayıcıyı bul (genellikle <article>, <div> veya <li> olur)
      // Ebeveynlere doğru 3 seviye yukarı çıkıp içindeki ilk <img>'i arıyoruz.
      const $container = $el.closest('article, .card, .post, .news-item, li, div');
      
      // Önce kapsayıcı içinde ara
      let $img = $container.find('img').first();
      
      // Eğer kapsayıcıda bulamazsa, bir üst kapsayıcıda ara
      if ($img.length === 0) {
        $img = $el.parent().parent().find('img').first();
      }

      if ($img.length > 0) {
        // Farklı siteler resimleri farklı özelliklerde tutar (src, data-src, data-lazy-src, srcset)
        imageUrl = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src') || $img.attr('data-original');
        
        // Eğer srcset varsa ve src yoksa, srcset'ten ilk url'yi al
        if (!imageUrl && $img.attr('srcset')) {
          imageUrl = $img.attr('srcset').split(' ')[0];
        }

        // Eğer resim yolu "/" ile başlıyorsa başına site adresini ekle
        if (imageUrl && imageUrl.startsWith('/')) {
          imageUrl = config.baseUrl + imageUrl;
        }

        // Bazen resim yerine 1x1 piksel (base64) koyarlar, onları es geç
        if (imageUrl && imageUrl.startsWith('data:image')) {
          imageUrl = null;
        }
      }

      articles.push({ title, link, source: config.name, image: imageUrl });
    });

    console.log(`[${config.name}] ${articles.length} haber çıkarıldı (Görselli: ${articles.filter(a => a.image).length})`);
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