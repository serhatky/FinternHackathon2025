// ✅ ÖNCE dotenv config yapılmalı
require("dotenv").config();

// ✅ SONRA diğer require'lar
const pool = require("../db");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function generateRecommendation(global_customer_id, category, store, amount) {
  try {
    console.log("🚀 AI Öneri başlatılıyor:", { global_customer_id, category, store, amount });
    
    // 1️⃣ İşlem geçmişi
    const transQuery = await pool.query(`
      SELECT * FROM transactions
      WHERE global_customer_id = $1
      ORDER BY transaction_date DESC
      LIMIT 10
    `, [global_customer_id]);
    const transactions = transQuery.rows;
    const recentSectors = transactions.map(t => t.category);

    console.log("🔍 İşlemler:", transactions.length, "adet bulundu");

    // 2️⃣ Kart bilgileri
    const cardQuery = await pool.query(`
      SELECT DISTINCT card_id, card_provider, bank_id FROM transactions
      WHERE global_customer_id = $1
    `, [global_customer_id]);
    const userCards = cardQuery.rows;

    console.log("💳 Kartlar:", userCards.length, "adet bulundu");

    // 3️⃣ Kampanyalar
    const campaignQuery = await pool.query(`
      SELECT * FROM campaigns
      WHERE (category = $1 OR merchant_id = $2)
        AND ($3::float >= condition::float OR condition IS NULL)
    `, [category, store, amount]);
    const allCampaigns = campaignQuery.rows;

    console.log("🎯 Kampanyalar:", allCampaigns.length, "adet bulundu");

    // ❗ Veri yoksa varsayılan öneri dön
    if (!userCards.length) {
      console.warn("⛔ Kullanıcının kartı yok.");
      return { 
        message: "Kullanıcıya ait kart bulunamadı.",
        card_provider: "Bilinmiyor",
        bank_id: "Bilinmiyor",
        benefit_amount: 0,
        reason: "Henüz işlem geçmişiniz bulunmuyor. Kartınızı kullanmaya başladığınızda daha iyi öneriler sunabiliriz."
      };
    }

    if (!allCampaigns.length) {
      console.warn("⛔ Kampanya bulunamadı.");
      const defaultCard = userCards[0];
      return { 
        message: "Uygun kampanya bulunamadı.",
        card_provider: defaultCard.card_provider,
        bank_id: defaultCard.bank_id,
        benefit_amount: 0,
        reason: `${store} mağazasında ${category} kategorisinde şu an aktif bir kampanya bulunmuyor. Ancak ${defaultCard.bank_id} ${defaultCard.card_provider} kartınızı kullanabilirsiniz.`
      };
    }

    // 4️⃣ En iyi kampanyalar
    const topCampaigns = allCampaigns
      .sort((a, b) => b.benefit_amount - a.benefit_amount)
      .slice(0, 3);

    console.log("🏆 En iyi kampanyalar seçildi:", topCampaigns.length, "adet");

    // 5️⃣ Prompt
    const prompt = `
Kullanıcının son sektör harcamaları: ${recentSectors.join(", ") || "veri yok"}.
Mevcut kartları: ${userCards.map(c => `${c.bank_id} - ${c.card_provider}`).join(", ") || "veri yok"}.
Şu an harcama: ${store} (${category}), tutar: ${amount} TL.

Aşağıdaki kampanyalardan en avantajlı 3 tanesini seçip nedenini açıkla:
${topCampaigns.map(c => `${c.bank_id} - ${c.card_id}: ${c.benefit_amount} TL, bitiş: ${c.end_date}`).join("\n")}

En iyi kartı öner ve nedenini kısa ve net bir şekilde açıkla (maksimum 200 kelime).
    `.trim();

    console.log("🧠 AI Prompt hazırlandı");

    // 6️⃣ AI çağrısı
    let text;
    try {
      console.log("🤖 Gemini API çağrısı yapılıyor...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      text = await response.text();
      console.log("✅ Gemini yanıtı alındı");
    } catch (err) {
      console.error("⚠️ Gemini yanıtı alınamadı:", err.message);
      text = `Bu harcama için ${topCampaigns[0]?.bank_id} ${topCampaigns[0]?.card_id} kartınızı kullanmanızı öneriyoruz. ${topCampaigns[0]?.benefit_amount} TL fayda sağlayabilirsiniz.`;
    }

    // 7️⃣ Önerilen kart (en yüksek faydası olan kampanyadan)
    const bestCampaign = topCampaigns[0];
    const recommendedCard = userCards.find(card => 
      card.card_id === bestCampaign.card_id || 
      card.bank_id === bestCampaign.bank_id
    ) || userCards[0];

    const result = {
      card_provider: recommendedCard.card_provider,
      bank_id: recommendedCard.bank_id,
      card_id: recommendedCard.card_id,
      benefit_amount: bestCampaign?.benefit_amount || 0,
      reason: text,
      campaign_count: allCampaigns.length,
      user_transaction_count: transactions.length
    };

    console.log("✅ AI öneri tamamlandı");
    return result;

  } catch (err) {
    console.error("❌ AI işlem hatası:", err.message);
    console.error("Stack:", err.stack);
    
    // Hata durumunda bile kullanıcıya bir şeyler dönelim
    return { 
      message: "AI işlem hatası oluştu.",
      card_provider: "Bilinmiyor",
      bank_id: "Bilinmiyor", 
      benefit_amount: 0,
      reason: "Teknik bir sorun oluştu. Lütfen daha sonra tekrar deneyin.",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    };
  }
}

module.exports = { generateRecommendation };