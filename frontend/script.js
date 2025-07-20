let globalCustomerId = null;

const BANK_SERVERS = [
  { name: "fibabanka", url: "http://localhost:5001" },
  { name: "garanti", url: "http://localhost:5002" }
];

// 🎯 Sektör → Mağaza eşlemesi
const sectorStoreMap = {
  "Market": ["Migros", "Carrefour", "Şok", "A101", "BİM", "HappyCenter", "File Market", "Ekomini"],
  "Giyim": ["LC Waikiki", "Zara", "H&M", "Mavi", "Defacto", "Koton", "Colins", "Bershka"],
  "Teknoloji": ["Teknosa", "Vatan", "MediaMarkt", "Hepsiburada", "Samsung Store", "Apple Store", "Casper", "Monster"],
  "Eğlence": ["Cinemaximum", "Netflix", "BluTV", "Game+ Store", "Tiyatrom", "DijitalPark", "GoKart", "Escape House"],
  "Kozmetik": ["Gratis", "Watsons", "Sephora", "Rossmann", "T-Shop", "Farmasi", "The Body Shop", "Golden Rose"],
  "Sağlık": ["Eczane1", "Eczane2", "Medicana", "Acıbadem", "DentGroup", "Liv Hospital", "Memorial", "City Hospital"],
  "Eğitim": ["Kariyer.net", "Udemy", "Coursera", "EgitimSepeti", "Enocta", "Boğaziçi Yayınları", "İstanbul Eğitim", "EduGlobal"],
  "Petrol": ["Opet", "Shell", "BP", "Petrol Ofisi", "Total", "Aytemiz", "Petline", "Sunpet"]
};

window.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('loginModal');
  const userSelect = document.getElementById('userSelect');
  const confirmButton = document.getElementById('confirmUser');

  confirmButton.addEventListener('click', () => {
    const selectedUser = userSelect.value;
    if (!selectedUser) return alert("Lütfen bir kullanıcı seçin");
    globalCustomerId = selectedUser;

    loginModal.style.display = 'none';
    loadCards();
    loadStores();
  });
});

const cardSliderDiv = document.getElementById('cardSlider');
const categorySelect = document.getElementById('category');
const storeSelect = document.getElementById('store');
const amountInput = document.getElementById('amount');
const calculateButton = document.getElementById('calculateButton');
const campaignListUl = document.getElementById('campaignList');
const smartSelectButton = document.getElementById('smartSelectButton');
const smartSelectionResultDiv = document.getElementById('smartSelectionResult');
const recommendedCardDiv = document.getElementById('recommendedCard');

async function loadCards() {
  cardSliderDiv.innerHTML = '';

  for (const bank of BANK_SERVERS) {
    try {
      const res = await fetch(`${bank.url}/api/cards?global_customer_id=${globalCustomerId}`);
      const cards = await res.json();

      if (!cards || cards.length === 0) continue;

      cards.forEach(card => {
        const cardItem = document.createElement('div');
        cardItem.classList.add('card-item');

        let backgroundStyle = "";
        if (card.bank_id === "garanti") {
          backgroundStyle = "linear-gradient(to right, #4CAF50, #ffffff)";
        } else if (card.bank_id === "fibabanka") {
          backgroundStyle = "linear-gradient(to right, #4ba3c7, #2b6777)";
        } else {
          backgroundStyle = "linear-gradient(to right, #888, #ccc)";
        }

        cardItem.innerHTML = `
          <div class="card-inner" style="
            background: ${backgroundStyle};
            color: black; padding: 20px; border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            animation: fadeInUp 0.6s ease forwards;
            transform: translateY(20px);
          ">
            <div style="font-size: 24px; font-weight: bold;">💳 ${card.card_provider}</div>
            <div style="font-size: 14px; margin-top: 8px;">🏦 ${card.bank_id}</div>
            <div style="font-size: 13px; margin-top: 4px;">🆔 ${card.card_id}</div>
          </div>
        `;
        cardSliderDiv.appendChild(cardItem);
      });
    } catch (err) {
      console.error(`❌ ${bank.name} kartları alınamadı:`, err);
    }
  }
}

function loadStores() {
  categorySelect.innerHTML = '';
  for (const sector in sectorStoreMap) {
    const option = document.createElement('option');
    option.value = sector;
    option.textContent = sector;
    categorySelect.appendChild(option);
  }

  updateStoreOptions(categorySelect.value);
  categorySelect.addEventListener('change', () => {
    updateStoreOptions(categorySelect.value);
  });
}

function updateStoreOptions(sector) {
  storeSelect.innerHTML = '';
  const stores = sectorStoreMap[sector] || [];
  stores.forEach(store => {
    const option = document.createElement('option');
    option.value = store;
    option.textContent = store;
    storeSelect.appendChild(option);
  });
}

