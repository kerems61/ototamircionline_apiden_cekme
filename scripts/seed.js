/* Google Places'tan ustaları çek, ≥4.5 filtreden geçir, Supabase'e yaz.
 *
 * CLI kullanım:
 *   node scripts/seed.js etimesgut
 *
 * Vercel cron (api/refresh.js) bu modülün refreshDistrict() fonksiyonunu çağırır.
 *
 * Env (.env veya Vercel env):
 *   GOOGLE_PLACES_API_KEY  — Places API (New) anahtarı
 *   SUPABASE_URL           — proje URL'i
 *   SUPABASE_SECRET_KEY    — service_role key (write yetkisi)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const MIN_RATING = 4.5;

// Daha spesifik kategoriler önce — dedupe sırasında uzmanlık genel "all"ı yener.
export const CATEGORIES = [
  { id: 'tire',    query: 'lastikçi' },
  { id: 'exhaust', query: 'egzoz tamircisi' },
  { id: 'body',    query: 'kaportacı' },
  { id: 'oil',     query: 'yağ değişimi' },
  { id: 'engine',  query: 'motor tamircisi' },
  { id: 'all',     query: 'oto tamirci' },
];

export const DISTRICTS = {
  etimesgut:   { name: 'Etimesgut',   center: { lat: 39.9558, lng: 32.6790 } },
  cankaya:     { name: 'Çankaya',     center: { lat: 39.9078, lng: 32.8546 } },
  yenimahalle: { name: 'Yenimahalle', center: { lat: 39.9583, lng: 32.7831 } },
  mamak:       { name: 'Mamak',       center: { lat: 39.9272, lng: 32.9133 } },
  kecioren:    { name: 'Keçiören',    center: { lat: 39.9881, lng: 32.8625 } },
  sincan:      { name: 'Sincan',      center: { lat: 39.9701, lng: 32.5797 } },
  altindag:    { name: 'Altındağ',    center: { lat: 39.9517, lng: 32.8728 } },
  pursaklar:   { name: 'Pursaklar',   center: { lat: 40.0353, lng: 32.8997 } },
  golbasi:     { name: 'Gölbaşı',     center: { lat: 39.7917, lng: 32.8089 } },
};

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.rating',
  'places.userRatingCount',
  'places.nationalPhoneNumber',
  'places.location',
  'places.regularOpeningHours',
].join(',');

async function searchPlaces(apiKey, textQuery, center) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'tr',
      maxResultCount: 20,
      locationBias: {
        circle: {
          center: { latitude: center.lat, longitude: center.lng },
          radius: 8000,
        },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Places API ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.places ?? [];
}

function extractDistrict(addr, fallback) {
  if (!addr) return fallback;
  const m = addr.match(/(\S+?)\/Ankara/);
  return m ? m[1] : fallback;
}

function mapToRow(place, categoryId, districtName) {
  return {
    place_id: place.id,
    name: place.displayName?.text ?? 'İsimsiz',
    address: place.formattedAddress ?? null,
    district: extractDistrict(place.formattedAddress, districtName),
    category: categoryId,
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? null,
    phone: place.nationalPhoneNumber ?? null,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    opening_hours: place.regularOpeningHours ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Bir ilçedeki ustaları çek + filtrele + Supabase'e yaz.
 * Hem CLI hem Vercel cron tarafından çağrılır.
 */
export async function refreshDistrict(districtKey, env = process.env) {
  const district = DISTRICTS[districtKey];
  if (!district) throw new Error(`Bilinmeyen ilçe: "${districtKey}". Seçenekler: ${Object.keys(DISTRICTS).join(', ')}`);

  const apiKey = env.GOOGLE_PLACES_API_KEY;
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SECRET_KEY;

  if (!apiKey || !supabaseUrl || !supabaseKey) {
    throw new Error('Eksik env: GOOGLE_PLACES_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY hepsi gerekli');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  const seen = new Map();
  const log = [];
  let apiCalls = 0;
  let filtered = 0;

  for (const { id: categoryId, query } of CATEGORIES) {
    const textQuery = `${query} ${district.name} Ankara`;
    try {
      const places = await searchPlaces(apiKey, textQuery, district.center);
      apiCalls++;
      let added = 0;
      for (const p of places) {
        if (seen.has(p.id)) continue;
        const rating = p.rating ?? 0;
        if (rating < MIN_RATING) { filtered++; continue; }
        seen.set(p.id, mapToRow(p, categoryId, district.name));
        added++;
      }
      log.push(`  · "${textQuery}" → ${places.length} sonuç, ${added} eklendi`);
    } catch (e) {
      log.push(`  · "${textQuery}" HATA: ${e.message}`);
    }
  }

  const rows = [...seen.values()];
  log.push(`\n→ Toplam: ${rows.length} usta (${apiCalls} API çağrısı, ${filtered} usta <${MIN_RATING} puanla elendi)`);

  if (rows.length > 0) {
    const { error } = await supabase
      .from('mechanics')
      .upsert(rows, { onConflict: 'place_id' });
    if (error) throw new Error(`Supabase upsert hatası: ${error.message}`);
    log.push(`✓ ${rows.length} kayıt yazıldı / güncellendi`);
  }

  return { district: district.name, rowsUpserted: rows.length, apiCalls, filtered, log };
}

// CLI mode — doğrudan çalıştırıldığında
const isCli = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isCli) {
  const districtKey = (process.argv[2] ?? 'etimesgut').toLowerCase();
  console.log(`\n→ ${districtKey} için ustalar çekiliyor (puan ≥ ${MIN_RATING})...\n`);
  refreshDistrict(districtKey)
    .then((result) => {
      console.log(result.log.join('\n'));
      console.log(`\n✓ ${result.district} tamamlandı: ${result.rowsUpserted} usta\n`);
    })
    .catch((e) => {
      console.error(`\n✗ HATA: ${e.message}\n`);
      process.exit(1);
    });
}
