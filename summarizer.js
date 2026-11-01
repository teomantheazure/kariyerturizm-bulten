// summarizer.js

async function summarize(article) {
  // Başlığın başındaki ve sonundaki boşlukları temizle
  let cleanTitle = article.title.trim();
  
  // Eğer başlık çok uzunsa (örneğin 80 karakterden fazlaysa) sonuna üç nokta koy
  if (cleanTitle.length > 80) {
    cleanTitle = cleanTitle.substring(0, 77) + '...';
  }

  // Bülten formatında bir özet oluştur
  const summary = `${cleanTitle} (${article.source} haberine göre)`;

  // Konsola yazdır
  console.log(`[Özet] Başarılı: ${cleanTitle.substring(0, 40)}...`);
  
  // Oluşturulan özeti geri döndür
  return summary;
}

module.exports = { summarize };