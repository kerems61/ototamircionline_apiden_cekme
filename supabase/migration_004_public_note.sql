-- Migration 004: mechanics tablosuna public_note kolonu ekle
-- 'notes' kolonu admin için iç not, 'public_note' ise kart altında müşterilere görünen serbest yazı
-- Çalıştırma: Supabase SQL Editor → yapıştır → Run

ALTER TABLE mechanics
  ADD COLUMN IF NOT EXISTS public_note TEXT;

-- Verify
-- SELECT name, public_note FROM mechanics WHERE public_note IS NOT NULL LIMIT 5;
