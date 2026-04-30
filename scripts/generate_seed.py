"""
Etimesgut_Oto_Rehberi_Gruplanmis_Son.xlsx dosyasından
≥ 4.5 puanlı ve oto-ile ilgili ustaları filtreleyip Supabase'e yüklenecek SQL üretir.

Kullanım:
  python scripts/generate_seed.py

Çıktı: supabase/seed_data.sql

Yapılan filtreler:
  1. Puan >= 4.5
  2. Oto-dışı işletmeleri ele (telefon, beyaz eşya, TV, cilingir vs.)
  3. Akıllı kategori tahmini (isim + google_category'ye bakarak 7 kategoriden birini seç)

Yeni kategoriler:
  mekanik     — motor, tamir, bakım
  kaporta     — kaporta, boya, göçük
  elektrik    — oto elektrik, klima, ABS, beyin
  lastik      — lastik, jant, balans, rot
  ekspertiz   — oto ekspertiz, muayene
  yikama      — yıkama, detailing, cila, kuaför
  servis      — markaya özel servisler (Mercedes, BMW, VW vb.)
"""

import openpyxl
import re
from pathlib import Path

EXCEL_PATH = Path(r"C:\Users\Kerem SOYLU\Downloads\Etimesgut_Oto_Rehberi_Gruplanmis_Son.xlsx")
OUTPUT_PATH = Path(__file__).parent.parent / "supabase" / "seed_data.sql"
MIN_RATING = 4.5

# Türkçe karakter normalize
def normalize(s):
    if not s: return ""
    return s.lower().translate(str.maketrans({
        'ç':'c','ğ':'g','ı':'i','İ':'i','ö':'o','ş':'s','ü':'u',
        'Ç':'c','Ğ':'g','I':'i','Ö':'o','Ş':'s','Ü':'u',
    }))

# 1) Net otomobil-DIŞI google_category'leri: bunları her zaman ele
NON_AUTO_CATEGORIES = {
    "Beyaz Esya Tamirhanesi",
    "Cep Telefonu Tamir Atolyesi",
    "Cep telefonu magazasi",
    "Telefon Onarim Hizmeti",
    "Bilgisayar Tamir Servisi",
    "Televizyon Tamir Servisi",
    "Aydinlatma Magazasi",
    "Plastik Pencere Magazasi",
    "Pencere Montaj Hizmeti",
    "Yapi Market",
    "Ev Esyalari Magazasi",
    "Isitma Sistemleri",
    "Elektronik esya magazasi",
    "Plastik Urun Tedarikcisi",
    "Otobus Firmasi",
    "Oyuncak magazasi",
}

# 2) İsimde geçerse otomobil-DIŞI sayılan kelimeler (oto-keyword yoksa elenir)
NON_AUTO_NAME_HINTS = [
    "telefon", "iphone", "samsung", "xiaomi", "vodafone", "turkcell",
    "tv tamir", "televizyon", "beyaz esya", "cep shop",
    "kombi servisi", "klima servisi" if False else None,  # not "klima" alone
    "pimapen", "winsa pvc", "sineklik",
    "anahtar", "cilingir",
    "avize", "elektronik",
]
NON_AUTO_NAME_HINTS = [n for n in NON_AUTO_NAME_HINTS if n]

# 3) İsimde geçerse otomobil-IÇI olduğu kesinleşen kelimeler
AUTO_NAME_HINTS = [
    "oto ", "oto.", "oto/", "otomotiv", "otomobil", "araç", "araba", "arac",
    "motor", "motorsiklet", "motosiklet",
    "lastik", "jant", "rot balans", "balans",
    "kaporta", "boya", "göçük", "gocuk", "hasar",
    "egzoz", "şanzıman", "sanziman",
    "yağ değişim", "yag degisim", "madeni yag",
    "yedek parça", "yedek parca", "yedekparca",
    "ekspertiz", "muayene",
    "yıkama", "yikama", "detailing", "cila", "ppf", "kaplama", "cam filmi",
    "frenci", "fren", "balata", "akü", "aku", "sarj istasyonu", "elektrikli arac",
    "abs", "beyin", "airbag", "klima gazi", "tuning", "chip", "ozel servis",
    "garage", "garaj", "service", "servis",
    "mercedes", "bmw", "audi", "volkswagen", "vw ", "skoda", "seat", "porsche",
    "ford", "renault", "reno ", "peugeot", "citroen", "opel", "fiat", "honda",
    "toyota", "nissan", "hyundai", "kia", "volvo", "isuzu", "subaru",
    "land rover", "range rover", "mini cooper", "dacia", "alfa romeo", "alfom",
    "cekici", "cekme", "yol yardim",
    "lpg", "dizel", "enjektor",
    "rot ", " rot", "balans",
]

