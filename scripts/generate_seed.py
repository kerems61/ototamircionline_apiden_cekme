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
import json
from pathlib import Path

EXCEL_PATH = Path(r"C:\Users\Kerem SOYLU\Downloads\Etimesgut_Oto_Rehberi_Gruplanmis_Son.xlsx")
OUTPUT_PATH = Path(__file__).parent.parent / "supabase" / "seed_data.sql"
GEOCODE_CACHE_PATH = Path(__file__).parent.parent / "supabase" / "geocode_cache.json"
MIN_RATING = 4.5

# Google Places ile çekilmiş gerçek koordinatlar (varsa kullan)
GEOCODE_CACHE = {}
if GEOCODE_CACHE_PATH.exists():
    GEOCODE_CACHE = json.loads(GEOCODE_CACHE_PATH.read_text(encoding="utf-8"))

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
    "telefon", "iphone", "samsung", "xiaomi", "vodafone", "turkcell", "huawei",
    "tv tamir", "televizyon", "beyaz esya", "cep shop", "cep telefonu",
    "kombi", "ariston", "vestel", "arcelik", "bosch servis",  # ev aletleri markaları
    "pimapen", "winsa pvc", "sineklik", "pencere",
    "anahtar", "cilingir",
    "avize", "aydinlatma",
    "ev esya", "ev esyasi", "elektronik esya",
    "panasonic", "lg", "sony", "philips",
    "bilgisayar tamir", "laptop", "elektronik tamir",
    "isitma", "kombi servisi",
]

# 3) İsimde geçerse otomobil-IÇI olduğu kesinleşen kelimeler (GÜÇLÜ — non-auto kategoriyi override eder)
STRONG_AUTO_KEYWORDS = [
    "oto ", "oto.", "oto/", "otomotiv", "otomobil", "araç", "araba", "arac",
    "lastik", "jant", "rot balans",
    "kaporta", "gocuk", "göçük", "boyasiz",
    "egzoz", "şanzıman", "sanziman",
    "yağ değişim", "yag degisim", "madeni yag",
    "yedek parça", "yedek parca", "yedekparca",
    "ekspertiz", "muayene",
    "detailing", "ppf", "cam filmi",
    "frenci", "balata", "abs", "beyin", "airbag", "klima gazi",
    "tuning", "chip", "petek temizlik",
    "akü", " aku ", "aku ", " aku",
    "cekici", "yol yardim",
    "lpg", "enjektor",
    "vagcom", "obd",
]

# 4) Marka isimleri (ek auto-ipucu, ama tek başına yeterli değil — başka oto-bağlam gerek)
BRAND_NAMES = [
    "mercedes", "bmw", "audi", "volkswagen", "skoda", "seat", "porsche",
    "ford", "renault", "peugeot", "citroen", "opel", "fiat", "honda",
    "toyota", "nissan", "hyundai", "kia", "volvo", "isuzu", "subaru",
    "land rover", "range rover", "mini cooper", "dacia", "alfa romeo",
    "tata", "iveco", "cupra", "porsche",
]

# 5) Yumuşak otomotiv ipuçları (belirsiz kategorilerde işe yarar)
SOFT_AUTO_HINTS = [
    "motor", "motorsiklet", "motosiklet",
    "yıkama", "yikama", "cila", "pasta cila",
    "service", "servis", "garage", "garaj",
    "mekanik", "tamir", "bakim", "bakım",
] + BRAND_NAMES

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

    has_strong_auto = any(h in norm_name for h in STRONG_AUTO_KEYWORDS)
    has_soft_auto = any(h in norm_name for h in SOFT_AUTO_HINTS)
    has_non_auto = any(h in norm_name for h in NON_AUTO_NAME_HINTS)

    # 1. Net non-auto kategoriler → sadece GÜÇLÜ oto sinyali varsa tut
    if norm_cat in NON_AUTO_CATEGORIES:
        return has_strong_auto  # "servis" veya "garage" yetmez, "oto" / "araç" / "ekspertiz" gerek

    # 2. İsimde net non-auto ipucu varsa, güçlü oto sinyali yoksa ele
    if has_non_auto and not has_strong_auto:
        return False

    # 3. Net auto kategoriler → tut (zaten otomotiv kategorisi)
    if norm_cat in AUTO_CATEGORIES:
        return True

    # 4. Belirsiz kategoriler → güçlü VEYA yumuşak oto sinyali varsa tut
    if norm_cat in AMBIGUOUS_CATEGORIES:
        return has_strong_auto or has_soft_auto

    # 5. Bilinmeyen kategori → güçlü oto sinyali varsa tut
    return has_strong_auto

