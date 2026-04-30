-- ototamircionline.com — Supabase şema
-- Çalıştırma: Supabase Dashboard → SQL Editor → bu dosyayı yapıştır → Run
--
-- Bu script idempotent: her çalıştırmada tabloları silip yeniden kurar.
-- DİKKAT: mevcut veriyi siler. İlk kurulumda veya tam temizlik için kullan.
-- Veriyi yüklemek için sonra supabase/seed_data.sql dosyasını çalıştır.

drop table if exists mechanic_prices cascade;
drop table if exists mechanic_owners cascade;
drop table if exists mechanics cascade;

-- Ana usta tablosu — Etimesgut Oto Rehberi'nden gelen veri
create table mechanics (
  id              uuid primary key default gen_random_uuid(),
  place_id        text unique,                       -- ileride Google Place ID eklenecek (şimdilik null)
  name            text not null,
  sector          text not null,                     -- mekanik, servis, kaporta, lastik, elektrik, ekspertiz, yikama
  google_category text,                              -- Google'ın ham kategorisi (örn: "Oto Tamirhanesi")
  rating          numeric(2,1),
  review_count    integer,
  phone           text,
  address         text,
  district        text default 'Etimesgut',
  neighborhood    text,                              -- mahalle (adresten parse edildi)
  opening_hours   text,                              -- "09:00-20:00" gibi düz metin
  featured        boolean default false,             -- yönetici tarafından PRO işaretli (üstte gözükür)
  google_maps_url text,                              -- yönetici tarafından özelleştirilen Google Maps URL'si (yoksa otomatik arama)
  notes           text,                              -- yönetici notları (özel açıklama)
  lat             numeric(10,7),                     -- enlem (geocoding sonucu, harita için)
  lng             numeric(10,7),                     -- boylam
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index mechanics_sector_idx on mechanics (sector);
create index mechanics_rating_idx on mechanics (rating desc nulls last);
create index mechanics_neighborhood_idx on mechanics (neighborhood);
create index mechanics_featured_idx on mechanics (featured) where featured = true;

-- Hesap açan / işletmesini sahiplenen ustalar
create table mechanic_owners (
  id          uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  email       text,
  phone       text,
  verified    boolean default false,
  created_at  timestamptz default now(),
  unique (mechanic_id)
);

-- Sahiplenen ustaların girdiği şeffaf fiyatlar
create table mechanic_prices (
  id          uuid primary key default gen_random_uuid(),
  mechanic_id uuid not null references mechanics(id) on delete cascade,
  service     text not null,
  price_tl    integer not null check (price_tl >= 0),
  updated_at  timestamptz default now()
);

create index mechanic_prices_mechanic_id_idx on mechanic_prices (mechanic_id);

-- RLS: dizin halka açık okunabilir, yazma sadece service_role'dan
alter table mechanics        enable row level security;
alter table mechanic_prices  enable row level security;
alter table mechanic_owners  enable row level security;

create policy "public read mechanics"
  on mechanics for select using (true);

create policy "public read prices"
  on mechanic_prices for select using (true);

-- mechanic_owners için public policy yok (sadece service_role yazabilir/okuyabilir)
