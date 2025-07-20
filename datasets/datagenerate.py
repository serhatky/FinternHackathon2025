import os
import pandas as pd
import random
from faker import Faker
from datetime import timedelta
fake = Faker("tr_TR")
random.seed(42)
# Proje parametreleri
NUM_GLOBAL_CUSTOMERS = 500
BANKS = ["fibabanka", "ziraat", "akbank", "garanti", "yapikredi"]
CUSTOMERS_PER_BANK = 200
ACCOUNTS_PER_BANK = 300
CARDS_PER_BANK = 300
CAMPAIGNS_PER_BANK = 50
MERCHANT_NAMES = [
   "Migros", "A101", "BIM", "LC Waikiki", "Zara", "Trendyol", "Hepsiburada",
   "Amazon", "MediaMarkt", "Teknosa", "Shell", "Opet", "Getir", "Burger King",
   "Domino's", "Carrefour", "Watsons", "Gratis", "Vatan", "İkea"
]
CATEGORIES = ["Market", "Giyim", "Elektronik", "Yemek", "Ulaşım"]
def setup_directories():
   os.makedirs("data", exist_ok=True)
   os.makedirs("data/common", exist_ok=True)
   for bank in BANKS:
       os.makedirs(f"data/{bank}", exist_ok=True)
def generate_global_customers():
   TURKISH_CITIES = [
       "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir",
       "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli",
       "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri",
       "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
       "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir",
       "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat",
       "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman",
       "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye",
       "Düzce"
   ]
   COMMON_OCCUPATIONS = [
       "Öğretmen", "Mühendis", "Doktor", "Hemşire", "Avukat", "Polis", "Muhasebeci", "Şoför", "İşçi", "Yazılımcı",
       "Teknisyen", "Satış Temsilcisi", "İnsan Kaynakları Uzmanı", "Pazarlamacı", "Kasiyer", "Garson", "Sekreter",
       "Çağrı Merkezi Temsilcisi", "Bankacı", "Mimar", "İç Mimar", "Psikolog", "Eczacı", "Diş Hekimi", "Rehber Öğretmen",
       "Lojistik Uzmanı", "Güvenlik Görevlisi", "Temizlik Görevlisi", "Elektrikçi", "Tesisatçı", "Makine Mühendisi",
       "Bilgisayar Mühendisi", "Endüstri Mühendisi", "İnşaat Mühendisi", "İş Analisti", "Veri Analisti", "Pazarlama Uzmanı",
       "Satın Alma Uzmanı", "Depo Elemanı", "Fizyoterapist", "Veteriner", "Ziraat Mühendisi", "Pilot", "Hostes",
       "Yönetici Asistanı", "Reklamcı", "Sigortacı", "Aşçı", "Grafiker", "Video Editörü", "Çevirmen", "Sosyal Medya Uzmanı"
   ]
   customers = []
   for i in range(1, NUM_GLOBAL_CUSTOMERS + 1):
       full_name = fake.name()
       first_name = full_name.split()[0]
       last_name = " ".join(full_name.split()[1:])
       gender = random.choice(["Erkek", "Kadın"])
       customers.append({
           "global_customer_id": f"CUST_{i:04d}",
           "name": full_name,
           "gender": gender,
           "age": random.randint(18, 70),
           "occupation": random.choice(COMMON_OCCUPATIONS),
           "city": random.choice(TURKISH_CITIES),
           "email": fake.email(),
           "phone": fake.phone_number(),
           "monthly_income": random.randint(10000, 50000),
           "credit_score": random.randint(300, 850),
           "creation_date": fake.date_between(start_date='-10y', end_date='today')
       })
   df = pd.DataFrame(customers)
   df.to_csv("data/global_customers.csv", index=False)
   print("✅ global_customers.csv")
def generate_customer_bank_map():
   global_df = pd.read_csv("data/global_customers.csv")
   rows = []
   for _, row in global_df.iterrows():
       gid = row["global_customer_id"]
       num_banks = random.choices([1, 2, 3, 4], weights=[0.1, 0.2, 0.4, 0.3])[0]  # %40 tek banka, %30 iki banka, ...
       selected_banks = random.sample(BANKS, k=num_banks)
       for bank in selected_banks:
           rows.append({"global_customer_id": gid, "bank_id": bank})
   df = pd.DataFrame(rows)
   df.to_csv("data/customer_bank_map.csv", index=False)
   print("✅ customer_bank_map.csv (çoklu banka dağılımlı)")
