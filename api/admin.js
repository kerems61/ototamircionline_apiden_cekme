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

  // Vercel'de VITE_SUPABASE_URL veya SUPABASE_URL — ikisini de kabul et
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecret) {
    return res.status(500).json({
      error: `Server config hatası: ${!supabaseUrl ? 'SUPABASE_URL/VITE_SUPABASE_URL' : ''}${!supabaseUrl && !supabaseSecret ? ' ve ' : ''}${!supabaseSecret ? 'SUPABASE_SECRET_KEY' : ''} tanımlı değil`
    });
  }

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false },
  });

  try {
    switch (action) {
      case 'verify':
        return res.status(200).json({ ok: true });

      case 'list_mechanics': {
        const { search } = payload;
        // Önce 'sectors' dahil dene; kolon yoksa eski şemaya geri düş (geri uyumlu)
        const tryQuery = async (withSectors) => {
          const cols = withSectors
            ? 'id, name, sector, sectors, neighborhood, phone, address, opening_hours, rating, review_count, featured, google_maps_url, notes'
            : 'id, name, sector, neighborhood, phone, address, opening_hours, rating, review_count, featured, google_maps_url, notes';
          let q = supabase.from('mechanics').select(cols)
            .order('featured', { ascending: false })
            .order('rating', { ascending: false })
            .limit(500);
          if (search?.trim()) q = q.ilike('name', `%${search.trim()}%`);
          return await q;
        };
        let { data, error } = await tryQuery(true);
        if (error && /sectors/i.test(error.message || '')) {
          // sectors kolonu daha eklenmemiş, eski şemayla dön
          ({ data, error } = await tryQuery(false));
        }
        if (error) throw error;
        return res.status(200).json({ ok: true, mechanics: data });
      }

      case 'update_mechanic': {
        const { id, fields } = payload;
        if (!id || !fields) return res.status(400).json({ error: 'id ve fields gerekli' });
        // Güvenlik: sadece belirli alanları güncelle
        const allowed = ['name', 'sector', 'sectors', 'neighborhood', 'phone', 'address',
                         'opening_hours', 'rating', 'review_count',
                         'featured', 'google_maps_url', 'notes'];
        const update = {};
        for (const k of allowed) {
          if (fields[k] !== undefined) update[k] = fields[k];
        }
        // sectors gönderildiyse, eski 'sector' kolonunu da senkronize et (geri uyumluluk)
        if (Array.isArray(update.sectors) && update.sectors.length > 0) {
          update.sector = update.sectors[0];
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

      case 'create_mechanic': {
        const { fields } = payload;
        const sectorsList = Array.isArray(fields?.sectors) ? fields.sectors : (fields?.sector ? [fields.sector] : []);
        if (!fields?.name || sectorsList.length === 0) {
          return res.status(400).json({ error: 'name ve en az bir kategori (sectors) zorunlu' });
        }
        const allowed = ['name', 'sector', 'sectors', 'neighborhood', 'phone', 'address',
                         'opening_hours', 'rating', 'review_count', 'google_category',
                         'featured', 'google_maps_url', 'notes', 'lat', 'lng'];
        const insert = { district: 'Etimesgut' };
        for (const k of allowed) if (fields[k] !== undefined) insert[k] = fields[k];
        // sectors verilmiş ama sector verilmemişse, sector'a ilkini koy
        if (Array.isArray(insert.sectors) && insert.sectors.length > 0 && !insert.sector) {
          insert.sector = insert.sectors[0];
        }
        // sector verilmiş ama sectors yoksa, sectors'a koy
        if (insert.sector && !insert.sectors) {
          insert.sectors = [insert.sector];
        }
        const { data, error } = await supabase.from('mechanics').insert(insert).select().single();
        if (error) throw error;
        return res.status(200).json({ ok: true, mechanic: data });
      }

      case 'list_prices': {
        const { mechanic_id } = payload;
        if (!mechanic_id) return res.status(400).json({ error: 'mechanic_id gerekli' });
        const { data, error } = await supabase.from('mechanic_prices')
          .select('id, service, price_tl, display_order, updated_at')
          .eq('mechanic_id', mechanic_id)
          .order('display_order', { ascending: true })
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json({ ok: true, prices: data });
      }

      case 'add_price': {
        const { mechanic_id, service, price_tl } = payload;
        if (!mechanic_id || !service || price_tl == null) {
          return res.status(400).json({ error: 'mechanic_id, service ve price_tl zorunlu' });
        }
        // Yeni satır en sona eklensin
        const { data: maxRow } = await supabase.from('mechanic_prices')
          .select('display_order').eq('mechanic_id', mechanic_id)
          .order('display_order', { ascending: false }).limit(1).maybeSingle();
        const nextOrder = (maxRow?.display_order ?? -1) + 1;
        const { error } = await supabase.from('mechanic_prices').insert({
          mechanic_id,
          service: String(service).trim(),
          price_tl: Math.max(0, parseInt(price_tl) || 0),
          display_order: nextOrder,
        });
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'move_price': {
        const { id, direction } = payload;
        if (!id || !['up', 'down'].includes(direction)) {
          return res.status(400).json({ error: 'id ve direction (up|down) gerekli' });
        }
        // Mevcut satırı al
        const { data: current, error: e1 } = await supabase.from('mechanic_prices')
          .select('id, mechanic_id, display_order').eq('id', id).single();
        if (e1) throw e1;

        // Komşu satırı bul (yukarısı veya aşağısı)
        const isUp = direction === 'up';
        let nbq = supabase.from('mechanic_prices')
          .select('id, display_order')
          .eq('mechanic_id', current.mechanic_id);
        nbq = isUp
          ? nbq.lt('display_order', current.display_order).order('display_order', { ascending: false })
          : nbq.gt('display_order', current.display_order).order('display_order', { ascending: true });
        const { data: neighbor } = await nbq.limit(1).maybeSingle();

        if (!neighbor) return res.status(200).json({ ok: true, swapped: false });

        // İki satırın display_order'ını swap et (geçici büyük değer kullan, unique constraint olmasa da güvenli)
        const tempOrder = 999999;
        await supabase.from('mechanic_prices').update({ display_order: tempOrder }).eq('id', current.id);
        await supabase.from('mechanic_prices').update({ display_order: current.display_order }).eq('id', neighbor.id);
        await supabase.from('mechanic_prices').update({ display_order: neighbor.display_order }).eq('id', current.id);

        return res.status(200).json({ ok: true, swapped: true });
      }

      case 'update_price': {
        const { id, service, price_tl } = payload;
        if (!id) return res.status(400).json({ error: 'id gerekli' });
        const update = { updated_at: new Date().toISOString() };
        if (service !== undefined) update.service = String(service).trim();
        if (price_tl !== undefined) update.price_tl = Math.max(0, parseInt(price_tl) || 0);
        const { error } = await supabase.from('mechanic_prices').update(update).eq('id', id);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      }

      case 'delete_price': {
        const { id } = payload;
        if (!id) return res.status(400).json({ error: 'id gerekli' });
        const { error } = await supabase.from('mechanic_prices').delete().eq('id', id);
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
