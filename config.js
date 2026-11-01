// config.js
// ⚠️ NOT: Seçiciler (titleSelector) genel olarak 'a' (link) olarak ayarlandı.
// Menü linklerini elemek için fetcher.js içindeki "15 karakterden kısa olanları atla" kuralı devreye girer.

module.exports = [
  {
    name: 'Turizm Günlüğü',
    listUrl: 'https://www.turizmgunlugu.com/',
    baseUrl: 'https://www.turizmgunlugu.com',
    titleSelector: 'a',
    filterKeywords: []
  },
  {
    name: 'TurizmGüncel',
    listUrl: 'https://www.turizmguncel.com/',
    baseUrl: 'https://www.turizmguncel.com',
    titleSelector: 'a',
    filterKeywords: []
  },
  {
    name: 'Turizm Ekonomi',
    listUrl: 'https://www.turizmekonomi.com/',
    baseUrl: 'https://www.turizmekonomi.com',
    titleSelector: 'a',
    filterKeywords: []
  },
  {
    name: 'Turizm Ajansı',
    listUrl: 'https://www.turizmajansi.com/',
    baseUrl: 'https://www.turizmajansi.com',
    titleSelector: 'a',
    filterKeywords: []
  },
  {
    name: 'Cumhuriyet Turizm',
    // Cumhuriyet için ekonomi sayfası yerine turizm yazarının sayfasını hedef alıyoruz.
    // Bu sayfada turizm haberleri düzenli olarak listeleniyor.
    listUrl: 'https://www.cumhuriyet.com.tr/yazarlar/nilay-kucuk',
    baseUrl: 'https://www.cumhuriyet.com.tr',
    titleSelector: 'a',
    filterKeywords: ['turizm', 'otel', 'turist', 'tatil', 'seyahat', 'havayolu', 'fiyat', 'veri']
  },
  {
    name: 'Szc (Sözcü) Turizm',
    // Sözcü genel bir haber sitesi. Ekonomi bölümünü tarayıp turizm anahtar kelimelerini arıyoruz.
    listUrl: 'https://www.sozcu.com.tr/ekonomi',
    baseUrl: 'https://www.sozcu.com.tr',
    titleSelector: 'a',
    filterKeywords: ['turizm', 'otel', 'turist', 'tatil', 'seyahat', 'havayolu']
  },
  {
    name: 'Turkrus Turizm',
    // Turkrus ana sayfasını tarayıp içinde turizm geçen başlıkları arıyoruz.
    // Eğer o an ana sayfada turizm haberi yoksa doğal olarak 0 dönecektir.
    listUrl: 'https://turkrus.com/',
    baseUrl: 'https://turkrus.com',
    titleSelector: 'a',
    filterKeywords: ['turizm', 'otel', 'turist', 'tatil', 'seyahat', 'havayolu', 'tur']
  }
];