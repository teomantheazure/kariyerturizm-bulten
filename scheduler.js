require('dotenv').config();
const cron = require('node-cron');
const db = require('./db');
const { fetchAllSites } = require('./fetcher');
const { summarize } = require('./summarizer');

async function runOnce() {
  console.log('--- Turizm bülteni güncellemesi başladı ---');
  const articles = await fetchAllSites();
  console.log(`Toplam çekilen: ${articles.length}`);

  const insert = db.prepare(`
    INSERT OR IGNORE INTO bulletin_cache (title, summary, source_name, source_url, image_url)
    VALUES (?, ?, ?, ?, ?)
  `);
  const exists = db.prepare(`SELECT 1 FROM bulletin_cache WHERE source_url = ? LIMIT 1`);

  let added = 0;
  for (const a of articles) {
    if (exists.get(a.link)) continue;
    const summary = await summarize(a);
    insert.run(a.title, summary, a.source, a.link, a.image || null); // Görseli kaydet
    added++;
  }
  console.log(`--- ${added} yeni haber eklendi ---`);
}

if (process.argv.includes('--once')) {
  runOnce().then(() => process.exit(0));
} else {
  cron.schedule('0 */2 * * *', runOnce);
  console.log('Zamanlanmış görev aktif (her 2 saatte bir).');
  runOnce();
}