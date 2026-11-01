require('dotenv').config();
const express = require('express');
const db = require('./db');
const { fetchAllSites } = require('./fetcher'); // Otomatik doldurma için eklendi
const { summarize } = require('./summarizer'); // Otomatik doldurma için eklendi

const app = express();
const PORT = process.env.PORT || 3000;

// Renk Paleti ve Logo Ayarları
const SOURCE_STYLES = {
  'Turizm Günlüğü': { color: '#FF6B6B', bg: '#FFF0F0', domain: 'turizmgunlugu.com' },
  'TurizmGüncel': { color: '#4ECDC4', bg: '#F0FAFA', domain: 'turizmguncel.com' },
  'Turizm Ekonomi': { color: '#1A73E8', bg: '#F0F4FF', domain: 'turizmekonomi.com' },
  'Turizm Ajansı': { color: '#9B59B6', bg: '#F9F0FF', domain: 'turizmajansi.com' },
  'Cumhuriyet Turizm': { color: '#E74C3C', bg: '#FFF0F0', domain: 'cumhuriyet.com.tr' },
  'Szc (Sözcü) Turizm': { color: '#F39C12', bg: '#FFF8F0', domain: 'sozcu.com.tr' },
  'Turkrus Turizm': { color: '#2ECC71', bg: '#F0FFF4', domain: 'turkrus.com' },
  'Default': { color: '#7F8C8D', bg: '#F5F5F5', domain: 'google.com' }
};