async function calculateCampaigns() {
  const category = categorySelect.value;
  const store = storeSelect.value;
  const amount = parseFloat(amountInput.value);
  if (!category || !store || isNaN(amount)) return alert('Lütfen tüm alanları doldurun');

  campaignListUl.innerHTML = '';
  smartSelectionResultDiv.style.display = 'none';

  let allCampaigns = [];

  for (const bank of BANK_SERVERS) {
    try {
      const resCards = await fetch(`${bank.url}/api/cards?global_customer_id=${globalCustomerId}`);
      const cards = await resCards.json();

      for (const card of cards) {
        const resCamp = await fetch(`${bank.url}/api/campaigns?card_id=${card.card_id}&amount=${amount}&store=${store}&category=${category}`);
        const campaigns = await resCamp.json();

        if (campaigns && campaigns.length > 0) {
          campaigns.forEach(camp => {
            allCampaigns.push({
              bank: card.bank_id,
              card: card.card_provider,
              benefit: camp.benefit_amount,
              campaign_id: camp.campaign_id,
              condition: camp.condition || null,
              end_date: camp.end_date || null,
              flash: camp.flash || false
            });
          });
        } else {
          // Sahte kampanya üret
          const fakeCount = Math.floor(Math.random() * 5) + 3;
          const now = new Date();

          for (let i = 0; i < fakeCount; i++) {
            const randomBenefit = Math.floor(Math.random() * 40) + 10;
            const hasCondition = Math.random() < 0.5;
            const isFlashDeal = Math.random() < 0.3;
            const daysAhead = Math.floor(Math.random() * 10);
            const endDate = new Date(now);
            endDate.setDate(now.getDate() + daysAhead);

            const fakeCampaign = {
              bank: card.bank_id,
              card: card.card_provider,
              benefit: randomBenefit,
              campaign_id: `FAKE-${card.card_id}-${i}`,
              condition: hasCondition ? `En az ${Math.floor(Math.random() * 200 + 300)} TL harcama` : null,
              end_date: endDate.toISOString().split("T")[0],
              flash: isFlashDeal
            };

            allCampaigns.push(fakeCampaign);
          }
        }
      }

    } catch (err) {
      console.error(`❌ ${bank.name} kampanya sorgusu hatası:`, err);
    }
  }

  allCampaigns.sort((a, b) => b.benefit - a.benefit);

  if (allCampaigns.length > 0) {
    allCampaigns.forEach(item => {
      const li = document.createElement('li');

      let extraNote = "";
      if (item.condition) extraNote += ` - <em>${item.condition}</em>`;
      if (item.end_date) {
        const today = new Date();
        const end = new Date(item.end_date);
        const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) extraNote += ` - <span style="color:red">Son ${diffDays} gün!</span>`;
      }
      if (item.flash) extraNote += ` - <span style="color:orange">Anlık fırsat!</span>`;

      li.innerHTML = `<strong>${item.bank} ${item.card}</strong>: ${item.benefit} TL kazanç ${extraNote}`;
      campaignListUl.appendChild(li);
    });
    smartSelectButton.style.display = 'block';
  } else {
    campaignListUl.innerHTML = '<li>Uygun kampanya bulunamadı.</li>';
    smartSelectButton.style.display = 'none';
  }
}

async function performSmartSelection() {
  const category = categorySelect.value;
  const store = storeSelect.value;
  const amount = parseFloat(amountInput.value);

  try {
    // Loading göstergesi ekle
    smartSelectionResultDiv.style.display = 'block';
    recommendedCardDiv.innerHTML = '<p>AI analizi yapılıyor... 🤖</p>';

    const res = await fetch('http://localhost:5005/api/ai/recommendation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        global_customer_id: globalCustomerId, 
        category, 
        store, 
        amount 
      })
    });

    // HTTP durum kodunu kontrol et
    if (!res.ok) {
      throw new Error(`HTTP Hatası: ${res.status} - ${res.statusText}`);
    }

    const result = await res.json();
    
    // Sonucu kontrol et
    if (!result) {
      throw new Error('AI servisinden boş yanıt alındı');
    }

    displaySmartRecommendation(result);
    
  } catch (error) {
    console.error('AI recommendation hatası:', error);
    
    // Kullanıcıya daha açıklayıcı hata mesajı göster
    smartSelectionResultDiv.style.display = 'block';
    
    let errorMessage = 'AI önerisi alınamadı. ';
    
    if (error.message.includes('Failed to fetch')) {
      errorMessage += 'AI servisi çalışmıyor olabilir (localhost:5005 kontrol edin).';
    } else if (error.message.includes('HTTP Hatası')) {
      errorMessage += `Sunucu hatası: ${error.message}`;
    } else {
      errorMessage += `Detay: ${error.message}`;
    }
    
    recommendedCardDiv.innerHTML = `
      <div style="color: #d32f2f; padding: 15px; background: #ffebee; border-radius: 8px; border-left: 4px solid #d32f2f;">
        <strong>⚠️ Hata:</strong> ${errorMessage}
        <br><br>
        <small>En yüksek kazançlı kampanyayı yukarıdaki listeden seçebilirsiniz.</small>
      </div>
    `;
    
    // Alternatif: En iyi kampanyayı otomatik öner
    suggestBestCampaignAlternative();
  }
}


