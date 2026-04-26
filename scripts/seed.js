/* Seed mechanics from Google Places into Supabase.
 *
 * Usage:
 *   node scripts/seed.js etimesgut
 *   node scripts/seed.js cankaya
 *
 * Env (loaded from .env):
 *   GOOGLE_PLACES_API_KEY  — for Places API calls
 *   SUPABASE_URL           — project URL
 *   SUPABASE_SECRET_KEY    — service_role key (writes)
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { GOOGLE_PLACES_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;

if (!GOOGLE_PLACES_API_KEY || !SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('Missing env vars. Need GOOGLE_PLACES_API_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false },
});

const CATEGORIES = [
  { id: 'engine',  query: 'oto tamirci' },
  { id: 'engine',  query: 'motor tamircisi' },
  { id: 'tire',    query: 'lastikçi' },
  { id: 'exhaust', query: 'egzoz tamircisi' },
  { id: 'body',    query: 'kaportacı' },
  { id: 'oil',     query: 'yağ değişimi' },
];

const DISTRICTS = {
  etimesgut: { name: 'Etimesgut', center: { lat: 39.9558, lng: 32.6790 } },
  cankaya:   { name: 'Çankaya',   center: { lat: 39.9078, lng: 32.8546 } },
  yenimahalle: { name: 'Yenimahalle', center: { lat: 39.9583, lng: 32.7831 } },
  mamak:     { name: 'Mamak',     center: { lat: 39.9272, lng: 32.9133 } },
  kecioren:  { name: 'Keçiören',  center: { lat: 39.9881, lng: 32.8625 } },
  sincan:    { name: 'Sincan',    center: { lat: 39.9701, lng: 32.5797 } },
  altindag:  { name: 'Altındağ',  center: { lat: 39.9517, lng: 32.8728 } },
  pursaklar: { name: 'Pursaklar', center: { lat: 40.0353, lng: 32.8997 } },
  golbasi:   { name: 'Gölbaşı',   center: { lat: 39.7917, lng: 32.8089 } },
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

async function searchPlaces(textQuery, center) {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
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

function extractDistrictFromAddress(addr, fallback) {
  if (!addr) return fallback;
  const m = addr.match(/(\S+?)\/Ankara/);
  return m ? m[1] : fallback;
}

function mapToRow(place, categoryId, districtName) {
  return {
    place_id: place.id,
    name: place.displayName?.text ?? 'İsimsiz',
    address: place.formattedAddress ?? null,
    district: extractDistrictFromAddress(place.formattedAddress, districtName),
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

async function main() {
  const districtKey = (process.argv[2] ?? '').toLowerCase();
  const district = DISTRICTS[districtKey];
  if (!district) {
    console.error(`Unknown district "${districtKey}". Options: ${Object.keys(DISTRICTS).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n→ Seeding ${district.name}...\n`);

  // Dedupe: a place may match multiple category queries; first hit wins.
  const seen = new Map();
  let totalCalls = 0;

  for (const { id: categoryId, query } of CATEGORIES) {
    const textQuery = `${query} ${district.name} Ankara`;
    process.stdout.write(`  · "${textQuery}" ... `);
    try {
      const places = await searchPlaces(textQuery, district.center);
      totalCalls++;
      let added = 0;
      for (const p of places) {
        if (!seen.has(p.id)) {
          seen.set(p.id, mapToRow(p, categoryId, district.name));
          added++;
        }
      }
      console.log(`${places.length} results, ${added} new`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
    }
  }

  const rows = [...seen.values()];
  console.log(`\n→ ${rows.length} unique mechanics from ${totalCalls} API calls.`);

  if (rows.length === 0) {
    console.log('Nothing to upsert. Done.');
    return;
  }

  console.log(`→ Upserting to Supabase...`);
  const { error, count } = await supabase
    .from('mechanics')
    .upsert(rows, { onConflict: 'place_id', count: 'exact' });

  if (error) {
    console.error(`Supabase error: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ Upserted ${count ?? rows.length} rows.\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
