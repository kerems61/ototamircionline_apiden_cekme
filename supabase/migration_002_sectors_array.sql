-- Migration 002: mechanics tablosuna sectors TEXT[] kolonu ekle
-- Bu sayede bir dükkan birden çok kategoride olabilir
-- Çalıştırma: Supabase SQL Editor → yapıştır → Run
-- Eski 'sector' kolonu DURUYOR (geri uyumluluk), yeni 'sectors' tüm satırlara doldurulur

-- 1) Yeni kolon
ALTER TABLE mechanics
  ADD COLUMN IF NOT EXISTS sectors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 2) Mevcut satırlara mevcut sector'larını dizide doldur
UPDATE mechanics
SET sectors = ARRAY[sector]
WHERE (sectors IS NULL OR cardinality(sectors) = 0)
  AND sector IS NOT NULL;

-- 3) Performans için GIN index (kategori filtresi hızlı çalışsın)
CREATE INDEX IF NOT EXISTS idx_mechanics_sectors ON mechanics USING GIN (sectors);

-- 4) Verify
-- SELECT name, sector, sectors FROM mechanics LIMIT 10;
-- SELECT count(*) FROM mechanics WHERE cardinality(sectors) = 0;  -- 0 olmalı
