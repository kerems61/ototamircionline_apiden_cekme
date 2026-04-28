"""
Etimesgut_Oto_Rehberi_Gruplanmis_Son.xlsx dosyasından
≥ 4.5 puanlı ustaları filtreleyip Supabase'e yüklenecek SQL üretir.

Kullanım:
  python scripts/generate_seed.py

Çıktı: supabase/seed_data.sql

Sektör eşlemesi (Excel "Sektör" sütunu → mechanics.sector):
  Araç Bakım    → 'bakim'
  Özel Servis   → 'servis'
  Oto Lastik    → 'lastik'
  Oto Elektrik  → 'elektrik'
"""

import openpyxl
import re
from pathlib import Path

EXCEL_PATH = Path(r"C:\Users\Kerem SOYLU\Downloads\Etimesgut_Oto_Rehberi_Gruplanmis_Son.xlsx")
OUTPUT_PATH = Path(__file__).parent.parent / "supabase" / "seed_data.sql"
MIN_RATING = 4.5

SECTOR_MAP = {
    "Araç Bakım":    "bakim",
    "Özel Servis":   "servis",
    "Oto Lastik":    "lastik",
    "Oto Elektrik":  "elektrik",
}

# Etimesgut'taki bilinen mahalleler (adresten en uzun eşleşeni seç)
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

# Türkçe karakter normalize
def normalize(s):
    if not s: return ""
    return s.lower().translate(str.maketrans({
        'ç':'c','ğ':'g','ı':'i','İ':'i','ö':'o','ş':'s','ü':'u',
        'Ç':'c','Ğ':'g','I':'i','Ö':'o','Ş':'s','Ü':'u',
    }))

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
    """SQL string literal'i — None → NULL, kaçışlı tek tırnak."""
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
    skipped_unknown_sector = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        name, sektor, puan, yorum, telefon, adres, calisma, kategori = row
        if not name:
            continue

        if puan is None or float(puan) < MIN_RATING:
            skipped_low_rating += 1
            continue

        sector_id = SECTOR_MAP.get(sektor)
        if not sector_id:
            skipped_unknown_sector += 1
            continue

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

    print(f"→ {len(rows)} usta seçildi (≥{MIN_RATING})")
    print(f"  · Düşük puan elendi: {skipped_low_rating}")
    print(f"  · Bilinmeyen sektör elendi: {skipped_unknown_sector}")

    OUTPUT_PATH.parent.mkdir(exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
        f.write("-- Etimesgut Oto Rehberi seed verisi\n")
        f.write(f"-- {len(rows)} usta (puan ≥ {MIN_RATING})\n")
        f.write("-- Çalıştırmadan önce schema.sql çalışmış olmalı.\n\n")
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
