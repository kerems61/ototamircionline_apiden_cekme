-- Migration 001: mechanic_prices tablosuna display_order kolonu ekle
-- Çalıştırma: Supabase SQL Editor'a yapıştır → Run

-- 1) Yeni kolon
ALTER TABLE mechanic_prices
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 0;

-- 2) Mevcut satırlara id'ye göre sıra ata (her usta için)
WITH ordered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY mechanic_id ORDER BY updated_at, id) - 1 AS rn
  FROM mechanic_prices
)
UPDATE mechanic_prices
SET display_order = ordered.rn
FROM ordered
WHERE mechanic_prices.id = ordered.id;

-- 3) Verify
-- SELECT mechanic_id, service, display_order FROM mechanic_prices ORDER BY mechanic_id, display_order;
