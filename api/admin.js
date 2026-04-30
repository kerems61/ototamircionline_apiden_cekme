/* Admin API — şifre korumalı, ustaları güncelleyebilir.
 *
 * Vercel'de gerekli env vars:
 *   ADMIN_PASSWORD       — admin şifresi (sen belirle)
 *   SUPABASE_URL         — Supabase proje URL'si
 *   SUPABASE_SECRET_KEY  — service_role key (yazma yetkisi için, asla frontend'e koyma)
 *
 * Kullanım (frontend):
 *   POST /api/admin
 *   body: { password, action: 'update_mechanic', id, fields }
 *   body: { password, action: 'delete_mechanic', id }
 *   body: { password, action: 'list_mechanics' }
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, action, ...payload } = req.body || {};

  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Yanlış şifre' });
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    return res.status(500).json({ error: 'Server config hatası: SUPABASE_URL veya SUPABASE_SECRET_KEY tanımlı değil' });
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
    auth: { persistSession: false },
  });

  try {
    switch (action) {
      case 'verify':
        return res.status(200).json({ ok: true });

      case 'list_mechanics': {
        const { search } = payload;
        let q = supabase
          .from('mechanics')
          .select('id, name, sector, neighborhood, phone, rating, review_count, featured, google_maps_url, notes')
          .order('featured', { ascending: false })
          .order('rating', { ascending: false })
          .limit(500);
        if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`);
        const { data, error } = await q;
        if (error) throw error;
        return res.status(200).json({ ok: true, mechanics: data });
      }

      case 'update_mechanic': {
        const { id, fields } = payload;
        if (!id || !fields) return res.status(400).json({ error: 'id ve fields gerekli' });
        // Güvenlik: sadece belirli alanları güncelle
        const allowed = ['name', 'sector', 'neighborhood', 'phone', 'address',
                         'opening_hours', 'rating', 'review_count',
                         'featured', 'google_maps_url', 'notes'];
        const update = {};
        for (const k of allowed) {
          if (fields[k] !== undefined) update[k] = fields[k];
        }
        update.updated_at = new Date().toISOString();
        const { error } = await supabase.from('mechanics').update(update).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'delete_mechanic': {
        const { id } = payload;
        if (!id) return res.status(400).json({ error: 'id gerekli' });
        const { error } = await supabase.from('mechanics').delete().eq('id', id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      default:
        return res.status(400).json({ error: `Bilinmeyen action: ${action}` });
    }
  } catch (e) {
    console.error('Admin API hatası:', e);
    return res.status(500).json({ error: e.message || 'Beklenmedik hata' });
  }
}
