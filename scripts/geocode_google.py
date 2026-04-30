"""
Google Places (New) Text Search ile her ustanın gerçek lat/lng + place_id'sini çek.
Sonuçları geocode_cache.json'a kaydeder; tekrar çalıştırıldığında cache'lenmiş kayıtları atlar.

Kullanım:
  python scripts/geocode_google.py

Maliyet:
  ~$0.032/sorgu (Places API New Text Search Pro tier)
  417 usta için ~$13. $200 ücretsiz kredinin içinde rahat.

Çıktı: supabase/geocode_cache.json
  { "<usta_adı>": { "place_id": "...", "lat": 39.xxx, "lng": 32.xxx,
                    "matched_name": "...", "matched_address": "..." } }
"""

import os
import json
import time
import sys
from pathlib import Path
import urllib.request
import urllib.error

# UTF-8 console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).parent.parent
ENV_PATH = ROOT / ".env"
CACHE_PATH = ROOT / "supabase" / "geocode_cache.json"
EXCEL_PATH = Path(r"C:\Users\Kerem SOYLU\Downloads\Etimesgut_Oto_Rehberi_Gruplanmis_Son.xlsx")
MIN_RATING = 4.5

# .env'den API key oku
api_key = None
if ENV_PATH.exists():
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        if line.startswith("GOOGLE_PLACES_API_KEY="):
            api_key = line.split("=", 1)[1].strip().strip('"\'')
            break
api_key = api_key or os.environ.get("GOOGLE_PLACES_API_KEY")
if not api_key:
    raise SystemExit("GOOGLE_PLACES_API_KEY bulunamadı. .env'de tanımlı olmalı.")

# Cache yükle
cache = {}
if CACHE_PATH.exists():
    cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))

# Excel'den ustaları yükle
import openpyxl
wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
ws = wb["Sheet1"]

queries = []
for row in ws.iter_rows(min_row=2, values_only=True):
    name, sektor, puan, yorum, telefon, adres, calisma, kategori = row
    if not name:
        continue
    if puan is None or float(puan) < MIN_RATING:
        continue
    queries.append((name.strip(), (adres or "").strip()))

print(f"\nToplam {len(queries)} usta · cache'de {len(cache)} kayıt mevcut")
to_query = [q for q in queries if q[0] not in cache]
print(f"Yeni sorgu: {len(to_query)} · tahmini maliyet: ${len(to_query)*0.032:.2f}\n")

if not to_query:
    print("Tüm kayıtlar cache'de zaten var. Çıkış.")
    sys.exit(0)

new_count = 0
ok_count = sum(1 for v in cache.values() if v and v.get("lat"))
err_count = 0

for name, adres in to_query:
    new_count += 1
    text_query = f"{name} {adres}".strip() if adres else f"{name} Etimesgut Ankara"

    body = json.dumps({
        "textQuery": text_query,
        "languageCode": "tr",
        "maxResultCount": 1,
        "locationBias": {
            "circle": {
                "center": {"latitude": 39.9558, "longitude": 32.6790},
                "radius": 12000.0,  # 12 km — Etimesgut tamamı
            },
        },
    }).encode("utf-8")

    url = "https://places.googleapis.com/v1/places:searchText"
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        places = data.get("places", [])
        if places:
            p = places[0]
            cache[name] = {
                "place_id": p.get("id"),
                "lat": p["location"]["latitude"],
                "lng": p["location"]["longitude"],
                "matched_name": (p.get("displayName") or {}).get("text"),
                "matched_address": p.get("formattedAddress"),
            }
            ok_count += 1
            short = name[:48]
            print(f"  ✓ {short:50s} → {cache[name]['lat']:.5f}, {cache[name]['lng']:.5f}")
        else:
            cache[name] = None
            err_count += 1
            print(f"  ✗ {name[:48]:50s} → eşleşme yok")
    except urllib.error.HTTPError as e:
        cache[name] = None
        err_count += 1
        body = e.read().decode("utf-8", errors="replace")[:200]
        print(f"  ✗ {name[:48]:50s} → HTTP {e.code}: {body}")
        if e.code in (401, 403, 429):
            print("\n  ! Kritik hata, duruyor. Cache yazıldı.")
            break
    except Exception as e:
        cache[name] = None
        err_count += 1
        print(f"  ✗ {name[:48]:50s} → {e}")

    # Her 25 sorguda bir cache'i kaydet (kesilirse veri kaybı az olsun)
    if new_count % 25 == 0:
        CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"    ... cache kaydedildi ({len(cache)} kayıt)")

    time.sleep(0.08)  # ~12 req/sec, Google'ın altında rahat

CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")

total = sum(1 for v in cache.values() if v and v.get("lat"))
print(f"\n✓ Bitti. Toplam {total}/{len(cache)} adres geocode edildi.")
print(f"   Bu çalıştırmada: {new_count} yeni sorgu, {ok_count - (total - len([v for v in cache.values() if v and v.get('lat')]))} başarılı, {err_count} hatalı")
print(f"   Cache: {CACHE_PATH}")