// --- OTOMATİK VERİTABANI DOLDURMA FONKSİYONU ---
// Sunucu her başladığında (veya Render uyandığında) çalışır.
async function autoSeedDatabase() {
  const count = db.prepare(`SELECT COUNT(*) as count FROM bulletin_cache`).get().count;
  
  if (count === 0) {
    console.log('Veritabanı boş. Otomatik haber çekme başlatılıyor...');
    try {
      const articles = await fetchAllSites();
      console.log(`Toplam çekilen: ${articles.length}`);
      
      const insert = db.prepare(`
        INSERT OR IGNORE INTO bulletin_cache (title, summary, source_name, source_url, image_url)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      let added = 0;
      for (const a of articles) {
        const summary = await summarize(a);
        insert.run(a.title, summary, a.source, a.link, a.image || null);
        added++;
      }
      console.log(`Otomatik doldurma tamamlandı: ${added} haber eklendi.`);
    } catch (err) {
      console.error('Otomatik doldurma sırasında hata:', err);
    }
  } else {
    console.log(`Veritabanında zaten ${count} haber var, çekmeye gerek yok.`);
  }
}

// --- API ROTALARI ---
app.get('/api/bulletin', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const totalCount = db.prepare(`SELECT COUNT(*) as count FROM bulletin_cache`).get().count;
  
  const rows = db.prepare(`
    SELECT title, summary, source_name, source_url, image_url, created_at
    FROM bulletin_cache 
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);
  
  const enrichedRows = rows.map(row => {
    const style = SOURCE_STYLES[row.source_name] || SOURCE_STYLES['Default'];
    return { ...row, style };
  });

  res.json({ total: totalCount, data: enrichedRows });
});

app.get('/api/ticker', (req, res) => {
  const rows = db.prepare(`
    SELECT title, source_url, image_url, source_name
    FROM bulletin_cache 
    ORDER BY created_at DESC
  `).all();
  res.json(rows);
});

// --- ÖN YÜZ (HTML/CSS/JS) ---
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8">
<title>Turizm Bülteni</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto 100px auto; padding: 0 16px; background: #f8f9fa; color: #333; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  h1 { font-size: 24px; margin: 0; color: #1a1a1a; }
  .total { font-size: 14px; color: #666; background: #e9ecef; padding: 4px 10px; border-radius: 20px; }
  
  .item { background: #fff; border: 1px solid #e3e7ee; border-radius: 12px; padding: 0; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; overflow: hidden; }
  .thumb-container { width: 140px; min-height: 140px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background-size: cover; background-position: center; }
  .thumb-container img { width: 100%; height: 100%; object-fit: cover; }
  .thumb-placeholder { font-size: 40px; opacity: 0.2; }
  .content { padding: 16px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
  .source-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
  .source-icon { width: 20px; height: 20px; border-radius: 50%; background: #fff; padding: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .source { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .date { font-size: 12px; color: #888; }
  .summary { font-size: 16px; line-height: 1.5; margin-bottom: 12px; color: #222; font-weight: 500; }
  .link { font-size: 13px; color: #555; text-decoration: none; font-weight: 600; display: inline-block; }
  .link:hover { text-decoration: underline; }
  #loading { text-align: center; padding: 20px; color: #888; display: none; }
  #end { text-align: center; padding: 20px; color: #888; display: none; }

  /* --- SABİT ALT ŞERİT (TICKER) TASARIMI --- */
  .ticker-wrap {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    overflow: hidden;
    background-color: #1a1a1a;
    color: white;
    padding: 12px 0;
    box-shadow: 0 -4px 10px rgba(0,0,0,0.2);
    z-index: 1000;
    display: flex;
    align-items: center;
  }
  .ticker-title {
    background-color: #e74c3c;
    color: white;
    padding: 0 20px;
    font-weight: bold;
    font-size: 14px;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    display: flex;
    align-items: center;
    z-index: 2;
    box-shadow: 4px 0 10px rgba(0,0,0,0.3);
  }
  .ticker {
    display: flex;
    white-space: nowrap;
    animation: marquee 180s linear infinite; /* Hız yavaşlatıldı */
    padding-left: 120px; 
  }
  .ticker:hover { animation-play-state: paused; }
  
  .ticker-item {
    display: inline-flex;
    align-items: center;
    margin-right: 40px;
    text-decoration: none;
    color: #eee;
    gap: 12px;
  }
  .ticker-item:hover { color: #fff; text-decoration: underline; }
  .ticker-item img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 4px;
    border: 1px solid #444;
  }
  .ticker-item .no-img {
    height: 40px;
    width: 60px;
    background-color: #333;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .ticker-item span { font-size: 14px; font-weight: 500; }

  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }
</style></head><body>

<div class="header">
  <h1>🧭 Turizm Bülteni</h1>
  <div class="total" id="total-count">Yükleniyor...</div>
</div>

<div id="list"></div>
<div id="loading">Daha fazla haber yükleniyor...</div>
<div id="end">Tüm haberleri gördünüz.</div>

<div class="ticker-wrap">
  <div class="ticker-title">SON DAKİKA</div>
  <div class="ticker" id="ticker-content">
    <span style="color:#aaa; font-size:14px; margin-top:10px;">Haberler yükleniyor...</span>
  </div>
</div>

<script>
  let offset = 0;
  const limit = 20;
  let isLoading = false;
  let hasMore = true;

  async function loadMore() {
    if (isLoading || !hasMore) return;
    isLoading = true;
    document.getElementById('loading').style.display = 'block';

    try {
      const res = await fetch(\`/api/bulletin?limit=\${limit}&offset=\${offset}\`);
      const result = await res.json();
      
      document.getElementById('total-count').textContent = \`Toplam \${result.total} haber\`;

      if (result.data.length > 0) {
        const list = document.getElementById('list');
        result.data.forEach(item => {
          const date = new Date(item.created_at).toLocaleDateString('tr-TR', { hour: '2-digit', minute:'2-digit' });
          
          let thumbHtml = '';
          if (item.image_url) {
            thumbHtml = \`<div class="thumb-container"><img src="\${item.image_url}" onerror="this.style.display='none'; this.parentNode.style.backgroundColor='\${item.style.bg}'; this.parentNode.innerHTML='<div class=\\'thumb-placeholder\\' style=\\'color:\${item.style.color}\\'>📰</div>'"></div>\`;
          } else {
            thumbHtml = \`<div class="thumb-container" style="background-color: \${item.style.bg}; color: \${item.style.color};"><div class="thumb-placeholder">📰</div></div>\`;
          }

          const faviconUrl = \`https://www.google.com/s2/favicons?domain=\${item.style.domain}&sz=64\`;

          list.innerHTML += \`
            <div class="item">
              \${thumbHtml}
              <div class="content" style="border-left: 4px solid \${item.style.color};">
                <div class="source-row">
                  <img class="source-icon" src="\${faviconUrl}" onerror="this.style.display='none'">
                  <span class="source" style="color: \${item.style.color};">\${item.source_name}</span>
                  <span class="date">• \${date}</span>
                </div>
                <div class="summary">\${item.summary}</div>
                <a class="link" href="\${item.source_url}" target="_blank">Orijinal haberi oku →</a>
              </div>
            </div>
          \`;
        });
        offset += limit;
      }

      if (result.data.length < limit) {
        hasMore = false;
        document.getElementById('end').style.display = 'block';
      }
    } catch (err) {
      console.error('Yükleme hatası:', err);
    } finally {
      isLoading = false;
      document.getElementById('loading').style.display = 'none';
    }
  }

  async function loadTicker() {
    try {
      const res = await fetch('/api/ticker');
      const data = await res.json();
      const ticker = document.getElementById('ticker-content');
      ticker.innerHTML = '';

      if (data.length === 0) {
        ticker.innerHTML = '<span style="color:#aaa;">Henüz haber yok.</span>';
        return;
      }

      const renderItems = (items) => {
        return items.map(item => {
          const imgHtml = item.image_url 
            ? \`<img src="\${item.image_url}" alt="resim">\` 
            : \`<div class="no-img">📰</div>\`;
          return \`
            <a href="\${item.source_url}" target="_blank" class="ticker-item">
              \${imgHtml}
              <span>\${item.title}</span>
            </a>
          \`;
        }).join('');
      };

      ticker.innerHTML = renderItems(data) + renderItems(data);
    } catch (err) {
      console.error('Ticker yükleme hatası:', err);
    }
  }

  loadMore();
  loadTicker();

  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      loadMore();
    }
  });
</script>
</body></html>`);
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
  // Sunucu ayağa kalktığında otomatik doldurmayı tetikle
  autoSeedDatabase();
});