def categorize(name, google_category, original_sector):
    """Akıllı kategori tahmini — sıra önemli, en spesifikten en genele.
    7 kategoriden birini döndür: ekspertiz, yikama, kaporta, lastik, elektrik, servis, mekanik
    """
    norm_name = normalize(name)
    norm_cat = normalize(google_category or "")

    # 1) Ekspertiz / muayene (en spesifik)
    if "ekspertiz" in norm_name or "muayene" in norm_name \
       or "muayene" in norm_cat or "ekspertiz" in norm_cat:
        return "ekspertiz"

    # 2) Yıkama / detailing — LASTIKTEN ÖNCE çünkü yıkama+lastik kombo işletmeler
    #    asıl olarak yıkama hizmeti veriyor (örn: "Gidergelir GARAJ OTO YIKAMA OTO LASTIK")
    if any(k in norm_name for k in ["yikama", "detailing", "pasta cila", "kuafor", "pasta"]) \
       or any(k in norm_cat for k in ["yikama", "temizlik"]):
        return "yikama"

    # 3) Kaporta / boya / hasar
    if any(k in norm_name for k in ["kaporta", "boyasiz", "gocuk", "hasar onarim", "ppf", "cam filmi", "kaplama"]) \
       or any(k in norm_cat for k in ["kaporta", "boyama", "kaplama"]):
        return "kaporta"

    # 4) Lastik / jant
    if any(k in norm_name for k in ["lastik", "jant", "rot balans"]) \
       or "lastik" in norm_cat or "rot balans" in norm_cat:
        return "lastik"

    # 5) Elektrik / klima / ABS / beyin
    if any(k in norm_name for k in ["oto elektrik", "elektrik", "klima", "abs", "beyin", "airbag", "chip", "tuning", "vagcom"]) \
       or "elektrik" in norm_cat or "elektrikci" in norm_cat:
        return "elektrik"

    # 6) Marka özel servis (Mercedes/BMW/Audi vs. + "servis" veya "özel" anahtarı)
    has_brand = any(b in norm_name for b in BRAND_NAMES)
    if has_brand and any(k in norm_name for k in ["servis", "ozel", "service", "garage", "garaj"]):
        return "servis"

    # 7) Sadece marka adı var ama "servis" demiyor — yine de marka servisi say
    if has_brand:
        return "servis"

    # Default → mekanik (motor, tamir, bakım, genel)
    return "mekanik"

# Etimesgut mahalleleri — kanonik isim → tüm yazım varyantları
# Adresten hangi varyant bulunursa bulunsun, kanonik ismi döndür (tek mahalle = tek pil)
NEIGHBORHOODS_CANONICAL = {
    "Bahçekapı":  ["Bahçekapı", "Bahcekapi", "Bahce Kapi", "Bahcekapı"],
    "Bağlıca":    ["Bağlıca", "Baglica"],
    "Eryaman":    ["Eryaman"],
    "Erler":      ["Erler"],
    "Elvankent":  ["Elvankent", "Elvan"],
    "Yapracık":   ["Yapracık", "Yapracik"],
    "Yeşilova":   ["Yeşilova", "Yesilova", "Yesil ova", "Yeşil Ova"],
    "Şaşmaz":     ["Şaşmaz", "Sasmaz"],
    "Süvari":     ["Süvari", "Suvari"],
    "Oğuzlar":    ["Oğuzlar", "Oguzlar"],
    "Ayyıldız":   ["Ayyıldız", "Ayyildiz"],
    "Ahimesut":   ["Ahimesut", "Ahi Mesut", "Ahimesut Mahallesi"],
    "Topçu":      ["Topçu", "Topcu"],
    "Devlet":     ["Devlet"],
    "Atayurt":    ["Atayurt"],
    "Fatih":      ["Fatih"],
    "Göksu":      ["Göksu", "Goksu"],
    "Şeker":      ["Şeker", "Seker", "Sehit Osman Avci"],  # Şehit Osman Avcı genellikle Şeker'e yakın
    "Piyade":     ["Piyade"],
    "Alsancak":   ["Alsancak"],
    "Atakent":    ["Atakent"],
    "İstasyon":   ["İstasyon", "Istasyon", "Kazim Karabekir"],
    "30 Ağustos": ["30 Agustos", "30 Ağustos"],
    "Türkkonut":  ["Türkkonut", "Turkkonut"],
}

def extract_neighborhood(address):
    if not address:
        return None
    norm_addr = normalize(address)
    best_canonical = None
    best_len = 0
    for canonical, variants in NEIGHBORHOODS_CANONICAL.items():
        for v in variants:
            nv = normalize(v)
            if nv in norm_addr and len(nv) > best_len:
                best_canonical = canonical
                best_len = len(nv)
    return best_canonical