def generate_bank_customers():
   map_df = pd.read_csv("data/customer_bank_map.csv")
   for bank in BANKS:
       gids = map_df[map_df["bank_id"] == bank]["global_customer_id"]
       rows = []
       for i, gid in enumerate(gids):
           rows.append({
               "bank_customer_id": f"{bank}_{i+1}",
               "global_customer_id": gid,
               "bank_id": bank,
               "registration_date": fake.date_between(start_date='-5y', end_date='today'),
               "risk_score": random.randint(1, 100)
           })
       df = pd.DataFrame(rows)
       df.to_csv(f"data/{bank}/{bank}_customers.csv", index=False)
       print(f"✅ {bank}_customers.csv")
def generate_bank_accounts_cards_campaigns():
   card_features = ["Classic", "Gold", "Platinum", "Black", "Business"]
   merchants_df = pd.read_csv("data/common/merchants.csv")
   customer_bank_map = pd.read_csv("data/customer_bank_map.csv")
   # Her bankaya ait kart listelerini ayrı tut
   bank_cards = {bank: [] for bank in BANKS}
   for gid in customer_bank_map["global_customer_id"].unique():
       banks = customer_bank_map[customer_bank_map["global_customer_id"] == gid]["bank_id"].tolist()
       num_cards = random.randint(2, 4)
       chosen_banks = random.choices(banks, k=num_cards)  # Aynı bankadan birden çok kart olabilir
       for i, bank in enumerate(chosen_banks):
           cust_df = pd.read_csv(f"data/{bank}/{bank}_customers.csv")
           bank_customer_id = cust_df[cust_df["global_customer_id"] == gid]["bank_customer_id"].values
           if len(bank_customer_id) == 0:
               continue  # Bu bankada kayıtlı değilse atla
           bank_customer_id = bank_customer_id[0]
           card_id = f"{bank}CARD{gid}_{i+1}"
           card = {
               "card_id": card_id,
               "bank_customer_id": bank_customer_id,
               "card_type": random.choice(["Kredi", "Banka"]),
               "card_limit": round(random.uniform(3000, 80000), 2),
               "available_limit": round(random.uniform(500, 70000), 2),
               "statement_date": fake.date_this_month(),
               "due_date": fake.date_this_month() + timedelta(days=random.randint(5, 20)),
               "card_provider": random.choice(card_features),
               "bank_id": bank
           }
           bank_cards[bank].append(card)
   # Tüm bankalar için kartları dosyaya yaz
   for bank, cards in bank_cards.items():
       cards_df = pd.DataFrame(cards)
       cards_df.to_csv(f"data/{bank}/{bank}_cards.csv", index=False)
       print(f"\n📦 {bank.upper()} kart örnekleri:")
       print(cards_df[["card_id", "bank_customer_id", "card_type", "card_provider"]].head(10))
       # Kampanyaları oluştur
       campaigns = []
       for i in range(CAMPAIGNS_PER_BANK):
           if cards_df.empty:
               continue
           merchant = merchants_df.sample(1).iloc[0]
           campaigns.append({
               "campaign_id": f"{bank}CAMP{i+1}",
               "card_id": random.choice(cards_df["card_id"]),
               "merchant_id": merchant["merchant_id"],
               "category": merchant["category_id"],
               "title": fake.catch_phrase(),
               "description": fake.sentence(),
               "condition": f"{random.choice([150, 250, 300, 500])} TL ve üzeri alışveriş",
               "benefit_amount": random.choice([25, 50, 100, 150]),
               "start_date": fake.date_between(start_date='-15d', end_date='today'),
               "end_date": fake.date_between(start_date='today', end_date='+30d'),
               "bank_id": bank
           })
       pd.DataFrame(campaigns).to_csv(f"data/{bank}/{bank}_campaigns.csv", index=False)
       print(f"✅ {bank} kartlar ve kampanyalar oluşturuldu.")
def generate_merchants():
   os.makedirs("data/common", exist_ok=True)
   category_ids = [f"CAT_{i+1}" for i in range(len(CATEGORIES))]
   category_df = pd.DataFrame({
       "category_id": category_ids,
       "name": CATEGORIES
   })
   category_df.to_csv("data/common/merchant_categories.csv", index=False)
   merchants = []
   for i, name in enumerate(MERCHANT_NAMES):
       merchants.append({
           "merchant_id": f"MERCH_{i+1}",
           "name": name,
           "category_id": random.choice(category_ids)
       })
   merchants_df = pd.DataFrame(merchants)
   merchants_df.to_csv("data/common/merchants.csv", index=False)
   print("✅ merchants.csv ve merchant_categories.csv")
# Ana çalıştırma
if _name_ == "_main_":
   setup_directories()
   generate_global_customers()
   generate_merchants()
   generate_customer_bank_map()
   generate_bank_customers()
   generate_bank_accounts_cards_campaigns()
   print("🎉 Tüm veriler başarıyla oluşturuldu.")