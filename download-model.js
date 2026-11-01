// download-model.js
const { pipeline } = require('@huggingface/transformers');

async function downloadModel() {
  console.log('Model indiriliyor, lütfen bekleyin...');
  try {
    await pipeline('summarization', 'Xenova/distilbart-cnn-6-6');
    console.log('Model başarıyla indirildi ve önbelleğe alındı!');
  } catch (error) {
    console.error('Model indirilirken hata oluştu:', error);
  }
}

downloadModel();