// displaySmartRecommendation fonksiyonunu şu şekilde güncelleyin:
function displaySmartRecommendation(data) {
  console.log('AI Response:', data); // Debug için
  
  smartSelectionResultDiv.style.display = 'block';
  
  // Farklı AI response formatlarını kontrol et
  if (data && (data.card_provider || data.recommended_card)) {
    
    // Veriyi normalize et
    const cardInfo = {
      bank: data.bank_id || data.bank || 'Bilinmeyen Banka',
      cardProvider: data.card_provider || data.recommended_card || data.card_name || 'Bilinmeyen Kart',
      benefit: data.benefit_amount || data.expected_benefit || data.benefit || '0',
      reason: data.reason || data.explanation || data.message || 'Bu kart sizin için en uygun seçim.'
    };
    
    recommendedCardDiv.innerHTML = `
      <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 12px;">
        <h3 style="margin: 0 0 15px 0;">🤖 AI Önerisi</h3>
        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="font-size: 18px; font-weight: bold; margin: 0;">
            ${cardInfo.bank} ${cardInfo.cardProvider}
          </p>
          <p style="margin: 8px 0; font-size: 16px;">
            Beklenen avantaj: <strong>${cardInfo.benefit} TL</strong>
          </p>
        </div>
        <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px;">
          <strong>Açıklama:</strong><br>
          ${cardInfo.reason}
        </div>
      </div>
    `;
    
  } else if (data && data.message) {
    
    recommendedCardDiv.innerHTML = `
      <div style="padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404;">
        <strong>ℹ️ Bilgi:</strong> ${data.message}
      </div>
    `;
    
  } else {
    
    // Eğer AI response boş veya hatalıysa, en iyi kampanyayı manuel olarak öner
    console.warn('AI response eksik, alternatif öneri yapılıyor:', data);
    
    recommendedCardDiv.innerHTML = `
      <div style="padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px;">
        <strong>🤖 AI Analizi:</strong> Teknik bir sorun oluştu.<br>
        <small>En iyi seçeneği manuel olarak belirleyeceğiz...</small>
      </div>
    `;
    
    // Alternatif öneri sistemini çalıştır
    setTimeout(() => {
      suggestBestCampaignAlternative();
    }, 1000);
  }
}


function showAIModal(message) {
  document.getElementById('aiModalText').textContent = message;
  document.getElementById('aiModal').style.display = 'flex';
}

function handleUserResponse(response) {
  document.getElementById('aiModal').style.display = 'none';
  alert(`Kullanıcı ${response.toUpperCase()} dedi!`);
}

calculateButton.addEventListener('click', calculateCampaigns);
smartSelectButton.addEventListener('click', performSmartSelection);

// Animasyon
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}`;
document.head.appendChild(style);
async function suggestBestCampaignAlternative() {
  const category = categorySelect.value;
  const store = storeSelect.value;
  const amount = parseFloat(amountInput.value);
  
  let allCampaigns = [];
  
  // Mevcut kampanyaları topla
  for (const bank of BANK_SERVERS) {
    try {
      const resCards = await fetch(`${bank.url}/api/cards?global_customer_id=${globalCustomerId}`);
      const cards = await resCards.json();

      for (const card of cards) {
        const resCamp = await fetch(`${bank.url}/api/campaigns?card_id=${card.card_id}&amount=${amount}&store=${store}&category=${category}`);
        const campaigns = await resCamp.json();

        if (campaigns && campaigns.length > 0) {
          campaigns.forEach(camp => {
            allCampaigns.push({
              bank: card.bank_id,
              card: card.card_provider,
              benefit: camp.benefit_amount,
              campaign_id: camp.campaign_id,
              condition: camp.condition || null,
              flash: camp.flash || false
            });
          });
        }
      }
    } catch (err) {
      console.error(`Kampanya alınamadı: ${bank.name}`, err);
    }
  }
  
  // En yüksek kazançlı kampanyayı bul
  if (allCampaigns.length > 0) {
    const bestCampaign = allCampaigns.sort((a, b) => b.benefit - a.benefit)[0];
    
    const fallbackHtml = `
      <div style="margin-top: 15px; padding: 15px; background: #e8f5e8; border-radius: 8px; border-left: 4px solid #4caf50;">
        <strong>💡 Alternatif Öneri:</strong><br>
        <div style="margin-top: 8px;">
          <strong>${bestCampaign.bank} ${bestCampaign.card}</strong><br>
          Kazanç: <strong>${bestCampaign.benefit} TL</strong>
          ${bestCampaign.condition ? `<br><small>${bestCampaign.condition}</small>` : ''}
          ${bestCampaign.flash ? '<br><span style="color: orange;">⚡ Anlık Fırsat</span>' : ''}
        </div>
      </div>
    `;
    
    recommendedCardDiv.innerHTML += fallbackHtml;
  }
  // Frontend kodunuzda
async function generateReport() {
  try {
    const response = await fetch('http://localhost:5005/financial-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        global_customer_id: 'test1' // Dinamik olacak
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Raporu göster
      displayReport(data.data);
    } else {
      console.error('Rapor hatası:', data.error);
    }
  } catch (error) {
    console.error('API hatası:', error);
  }
}
}