# Etimesgut mahalle merkez koordinatları (yaklaşık — Google Maps'ten alındı)
# Geocoding pahalı/yavaş olduğu için mahalle merkezine + isim hash'iyle deterministik offset koyuyoruz
NEIGHBORHOOD_CENTROIDS = {
    "Bahçekapı":  (39.9483, 32.7140),  # Şaşmaz oto sanayi yoğun
    "Şaşmaz":     (39.9430, 32.7050),
    "Bağlıca":    (39.9100, 32.6950),
    "Eryaman":    (39.9683, 32.6310),
    "Erler":      (39.9290, 32.7280),
    "Yeşilova":   (39.9580, 32.6800),
    "Süvari":     (39.9450, 32.6710),
    "Ahimesut":   (39.9520, 32.6940),
    "Oğuzlar":    (39.9520, 32.6790),
    "Ayyıldız":   (39.9560, 32.6830),
    "Topçu":      (39.9510, 32.6900),
    "Yapracık":   (39.9480, 32.6390),
    "Atayurt":    (39.9420, 32.6420),
    "Şeker":      (39.9670, 32.6280),
    "Alsancak":   (39.9620, 32.6750),
    "Piyade":     (39.9560, 32.6770),
    "Fatih":      (39.9430, 32.6580),
    "İstasyon":   (39.9580, 32.6780),
    "Göksu":      (39.9540, 32.6240),
    "Devlet":     (39.9650, 32.6320),
    "Elvankent":  (39.9610, 32.6590),
    "Atakent":    (39.9560, 32.6810),
    "30 Ağustos": (39.9590, 32.6650),
    "Türkkonut":  (39.9740, 32.6160),
}
ETIMESGUT_CENTER = (39.9558, 32.6790)

import hashlib
def get_lat_lng(neighborhood, name):
    """Mahalle merkezi + isim hash'inden deterministik küçük offset (~250m)."""
    if neighborhood and neighborhood in NEIGHBORHOOD_CENTROIDS:
        base_lat, base_lng = NEIGHBORHOOD_CENTROIDS[neighborhood]
    else:
        base_lat, base_lng = ETIMESGUT_CENTER
    h = int(hashlib.md5((name or "").encode("utf-8")).hexdigest()[:8], 16)
    dlat = ((h % 1000) - 500) / 500 * 0.0025  # ~±280m
    dlng = (((h >> 10) % 1000) - 500) / 500 * 0.0035
    return round(base_lat + dlat, 7), round(base_lng + dlng, 7)

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

        # Önce Google Places cache'inden gerçek koordinat ara, yoksa mahalle merkezi
        place_id = None
        cached = GEOCODE_CACHE.get(name.strip())
        if cached and cached.get("lat") and cached.get("lng"):
            lat, lng = cached["lat"], cached["lng"]
            place_id = cached.get("place_id")
        else:
            lat, lng = get_lat_lng(nb, name)

        rows.append({
            "name": name.strip(),
            "place_id": place_id,
            "sector": sector_id,
            "google_category": kategori,
            "rating": float(puan),
            "review_count": int(yorum) if yorum is not None else None,
            "phone": (telefon or "").strip() or None,
            "address": (adres or "").strip() or None,
            "neighborhood": nb,
            "opening_hours": (calisma or "").strip() or None,
            "lat": lat,
            "lng": lng,
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
        f.write("-- Bu dosyayı Supabase SQL Editor'a yapıştırıp Run bas — hepsini halleder.\n\n")
        f.write("-- 1) Schema migration — yeni kolonları yoksa ekle (idempotent)\n")
        f.write("alter table mechanics add column if not exists featured boolean default false;\n")
        f.write("alter table mechanics add column if not exists google_maps_url text;\n")
        f.write("alter table mechanics add column if not exists notes text;\n")
        f.write("alter table mechanics add column if not exists lat numeric(10,7);\n")
        f.write("alter table mechanics add column if not exists lng numeric(10,7);\n")
        f.write("create index if not exists mechanics_featured_idx on mechanics (featured) where featured = true;\n\n")
        f.write("-- 2) Eski veriyi temizle\n")
        f.write("delete from mechanics;\n\n")
        # Place_id istatistiği
        with_pid = sum(1 for r in rows if r.get("place_id"))
        f.write(f"-- 3) Yeni {len(rows)} ustayı yükle ({with_pid} tanesi gerçek Google place_id ile)\n")
        f.write("insert into mechanics (name, place_id, sector, google_category, rating, review_count, phone, address, neighborhood, opening_hours, lat, lng) values\n")
        lines = []
        for r in rows:
            lines.append(
                f"  ({sql_str(r['name'])}, {sql_str(r.get('place_id'))}, {sql_str(r['sector'])}, {sql_str(r['google_category'])}, "
                f"{sql_num(r['rating'])}, {sql_num(r['review_count'])}, {sql_str(r['phone'])}, "
                f"{sql_str(r['address'])}, {sql_str(r['neighborhood'])}, {sql_str(r['opening_hours'])}, "
                f"{sql_num(r['lat'])}, {sql_num(r['lng'])})"
            )
        f.write(",\n".join(lines))
        f.write(";\n")

    print(f"\n✓ {OUTPUT_PATH} yazıldı")

if __name__ == "__main__":
    main()
