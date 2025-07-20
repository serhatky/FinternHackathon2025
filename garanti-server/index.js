const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 5002;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'garanti',
  password: 'admin1234',
  port: 5432
});

// Kartlar endpoint
app.get('/api/cards', async (req, res) => {
  const { global_customer_id } = req.query;
  if (!global_customer_id) {
    return res.status(400).json({ error: 'global_customer_id gerekli' });
  }

  try {
    const result = await pool.query(`
      SELECT c.card_id, c.bank_id, c.card_provider
      FROM "Garanti_Cards" c
      INNER JOIN "Garanti_Customers" cu ON c.bank_customer_id = cu.bank_customer_id
      WHERE cu.global_customer_id = $1
    `, [global_customer_id]);

    res.json(result.rows);
  } catch (err) {
    console.error('Kartlar alınırken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});

// Kampanyalar endpoint
app.get('/api/campaigns', async (req, res) => {
  const { card_id, amount, store, category } = req.query;
  if (!card_id || !amount || !store || !category) {
    return res.status(400).json({ error: 'Eksik parametre' });
  }

  try {
    const result = await pool.query(`
      SELECT *
      FROM "Garanti_Campaigns"
      WHERE card_id = $1
        AND (merchant_id = $2 OR category = $3)
        AND $4 >= condition::float
      ORDER BY benefit_amount DESC;
    `, [card_id, store, category, amount]);

    res.json(result.rows);
  } catch (err) {
    console.error('Kampanyalar alınırken hata:', err);
    res.status(500).send('Sunucu hatası');
  }
});

// Sağlık testi
app.get('/', (req, res) => {
  res.send('Garanti API çalışıyor!');
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`✅ Garanti server http://localhost:${port} üzerinde çalışıyor`);
});