# Otomotiv ile ilgisi olan google_category'ler (whitelist — bunlar her zaman geçer)
AUTO_CATEGORIES = {
    "Oto Tamirhanesi", "Oto Tamir Atolyesi", "Arac Bakim ve Onarimi",
    "Oto Lastik Dukkani", "Oto Lastik Magazasi", "Lastikci", "Lastik Tamircisi",
    "Oto Elektrik Hizmeti",
    "Otomobil Yedek Parca Magazasi", "Otomobil Fren/Debriyaj Yedek Parca Dukkani",
    "Otomobil Restorasyon Hizmeti", "Otomobil Boyama", "Otomobil Kaporta Tamircisi",
    "Oto Kaporta Duzeltme Servisi", "Oto Kaporta Dukkani",
    "Arac Muayene Istasyonu", "Arac Muayene Hizmeti",
    "Araba Yikama", "Self Servis Oto Yikama", "Detayli Arac Temizlik Hizmeti",
    "Araba Hizmeti", "Arac Kaplama Hizmeti", "Arac Aksesuarlari Magazasi",
    "Oto Cam Filmcisi", "Oto Aksesuar Toptancisi", "Oto Dosemeci",
    "Oto Galeri", "Oto Radyator Tamir Servisi",
    "Sanziman Atolyesi", "Motor Yenileme Servisi", "Dizel Motor Tamir Hizmeti",
    "Rot Balans Servisi", "Otomobil Parcasi Pazari",
    "Arac Aku Magazasi", "Elektrikli Arac Sarj Istasyonu",
    "Motosiklet Tamir Dukkani", "Kucuk Motor Tamir Servisi",
    "Cekici Hizmeti", "LPG Donusumu",
    "Takim Tamir Atolyesi",  # bazı oto tamirciler bu kategoride
}

# Belirsiz google_category'ler — sadece ismi oto-ile ilgiliyse al
AMBIGUOUS_CATEGORIES = {
    "Tamir Servisi", "Elektrikci", "Klima Tamir Servisi",
    "Elektrik Tesisati Hizmeti", "Elektronik Tamir Dukkani",
}

def is_auto_business(name, google_category):
    """Kayıt otomobille ilgili mi? True → tut, False → ele."""
    norm_name = normalize(name)
    norm_cat = google_category or ""

    # 1. Net non-auto kategoriler → her zaman ele
    if norm_cat in NON_AUTO_CATEGORIES:
        # ama ismi açıkça oto ise (örn: "Oto Kilit"), tut
        if any(h in norm_name for h in AUTO_NAME_HINTS):
            return True
        return False

    # 2. İsimde non-auto ipucu varsa ele (oto ipucu yoksa)
    has_auto_hint = any(h in norm_name for h in AUTO_NAME_HINTS)
    has_non_auto_hint = any(h in norm_name for h in NON_AUTO_NAME_HINTS)
    if has_non_auto_hint and not has_auto_hint:
        return False

    # 3. Net auto kategoriler → tut
    if norm_cat in AUTO_CATEGORIES:
        return True

    # 4. Belirsiz kategoriler → sadece ismi oto-ile alakalıysa tut
    if norm_cat in AMBIGUOUS_CATEGORIES:
        return has_auto_hint

    # 5. Bilinmeyen kategori — name'de oto ipucu varsa tut
    return has_auto_hint

def categorize(name, google_category, original_sector):
    """Akıllı kategori tahmini. 7 yeni kategoriden birini döndür."""
    norm_name = normalize(name)
    norm_cat = normalize(google_category or "")

    # Marka isimleri → servis (özel servis)
    BRAND_NAMES = ["mercedes", "bmw", "audi", "volkswagen", "vw ", "skoda", "seat",
                   "porsche", "ford", "renault", "reno", "peugeot", "citroen",
                   "opel", "fiat", "honda", "toyota", "nissan", "hyundai", "kia",
                   "volvo", "isuzu", "subaru", "land rover", "range rover",
                   "mini cooper", "dacia", "alfa", "alfom", "tata"]
    if any(b in norm_name for b in BRAND_NAMES) and ("servis" in norm_name or "ozel" in norm_name):
        return "servis"

    # Ekspertiz / muayene
    if "ekspertiz" in norm_name or "muayene" in norm_cat or "ekspertiz" in norm_cat:
        return "ekspertiz"

    # Yıkama / detailing
    if any(k in norm_name for k in ["yikama", "yıkama", "detailing", "cila", "pasta", "kuafor"]) \
       or "yikama" in norm_cat or "temizlik" in norm_cat:
        return "yikama"

    # Lastik / jant
    if any(k in norm_name for k in ["lastik", "jant", "rot balans", "balans"]) \
       or "lastik" in norm_cat or "rot balans" in norm_cat:
        return "lastik"

    # Kaporta / boya
    if any(k in norm_name for k in ["kaporta", "boya", "gocuk", "göçük", "hasar onarim", "ppf", "cam filmi", "kaplama"]) \
       or "kaporta" in norm_cat or "boyama" in norm_cat or "kaplama" in norm_cat:
        return "kaporta"

    # Elektrik / klima
    if any(k in norm_name for k in ["elektrik", "klima", "abs", "beyin", "airbag", "chip", "tuning"]) \
       or "elektrik" in norm_cat or "elektrikci" in norm_cat:
        return "elektrik"

    # Marka servisi (isim + diğer ipucular yoksa)
    if any(b in norm_name for b in BRAND_NAMES):
        return "servis"

    # Default → mekanik (motor, tamir, bakım)
    return "mekanik"

