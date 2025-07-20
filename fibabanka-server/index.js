const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5001;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'fibabanka',
  password: 'admin1234',
  port: 5432
});

app.get('/api/cards', async (req, res) => {
  const { global_customer_id } = req.query;
  if (!global_customer_id) return res.status(400).send({ error: 'global_customer_id gerekli' });

  try {
    const result = await pool.query(`
      SELECT card_id, bank_id, card_provider
      FROM "Fibabanka_Cards"
      WHERE bank_customer_id IN (
        SELECT bank_customer_id
        FROM "Fibabanka_Customers"
        WHERE global_customer_id = $1
      );
    `, [global_customer_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Kartlar alınırken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});

app.get('/api/campaigns', async (req, res) => {
  const { card_id, amount, store, category } = req.query;
  if (!card_id || !amount || !store || !category) {
    return res.status(400).send({ error: 'Eksik parametre' });
  }

  try {
    const result = await pool.query(`
      SELECT *
      FROM "Fibabanka_Campaigns"
      WHERE card_id = $1
        AND (merchant_id = $2 OR category = $3)
        AND $4 >= condition::float
      ORDER BY benefit_amount DESC;
    `, [card_id, store, category, amount]);

    // Eğer kampanya yoksa sahte kampanya uret
    if (result.rows.length === 0) {
      const fakeCampaigns = generateFakeCampaigns(card_id, category, store, amount);
      return res.json(fakeCampaigns);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Kampanyalar alınırken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});

// Sahte kampanya üretici
function generateFakeCampaigns(card_id, category, store, amount) {
  const count = Math.floor(Math.random() * 5) + 3; // 3 ile 7 arası kampanya
  const campaigns = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + Math.floor(Math.random() * 5 + 1));

    campaigns.push({
      campaign_id: `FAKE_${card_id}_${i}`,
      card_id,
      benefit_amount: Math.floor(Math.random() * 75) + 10,
      merchant_id: store,
      category,
      condition: Math.random() > 0.5 ? (Math.floor(Math.random() * 500) + 100) : 0,
      expires_at: expiresAt.toISOString(),
      is_fake: true
    });
  }
  return campaigns;
}

app.get('/', (req, res) => {
  res.send('Fibabanka API çalışıyor!');
});

app.listen(port, () => {
  console.log(`✅ Fibabanka server http://localhost:${port} üzerinde çalışıyor`);
});

