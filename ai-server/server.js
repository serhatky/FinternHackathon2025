const { generateRecommendation, generateFinancialReport } = require('./routes/recommendation');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5005;

// LLM modeli başlat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.use(cors());
app.use(express.json());

/* ----------------------------------------------
🎯 AI Kart Önerisi (Mock)
---------------------------------------------- */
app.post('/api/ai/recommendation', async (req, res) => {
  try {
    const { global_customer_id, category, store, amount } = req.body;

    if (!global_customer_id || !category || !store || !amount) {
      return res.status(400).json({
        error: 'Eksik parametreler: global_customer_id, category, store, amount gerekli'
      });
    }

    console.log("📨 AI öneri isteği:", req.body);

    // ❗ Gerçek veritabanı yerine sahte öneri + mock analiz
    const recommendation = {
      card_provider: "fibabanka Business",
      bank_id: "fibabanka",
      benefit_amount: 82,
      reason: "Bu kart, harcama kategorinize ve tutarınıza göre en yüksek faydayı sağlayacaktır. Son 3 ayda benzer harcamalarda %12 geri ödeme sağlamış.",
    };

    res.json({
      success: true,
      ...recommendation
    });

  } catch (error) {
    console.error("❌ Server hatası:", error);
    res.status(500).json({
      success: false,
      message: `Sunucu hatası: ${error.message}`
    });
  }
});

/* ----------------------------------------------
📊 Kişisel Finans Raporu (Gemini + JSON)
---------------------------------------------- */
app.post('/api/ai/finance-report', async (req, res) => {
  const { global_customer_id } = req.body;

  try {
    if (!global_customer_id) {
      return res.status(400).json({ error: 'global_customer_id parametresi eksik.' });
    }

    const transactionsPath = path.join(__dirname, 'data', 'transactions_500.json');
    const rawData = fs.readFileSync(transactionsPath, 'utf8');
    const allTransactions = JSON.parse(rawData);

    const userTransactions = allTransactions.filter(tx => tx.global_customer_id === global_customer_id);

    if (userTransactions.length === 0) {
      return res.status(404).json({ error: "Bu kullanıcıya ait işlem bulunamadı." });
    }

    const sectorTotals = {};
    for (const tx of userTransactions) {
      const sector = tx.sector?.toLowerCase?.() || 'bilinmiyor';
      sectorTotals[sector] = (sectorTotals[sector] || 0) + parseFloat(tx.amount);
    }

    const prompt = `
Aşağıda bir müşterinin geçmiş harcamaları yer almaktadır. Harcamalar kategori bazında özetlenmiştir:

${JSON.stringify(sectorTotals, null, 2)}

Lütfen aşağıdaki analizleri kullanıcı dostu ve sade şekilde yap:
- En çok harcama yapılan alanlar
- Gelecek ay artması muhtemel harcama kalemleri
- Tasarruf yapılabilecek alanlar
- Ortalama harcama yorumu
- Genel finansal değerlendirme

Analizi maksimum 5 paragrafla özetle. Teknik terim kullanma. TL cinsinden örnekler ver.
    `.trim();

    const result = await model.generateContent(prompt);
    const output = await result.response.text();

    res.json({ report: output });

  } catch (error) {
    console.error("❌ Finansal rapor hatası:", error);
    res.status(500).json({ error: 'Finansal rapor oluşturulamadı', message: error.message });
  }
});

/* ----------------------------------------------
🧪 Test ve sağlık endpoint'leri
---------------------------------------------- */
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SmartWall AI Service',
    timestamp: new Date().toISOString(),
    endpoints: {
      recommendation: 'POST /api/ai/recommendation',
      finance_report: 'POST /api/ai/finance-report'
    }
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'SmartWall AI servisi başarıyla çalışıyor!',
    version: '2.0.0',
    features: [
      'AI Kart Önerisi',
      'Finansal Rapor Oluşturma',
      'Gemini ile JSON tabanlı analiz'
    ]
  });
});

/* ----------------------------------------------
🚀 Sunucuyu başlat
---------------------------------------------- */
app.listen(PORT, () => {
  console.log(`🚀 SmartWall AI Server çalışıyor: http://localhost:${PORT}`);
  console.log(`📊 Finansal Rapor: POST /api/ai/finance-report`);
  console.log(`🎯 AI Öneri: POST /api/ai/recommendation`);
  console.log(`💚 Sağlık: GET /health`);
});
