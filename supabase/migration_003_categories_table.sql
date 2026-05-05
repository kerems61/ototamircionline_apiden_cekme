-- Migration 003: categories tablosu — özelleştirilebilir kategori listesi
-- Çalıştırma: Supabase SQL Editor → yapıştır → Run
-- Etkisi: Yeni 'categories' tablosu, public okuma RLS, mevcut 7 kategori seed

-- 1) Tablo
CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY,
  label       TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'Sparkles',
  tone_dark   TEXT NOT NULL DEFAULT '#2C2825',
  tone_light  TEXT NOT NULL DEFAULT '#4A3F33',
  sort_order  INT  NOT NULL DEFAULT 100,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Mevcut 7 kategoriyi seed et (id çakışırsa atla)
INSERT INTO categories (id, label, icon, tone_dark, tone_light, sort_order, is_default) VALUES
  ('mekanik',   'Motor & Mekanik',     'Wrench',     '#1F1B16', '#3F3525', 10, true),
  ('servis',    'Marka Servisi',       'BadgeCheck', '#1F2937', '#374151', 20, true),
  ('kaporta',   'Kaporta & Boya',      'Hammer',     '#3B2616', '#6B4226', 30, true),
  ('lastik',    'Lastik & Jant',       'CircleDot',  '#1E3A2E', '#2F5443', 40, true),
  ('elektrik',  'Elektrik & Klima',    'Zap',        '#5C3A0E', '#8C5A1E', 50, true),
  ('ekspertiz', 'Ekspertiz',           'Shield',     '#1F3A4F', '#2F5478', 60, true),
  ('yikama',    'Yıkama & Detailing',  'Droplet',    '#0F3F4F', '#1E5A6F', 70, true)
ON CONFLICT (id) DO NOTHING;

-- 3) RLS — herkes okuyabilir, yazma sadece service_role (admin API)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_public" ON categories;
CREATE POLICY "categories_select_public" ON categories
  FOR SELECT USING (true);

-- 4) Verify
-- SELECT id, label, icon, sort_order, is_default FROM categories ORDER BY sort_order;