# Etimesgut'taki bilinen mahalleler
NEIGHBORHOODS = [
    "Bahçekapı", "Bahcekapi", "Bağlıca", "Baglica", "Eryaman", "Erler",
    "Eldek", "Elvankent", "Yapracık", "Yapracik", "Yeşilova", "Yesilova",
    "Sasmaz", "Şaşmaz", "Süvari", "Suvari", "Oğuzlar", "Oguzlar",
    "Ayyıldız", "Ayyildiz", "Ahimesut", "Ahi Mesut", "Topçu", "Topcu",
    "Devlet", "Atayurt", "Etiler", "Fatih", "Göksu", "Goksu",
    "Güzelkent", "Guzelkent", "Şeker", "Seker", "Türkkonut", "Turkkonut",
    "Erzincan", "Yarımca", "Yarimca", "Piyade", "Bağlıkkaya", "Baglikkaya",
    "Yeni Yayla", "Altay", "Andiçen", "Alsancak", "Bağıvar", "Çakırlar",
]

def extract_neighborhood(address):
    if not address:
        return None
    norm_addr = normalize(address)
    best = None
    for nb in NEIGHBORHOODS:
        if normalize(nb) in norm_addr:
            if best is None or len(nb) > len(best):
                best = nb
    return best

def sql_str(s):
    if s is None or s == "":
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"

def sql_num(n):
    if n is None:
        return "NULL"
    return str(n)

def main():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    ws = wb["Sheet1"]

    rows = []
    skipped_low_rating = 0
    skipped_non_auto = 0

    sector_counts = {}

    for row in ws.iter_rows(min_row=2, values_only=True):
        name, sektor, puan, yorum, telefon, adres, calisma, kategori = row
        if not name:
            continue

        if puan is None or float(puan) < MIN_RATING:
            skipped_low_rating += 1
            continue

        if not is_auto_business(name, kategori):
            skipped_non_auto += 1
            continue

        sector_id = categorize(name, kategori, sektor)
        sector_counts[sector_id] = sector_counts.get(sector_id, 0) + 1

        nb = extract_neighborhood(adres)

        rows.append({
            "name": name.strip(),
            "sector": sector_id,
            "google_category": kategori,
            "rating": float(puan),
            "review_count": int(yorum) if yorum is not None else None,
            "phone": (telefon or "").strip() or None,
            "address": (adres or "").strip() or None,
            "neighborhood": nb,
            "opening_hours": (calisma or "").strip() or None,
        })

    print(f"\n→ {len(rows)} usta seçildi (puan ≥ {MIN_RATING}, sadece oto-ile ilgili)")
    print(f"  · Düşük puan elendi: {skipped_low_rating}")
    print(f"  · Oto-dışı elendi:   {skipped_non_auto}")
    print(f"\n  Yeni kategori dağılımı:")
    for s, c in sorted(sector_counts.items(), key=lambda x: -x[1]):
        print(f"    {s:12s} {c:4d}")

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        f.write("-- Etimesgut Oto Rehberi seed verisi\n")
        f.write(f"-- {len(rows)} usta (puan ≥ {MIN_RATING}, oto-dışı işletmeler elendi)\n")
        f.write("-- Çalıştırmadan önce schema.sql çalışmış olmalı.\n\n")
        f.write("-- Önce mevcut verileri temizle (yeniden seed için)\n")
        f.write("delete from mechanics;\n\n")
        f.write("insert into mechanics (name, sector, google_category, rating, review_count, phone, address, neighborhood, opening_hours) values\n")
        lines = []
        for r in rows:
            lines.append(
                f"  ({sql_str(r['name'])}, {sql_str(r['sector'])}, {sql_str(r['google_category'])}, "
                f"{sql_num(r['rating'])}, {sql_num(r['review_count'])}, {sql_str(r['phone'])}, "
                f"{sql_str(r['address'])}, {sql_str(r['neighborhood'])}, {sql_str(r['opening_hours'])})"
            )
        f.write(",\n".join(lines))
        f.write(";\n")

    print(f"\n✓ {OUTPUT_PATH} yazıldı")

if __name__ == "__main__":
    main()
