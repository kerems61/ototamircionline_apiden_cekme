import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Search, MapPin, Star, Clock, Phone, ChevronRight, X,
  Sparkles, Shield, Wrench, CircleDot, Zap, Hammer, Droplet,
  Home, Heart, User, Navigation, ExternalLink, Send, BadgeCheck,
  MessageCircle, ArrowUp, Mail,
} from 'lucide-react';

// Instagram ikonu (lucide-react v1'de yok, inline SVG)
const Instagram = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false } }
);

/* ──────────────────────────────────────────────────────────────
   ototamircimonline.com — UI
   Hybrid data model: Google Places (live) + Supabase (delta, TBD)
   ────────────────────────────────────────────────────────────── */

const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&family=Geist:wght@300;400;500;600;700&display=swap');
:root{
  --bg: #FAFAF6;
  --bg-warm: #F4F1EA;
  --ink: #14110F;
  --ink-2: #5C5650;
  --ink-3: #8C857C;
  --line: #E8E3D8;
  --line-2: #EFEAE0;
  --card: #FFFFFF;
  --accent: #C2410C;
  --accent-soft: #FEF1E6;
  --green: #166534;
  --green-soft: #ECFDF5;
  --shadow-sm: 0 1px 2px rgba(20,17,15,.04), 0 1px 3px rgba(20,17,15,.03);
  --shadow-md: 0 1px 2px rgba(20,17,15,.04), 0 8px 24px rgba(20,17,15,.06);
  --shadow-lg: 0 1px 2px rgba(20,17,15,.04), 0 24px 48px -12px rgba(20,17,15,.12);
}
.serif { font-family: 'Fraunces', ui-serif, Georgia, serif; font-optical-sizing: auto; letter-spacing: -0.02em; }
.sans  { font-family: 'Geist', ui-sans-serif, system-ui, sans-serif; }
* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
@keyframes fadeUp { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes pulseRing {
  0% { box-shadow: 0 0 0 0 rgba(194,65,12,.35); }
  100% { box-shadow: 0 0 0 12px rgba(194,65,12,0); }
}
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.fadeUp { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) both; }
.fadeIn { animation: fadeIn .5s ease both; }
.slideUp { animation: slideUp .45s cubic-bezier(.2,.8,.2,1) both; }
.pulseRing::after{
  content:''; position:absolute; inset:-4px; border-radius:9999px;
  animation: pulseRing 1.8s ease-out infinite;
}
.skeleton {
  background: linear-gradient(90deg, #EEE9DD 0%, #F6F2E8 50%, #EEE9DD 100%);
  background-size: 800px 100%;
  animation: shimmer 1.4s linear infinite;
}
.scrollbar-none::-webkit-scrollbar { display:none; }
.scrollbar-none { scrollbar-width: none; }
.grain {
  background-image:
    radial-gradient(1200px 600px at 110% -20%, rgba(194,65,12,.06), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(22,101,52,.04), transparent 60%);
}
`;

const CATEGORIES = [
  { id: 'all',       label: 'Tümü',              icon: Sparkles,   tones: ['#2C2825', '#4A3F33'] },
  { id: 'mekanik',   label: 'Motor & Mekanik',   icon: Wrench,     tones: ['#1F1B16', '#3F3525'] },
  { id: 'servis',    label: 'Marka Servisi',     icon: BadgeCheck, tones: ['#1F2937', '#374151'] },
  { id: 'kaporta',   label: 'Kaporta & Boya',    icon: Hammer,     tones: ['#3B2616', '#6B4226'] },
  { id: 'lastik',    label: 'Lastik & Jant',     icon: CircleDot,  tones: ['#1E3A2E', '#2F5443'] },
  { id: 'elektrik',  label: 'Elektrik & Klima',  icon: Zap,        tones: ['#5C3A0E', '#8C5A1E'] },
  { id: 'ekspertiz', label: 'Ekspertiz',         icon: Shield,     tones: ['#1F3A4F', '#2F5478'] },
  { id: 'yikama',    label: 'Yıkama & Detailing',icon: Droplet,    tones: ['#0F3F4F', '#1E5A6F'] },
];

const WHATSAPP_NUMBER = '905459029241';
const CONTACT_EMAIL = 'ototamircim134@gmail.com';
const INSTAGRAM_USER = 'ototamircimonline';

function getDisplayWord(name) {
  if (!name) return '??';
  // İlk anlamlı kelimeyi al (sayı/sembol olmayan)
  const words = name.trim().split(/[\s\-,&.]+/).filter(w => w.length >= 2 && /[A-Za-zÀ-ÿĞğÜüŞşİıÖöÇç]/.test(w));
  if (words.length === 0) return name.slice(0, 6).toUpperCase();
  const first = words[0];
  // İlk kelime kısaysa (≤3 char) ve 2. kelime varsa, ikisini birleştir
  if (first.length <= 3 && words.length > 1) {
    const combined = first + ' ' + words[1];
    return combined.slice(0, 10).toUpperCase();
  }
  return first.slice(0, 9).toUpperCase();
}

function googleMapsSearchUrl(mechanic) {
  // Eğer admin tarafından özel URL set edildiyse onu kullan
  if (mechanic.googleMapsUrl) return mechanic.googleMapsUrl;
  // Yoksa mahalle + Etimesgut Ankara ile arama
  const parts = [
    mechanic.name,
    mechanic.neighborhood,
    'Etimesgut Ankara',
  ].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(' '))}`;
}

const PAGE_SIZE = 30;

const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

function mapRow(row) {
  const cat = CATEGORY_BY_ID[row.sector] ?? CATEGORY_BY_ID.all;
  const prices = (row.mechanic_prices ?? []).map(p => ({
    service: p.service,
    priceTL: p.price_tl,
  }));
  return {
    id: row.id,
    name: row.name ?? 'İsimsiz',
    district: row.district ?? 'Etimesgut',
    neighborhood: row.neighborhood ?? null,
    categoryId: row.sector ?? 'all',
    categoryLabel: cat.label,
    googleCategory: row.google_category ?? null,
    rating: row.rating ?? 0,
    reviews: row.review_count ?? 0,
    phone: row.phone ?? null,
    address: row.address ?? '',
    openingHours: row.opening_hours ?? null,
    photoTone: cat.tones,
    transparentPrices: prices,
    avgLaborTL: null,
    verifiedShop: prices.length > 0,
    featured: row.featured === true,
    googleMapsUrl: row.google_maps_url ?? null,
    notes: row.notes ?? null,
  };
}

async function fetchMechanics({ category, neighborhood, query }) {
  let q = supabase
    .from('mechanics')
    .select('*, mechanic_prices(service, price_tl)');
  if (category && category !== 'all') q = q.eq('sector', category);
  if (neighborhood && neighborhood !== 'all') q = q.eq('neighborhood', neighborhood);
  if (query?.trim()) q = q.ilike('name', `%${query.trim()}%`);
  const { data, error } = await q.limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

async function fetchAvailableNeighborhoods() {
  const { data, error } = await supabase.from('mechanics').select('neighborhood');
  if (error) throw new Error(error.message);
  const set = new Set((data ?? []).map((r) => r.neighborhood).filter(Boolean));
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
}

function Logo({ size = 18 }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: size + 10, height: size + 10 }}>
        <div className="absolute inset-0 rounded-2xl" style={{ background: 'var(--ink)' }} />
        <div className="absolute inset-[3px] rounded-xl flex items-center justify-center" style={{ background: 'var(--accent)' }}>
          <Wrench size={size - 4} color="white" strokeWidth={2.4} />
        </div>
      </div>
      <div className="leading-none">
        <div className="serif text-[15px] font-semibold tracking-tight" style={{ color: 'var(--ink)' }}>
          ototamircim<span style={{ color: 'var(--accent)' }}>online</span>
        </div>
        <div className="sans text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--ink-3)' }}>
          Şeffaf · Güvenilir · Ankara
        </div>
      </div>
    </div>
  );
}

function StarRow({ rating, reviews, dense }) {
  return (
    <div className={`flex items-center ${dense ? 'gap-1' : 'gap-1.5'} sans`}>
      <Star size={dense ? 13 : 14} fill="var(--ink)" color="var(--ink)" strokeWidth={0} />
      <span className="font-semibold text-[13px]" style={{ color: 'var(--ink)' }}>{rating.toFixed(1)}</span>
      <span className="text-[12px]" style={{ color: 'var(--ink-3)' }}>({reviews})</span>
    </div>
  );
}

function CategoryPills({ active, onChange }) {
  return (
    <div className="overflow-x-auto scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0">
      <div className="flex gap-2 min-w-max lg:min-w-0 lg:flex-wrap">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="sans flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-medium transition-all duration-300"
              style={{
                background: isActive ? 'var(--ink)' : 'var(--card)',
                color: isActive ? 'white' : 'var(--ink)',
                border: isActive ? '1px solid var(--ink)' : '1px solid var(--line)',
                boxShadow: isActive ? 'var(--shadow-md)' : 'none',
              }}
            >
              <Icon size={15} strokeWidth={2} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NeighborhoodPills({ active, options, onChange }) {
  const items = [{ id: 'all', label: 'Tüm Mahalleler' }, ...options.map((d) => ({ id: d, label: d }))];
  return (
    <div className="overflow-x-auto scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0">
      <div className="flex gap-2 min-w-max lg:min-w-0 lg:flex-wrap">
        {items.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className="sans flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-medium transition-all"
              style={{
                background: isActive ? 'var(--accent)' : 'var(--card)',
                color: isActive ? 'white' : 'var(--ink-2)',
                border: isActive ? '1px solid var(--accent)' : '1px solid var(--line)',
              }}
            >
              <MapPin size={12} strokeWidth={2.2} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MechanicPhoto({ tones, verified, featured, name, categoryIcon: CatIcon, categoryLabel }) {
  const word = getDisplayWord(name);
  // featured ise kırmızımsı vurgulu gradient kullan
  const grad = featured
    ? `radial-gradient(120% 80% at 20% 10%, #DC2626 0%, #7F1D1D 70%)`
    : `radial-gradient(120% 80% at 20% 10%, ${tones[1]} 0%, ${tones[0]} 70%)`;

  // Kelime uzunluğuna göre yazı boyutu ayarla
  const fontSize = word.length <= 4
    ? 'clamp(44px, 7vw, 60px)'
    : word.length <= 7
      ? 'clamp(28px, 5vw, 40px)'
      : 'clamp(20px, 3.5vw, 28px)';

  return (
    <div
      className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden flex items-center justify-center"
      style={{ background: grad }}
    >
      <div className="absolute inset-0 opacity-40"
        style={{ background:
          'repeating-linear-gradient(115deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px)' }} />

      {CatIcon && (
        <div className="absolute -right-4 -bottom-4 opacity-15">
          <CatIcon size={140} color="white" strokeWidth={1.5} />
        </div>
      )}

      <div className="serif font-semibold relative px-4 text-center" style={{
        color: 'rgba(255,255,255,0.95)',
        fontSize,
        letterSpacing: '-0.03em',
        textShadow: '0 2px 12px rgba(0,0,0,0.3)',
        lineHeight: 1.05,
      }}>
        {word}
      </div>

      {categoryLabel && (
        <div className="absolute bottom-3 left-3 sans text-[10.5px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md"
          style={{ background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.95)', border:'1px solid rgba(255,255,255,0.2)' }}>
          {categoryLabel}
        </div>
      )}

      <div className="absolute top-3 left-3 flex gap-1.5">
        {featured && (
          <span className="sans text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wider"
            style={{ background:'#DC2626', color:'white', boxShadow:'0 2px 8px rgba(220,38,38,0.4)' }}>
            ★ PRO
          </span>
        )}
        {verified && !featured && (
          <span className="sans text-[11px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{ background:'rgba(255,255,255,0.92)', color:'var(--accent)' }}>
            <BadgeCheck size={12} strokeWidth={2.4} /> Doğrulanmış
          </span>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); }}
        className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-transform hover:scale-110"
        style={{ background:'rgba(255,255,255,0.9)' }}>
        <Heart size={16} color="var(--ink)" />
      </button>
    </div>
  );
}

function MechanicCard({ m, onOpen, delay = 0 }) {
  const hasPrices = m.transparentPrices.length > 0;
  return (
    <article
      onClick={() => onOpen(m)}
      className="fadeUp group cursor-pointer rounded-3xl p-3 sm:p-4 transition-all duration-500 hover:-translate-y-1"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-sm)',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <MechanicPhoto
        tones={m.photoTone}
        verified={m.verifiedShop}
        featured={m.featured}
        name={m.name}
        categoryIcon={CATEGORY_BY_ID[m.categoryId]?.icon}
        categoryLabel={m.categoryLabel}
      />

      <div className="pt-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="serif text-[19px] font-semibold leading-tight truncate" style={{ color: 'var(--ink)' }}>
              {m.name}
            </h3>
            <p className="sans text-[12.5px] mt-0.5" style={{ color: 'var(--ink-3)' }}>
              {m.categoryLabel}{m.neighborhood ? ` · ${m.neighborhood}` : ''}
            </p>
          </div>
          <StarRow rating={m.rating} reviews={m.reviews} dense />
        </div>

        <div className="mt-3 flex items-center gap-3 sans text-[12px] flex-wrap" style={{ color: 'var(--ink-2)' }}>
          {m.openingHours && (
            <span className="flex items-center gap-1"><Clock size={12} /> {m.openingHours}</span>
          )}
          {m.phone && (
            <>
              {m.openingHours && <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--ink-3)' }} />}
              <span className="flex items-center gap-1"><Phone size={12} /> {m.phone}</span>
            </>
          )}
        </div>

        {hasPrices && (
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Shield size={12} color="var(--accent)" strokeWidth={2.4} />
              <span className="sans text-[10.5px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--accent)' }}>
                Şeffaf İşçilik
              </span>
            </div>
            {m.transparentPrices.slice(0, 2).map((p, i) => (
              <div key={i} className="sans flex items-center justify-between gap-3 px-3 py-2 rounded-xl"
                style={{ background: 'var(--accent-soft)' }}>
                <span className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>{p.service}</span>
                <span className="text-[12px] font-semibold whitespace-nowrap" style={{ color: 'var(--accent)' }}>
                  {p.priceTL.toLocaleString('tr-TR')} ₺
                </span>
              </div>
            ))}
          </div>
        )}

        <button className="sans mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-[13px] font-medium transition-all"
          style={{ background: 'var(--ink)', color: 'white' }}>
          Detayları Gör <ChevronRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </article>
  );
}

function CardSkeleton({ delay = 0 }) {
  return (
    <div
      className="fadeUp rounded-3xl p-3 sm:p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--line)', animationDelay: `${delay}ms` }}
    >
      <div className="skeleton w-full h-44 sm:h-48 rounded-2xl" />
      <div className="pt-4 px-1 space-y-3">
        <div className="skeleton h-5 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-3 w-2/3 rounded" />
        <div className="skeleton h-10 w-full rounded-2xl mt-3" />
      </div>
    </div>
  );
}

function DetailSheet({ mechanic, onClose, onWriteReview }) {
  if (!mechanic) return null;
  const hasPrices = mechanic.transparentPrices.length > 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fadeIn" style={{ background:'rgba(20,17,15,0.45)' }} onClick={onClose}>
      <div
        onClick={(e)=>e.stopPropagation()}
        className="slideUp relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ background:'var(--bg)' }}
      >
        <div className="relative h-56" style={{
          background:`radial-gradient(120% 80% at 20% 10%, ${mechanic.photoTone[1]}, ${mechanic.photoTone[0]} 70%)`,
        }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background:'rgba(255,255,255,0.92)' }}>
            <X size={16} color="var(--ink)" />
          </button>
          <div className="absolute bottom-4 left-5 right-5 text-white">
            <div className="serif text-[26px] font-semibold leading-tight">{mechanic.name}</div>
            <div className="sans text-[13px] opacity-90 mt-1 flex items-center gap-2">
              <MapPin size={13} /> {mechanic.address}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl p-3.5" style={{ background:'var(--card)', border:'1px solid var(--line)' }}>
              <div className="sans text-[10.5px] uppercase tracking-[0.14em]" style={{ color:'var(--ink-3)' }}>Google Puanı</div>
              <div className="serif text-[20px] font-semibold mt-1" style={{ color:'var(--ink)' }}>{mechanic.rating.toFixed(1)}</div>
              <div className="sans text-[11px]" style={{ color:'var(--ink-3)' }}>{mechanic.reviews} yorum</div>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background:'var(--card)', border:'1px solid var(--line)' }}>
              <div className="sans text-[10.5px] uppercase tracking-[0.14em]" style={{ color:'var(--ink-3)' }}>Mahalle</div>
              <div className="serif text-[16px] font-semibold mt-1 truncate" style={{ color:'var(--ink)' }}>
                {mechanic.neighborhood ?? '—'}
              </div>
              <div className="sans text-[11px]" style={{ color:'var(--ink-3)' }}>{mechanic.district}</div>
            </div>
            <div className="rounded-2xl p-3.5" style={{ background:'var(--card)', border:'1px solid var(--line)' }}>
              <div className="sans text-[10.5px] uppercase tracking-[0.14em]" style={{ color:'var(--ink-3)' }}>Ort. İşçilik</div>
              <div className="serif text-[20px] font-semibold mt-1" style={{ color:'var(--ink)' }}>
                {mechanic.avgLaborTL !== null ? `${mechanic.avgLaborTL}₺` : 'Yakında'}
              </div>
              <div className="sans text-[11px]" style={{ color:'var(--ink-3)' }}>Topluluk verisi</div>
            </div>
          </div>

          {mechanic.openingHours && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={15} color="var(--ink)" />
                <h4 className="serif text-[18px] font-semibold" style={{ color:'var(--ink)' }}>Çalışma Saatleri</h4>
              </div>
              <div className="rounded-2xl p-4" style={{ background:'var(--card)', border:'1px solid var(--line)' }}>
                <p className="sans text-[13px]" style={{ color:'var(--ink-2)' }}>{mechanic.openingHours}</p>
              </div>
            </section>
          )}

          {hasPrices ? (
            <section>
              <div className="flex items-baseline justify-between mb-3">
                <h4 className="serif text-[20px] font-semibold" style={{ color:'var(--ink)' }}>Şeffaf Fiyat Listesi</h4>
                <span className="sans text-[11.5px]" style={{ color:'var(--ink-3) ' }}>Topluluk · Güncel</span>
              </div>
              <div className="space-y-2">
                {mechanic.transparentPrices.map((p,i)=>(
                  <div key={i} className="flex items-center justify-between rounded-2xl p-4"
                    style={{ background:'var(--card)', border:'1px solid var(--line)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'var(--accent-soft)' }}>
                        <Wrench size={15} color="var(--accent)" strokeWidth={2.2} />
                      </div>
                      <div>
                        <div className="sans text-[13.5px] font-medium" style={{ color:'var(--ink)' }}>{p.service}</div>
                        <div className="sans text-[11px]" style={{ color:'var(--ink-3)' }}>Ortalama, vergi dahil</div>
                      </div>
                    </div>
                    <div className="serif text-[18px] font-semibold" style={{ color:'var(--accent)' }}>
                      {p.priceTL.toLocaleString('tr-TR')} ₺
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl p-5 text-center" style={{ background:'var(--card)', border:'1px dashed var(--line)' }}>
              <div className="serif text-[16px] font-semibold" style={{ color:'var(--ink)' }}>Şeffaf Fiyat Listesi</div>
              <p className="sans text-[12.5px] mt-1.5" style={{ color:'var(--ink-3)' }}>
                Bu usta için topluluk fiyatları henüz toplanmadı. Yakında.
              </p>
            </section>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href={mechanic.phone ? `tel:${mechanic.phone.replace(/\s+/g, '')}` : undefined}
              onClick={(e) => { if (!mechanic.phone) e.preventDefault(); }}
              className="sans flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold"
              style={{ background:'var(--ink)', color:'white', opacity: mechanic.phone ? 1 : 0.5 }}>
              <Phone size={15} /> {mechanic.phone ?? 'Telefon yok'}
            </a>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([mechanic.name, mechanic.neighborhood, 'Etimesgut Ankara'].filter(Boolean).join(' '))}`}
              target="_blank" rel="noreferrer"
              className="sans flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold"
              style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
              <Navigation size={15} /> Yol Tarifi
            </a>
          </div>

          <a
            href={googleMapsSearchUrl(mechanic)}
            target="_blank" rel="noreferrer"
            className="sans flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold"
            style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
            <Star size={15} /> Yorumları Google'da Gör ({mechanic.reviews})
            <ExternalLink size={13} />
          </a>

          <div className="rounded-3xl p-5"
            style={{ background:'linear-gradient(180deg, var(--accent-soft), var(--bg-warm))', border:'1px solid var(--line-2)' }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background:'white' }}>
                <Send size={16} color="var(--accent)" />
              </div>
              <div className="flex-1">
                <div className="serif text-[17px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>
                  Yorumun ustaya destek olsun
                </div>
                <p className="sans text-[12.5px] mt-1.5 leading-relaxed" style={{ color:'var(--ink-2)' }}>
                  Yorumu sistemimize değil, doğrudan <b>Google'a</b> yazıyorsun. Bu hem ustaya hem
                  diğer sürücülere daha çok yarar; biz aynı yorumu burada da gösteririz.
                </p>
                <button
                  onClick={()=>onWriteReview(mechanic)}
                  className="sans mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-[12.5px] font-semibold transition-transform hover:scale-[1.02]"
                  style={{ background:'var(--accent)', color:'white' }}
                >
                  Google'da Yorum Yaz <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

function BottomNav({ active, onChange }) {
  const items = [
    { id:'home',   label:'Keşfet',   icon: Home    },
    { id:'map',    label:'Harita',   icon: MapPin  },
    { id:'saved',  label:'Kayıtlı',  icon: Heart   },
    { id:'me',     label:'Profil',   icon: User    },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={{ paddingBottom:'max(env(safe-area-inset-bottom), 8px)' }}>
      <div className="mx-3 mb-3 rounded-3xl px-2 py-2 backdrop-blur-xl"
        style={{ background:'rgba(255,255,255,0.92)', border:'1px solid var(--line)', boxShadow:'var(--shadow-lg)' }}>
        <div className="grid grid-cols-4">
          {items.map(({id,label,icon:Icon})=>{
            const isActive = active===id;
            return (
              <button key={id} onClick={()=>onChange(id)}
                className="sans flex flex-col items-center gap-1 py-2 rounded-2xl transition-all"
                style={{ color: isActive ? 'var(--ink)' : 'var(--ink-3)' }}>
                <div className="relative">
                  {isActive && (
                    <span className="absolute -inset-2 rounded-full" style={{ background:'var(--accent-soft)' }} />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} className="relative" />
                </div>
                <span className="text-[10.5px] font-medium tracking-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function MapView({ onBack }) {
  return (
    <main className="max-w-6xl mx-auto px-5 pt-6 pb-32 lg:pb-12">
      <div className="flex items-center justify-between mb-5 fadeUp">
        <div>
          <h2 className="serif text-[28px] sm:text-[34px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>
            Etimesgut Haritası
          </h2>
          <p className="sans text-[13px] mt-1" style={{ color:'var(--ink-3)' }}>
            Sanayi bölgelerine ve ustalara hızlıca git. Yol tarifi için karta tıkla.
          </p>
        </div>
        <button onClick={onBack}
          className="sans text-[13px] font-medium px-4 py-2 rounded-full"
          style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
          ← Listeye dön
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden fadeUp" style={{ border:'1px solid var(--line)', boxShadow:'var(--shadow-md)', animationDelay:'80ms' }}>
        <iframe
          title="Etimesgut Haritası"
          src="https://www.google.com/maps?q=Etimesgut+Sasmaz+Oto+Sanayi+Sitesi+Ankara&output=embed"
          width="100%" height="500"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
        />
      </div>

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 fadeUp" style={{ animationDelay:'150ms' }}>
        {[
          { name: 'Şaşmaz Oto Sanayi Sitesi', q: 'Sasmaz Oto Sanayi Sitesi Etimesgut Ankara', desc: 'Etimesgut\'un en büyük oto sanayisi' },
          { name: 'Bahçekapı', q: 'Bahcekapi Etimesgut Ankara', desc: 'Yoğun usta merkezi' },
          { name: 'Bağlıca Sanayi', q: 'Baglica Etimesgut Ankara', desc: 'Lastik ve ekspertiz yoğun' },
          { name: 'Eryaman', q: 'Eryaman Etimesgut Ankara', desc: 'Yıkama ve kaporta' },
          { name: 'Süvari / Ahi Mesut', q: 'Suvari Ahi Mesut Etimesgut Ankara', desc: 'Karışık servisler' },
          { name: 'Piyade / İstasyon', q: 'Piyade Istasyon Etimesgut Ankara', desc: 'Yol yardım merkezi' },
        ].map((spot) => (
          <a key={spot.name}
             href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.q)}`}
             target="_blank" rel="noreferrer"
             className="block rounded-2xl p-4 hover:-translate-y-0.5 transition-all"
             style={{ background:'var(--card)', border:'1px solid var(--line)', boxShadow:'var(--shadow-sm)' }}>
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'var(--accent-soft)' }}>
                <MapPin size={18} color="var(--accent)" />
              </div>
              <div className="min-w-0">
                <div className="serif text-[16px] font-semibold" style={{ color:'var(--ink)' }}>{spot.name}</div>
                <div className="sans text-[12px] mt-0.5" style={{ color:'var(--ink-3)' }}>{spot.desc}</div>
                <div className="sans text-[11px] mt-2 flex items-center gap-1" style={{ color:'var(--accent)' }}>
                  Google Maps'te aç <ExternalLink size={11} />
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}

function AdminView({ onBack }) {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [mechanics, setMechanics] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');

  const callApi = async (action, data = {}) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, action, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Hata');
    return json;
  };

  const tryLogin = async (e) => {
    e?.preventDefault?.();
    setAuthError('');
    setAuthLoading(true);
    try {
      await callApi('verify');
      setAuthed(true);
      loadList();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const loadList = async (q = '') => {
    setLoading(true);
    try {
      const { mechanics } = await callApi('list_mechanics', { search: q });
      setMechanics(mechanics);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (id, fields) => {
    setSaveMsg('Kaydediliyor...');
    try {
      await callApi('update_mechanic', { id, fields });
      setSaveMsg('✓ Kaydedildi');
      setTimeout(() => setSaveMsg(''), 2000);
      loadList(search);
      setEditing(null);
    } catch (err) {
      setSaveMsg('✗ ' + err.message);
    }
  };

  const onDelete = async (id, name) => {
    if (!confirm(`"${name}" silinsin mi? Geri alınamaz.`)) return;
    try {
      await callApi('delete_mechanic', { id });
      loadList(search);
      setEditing(null);
    } catch (err) {
      alert('Silme hatası: ' + err.message);
    }
  };

  if (!authed) {
    return (
      <main className="max-w-md mx-auto px-5 pt-20 pb-32 lg:pb-12">
        <div className="rounded-3xl p-8 fadeUp" style={{ background:'var(--card)', border:'1px solid var(--line)', boxShadow:'var(--shadow-md)' }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="serif text-[24px] font-semibold" style={{ color:'var(--ink)' }}>Yönetici Girişi</h2>
              <p className="sans text-[12.5px] mt-1" style={{ color:'var(--ink-3)' }}>Şifre ile devam et</p>
            </div>
            <Shield size={28} color="var(--accent)" />
          </div>
          <form onSubmit={tryLogin}>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin şifresi"
              className="w-full sans text-[14px] py-3 px-4 rounded-2xl outline-none"
              style={{ background:'var(--bg-warm)', border:'1px solid var(--line)' }}
            />
            {authError && (
              <div className="sans text-[12.5px] mt-3" style={{ color:'#B91C1C' }}>{authError}</div>
            )}
            <button type="submit" disabled={authLoading || !password}
              className="sans w-full mt-4 py-3 rounded-2xl text-[14px] font-semibold transition-all"
              style={{ background:'var(--ink)', color:'white', opacity: authLoading || !password ? 0.5 : 1 }}>
              {authLoading ? 'Kontrol ediliyor...' : 'Giriş Yap'}
            </button>
          </form>
          <button onClick={onBack}
            className="sans w-full mt-3 py-2 text-[12.5px]" style={{ color:'var(--ink-3)' }}>
            ← Siteye dön
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-5 pt-6 pb-32 lg:pb-12">
      <div className="flex items-center justify-between mb-5 fadeUp">
        <div>
          <h2 className="serif text-[28px] sm:text-[34px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>
            Yönetici Paneli
          </h2>
          <p className="sans text-[13px] mt-1" style={{ color:'var(--ink-3)' }}>
            {mechanics.length} usta · arama yap, düzenle, PRO işaretle
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {saveMsg && <span className="sans text-[12px]" style={{ color:'var(--ink-2)' }}>{saveMsg}</span>}
          <button onClick={onBack}
            className="sans text-[13px] font-medium px-4 py-2 rounded-full"
            style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
            ← Çık
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); loadList(search); }}
        className="flex items-center gap-2 rounded-full p-1.5 mb-6"
        style={{ background:'var(--card)', border:'1px solid var(--line)' }}>
        <div className="pl-4"><Search size={17} color="var(--ink-3)" /></div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Usta adı ile ara..."
          className="flex-1 bg-transparent outline-none sans text-[14px] py-2.5"
          style={{ color:'var(--ink)' }}
        />
        <button type="submit"
          className="sans text-[13px] font-semibold px-5 py-2.5 rounded-full"
          style={{ background:'var(--ink)', color:'white' }}>Ara</button>
      </form>

      {loading && <div className="sans text-center py-10" style={{ color:'var(--ink-3)' }}>Yükleniyor...</div>}

      <div className="space-y-2">
        {mechanics.map((m) => (
          <div key={m.id}
            className={`rounded-2xl p-4 cursor-pointer transition-all ${editing === m.id ? 'ring-2' : ''}`}
            style={{
              background: 'var(--card)',
              border: m.featured ? '2px solid #DC2626' : '1px solid var(--line)',
              ...(editing === m.id ? { '--tw-ring-color': 'var(--accent)' } : {}),
            }}>
            <div className="flex items-start justify-between gap-3" onClick={() => setEditing(editing === m.id ? null : m.id)}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {m.featured && (
                    <span className="sans text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background:'#DC2626', color:'white' }}>★ PRO</span>
                  )}
                  <span className="serif text-[16px] font-semibold truncate" style={{ color:'var(--ink)' }}>{m.name}</span>
                </div>
                <div className="sans text-[12px]" style={{ color:'var(--ink-3)' }}>
                  {m.sector} · {m.neighborhood ?? '—'} · {m.phone ?? 'tel yok'} · ★ {m.rating} ({m.review_count})
                </div>
              </div>
              <ChevronRight size={18} color="var(--ink-3)"
                style={{ transform: editing === m.id ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
            </div>

            {editing === m.id && (
              <AdminEditForm mechanic={m} onSave={onSave} onDelete={onDelete} />
            )}
          </div>
        ))}
      </div>

      {!loading && mechanics.length === 0 && (
        <div className="text-center py-10 sans text-[13px]" style={{ color:'var(--ink-3)' }}>
          Sonuç yok. Aramayı temizle.
        </div>
      )}
    </main>
  );
}

function AdminEditForm({ mechanic, onSave, onDelete }) {
  const [f, setF] = useState({
    name: mechanic.name ?? '',
    sector: mechanic.sector ?? 'mekanik',
    neighborhood: mechanic.neighborhood ?? '',
    phone: mechanic.phone ?? '',
    rating: mechanic.rating ?? 4.5,
    review_count: mechanic.review_count ?? 0,
    featured: mechanic.featured ?? false,
    google_maps_url: mechanic.google_maps_url ?? '',
    notes: mechanic.notes ?? '',
  });

  const update = (k, v) => setF(prev => ({ ...prev, [k]: v }));

  return (
    <div className="mt-4 pt-4 grid sm:grid-cols-2 gap-3" style={{ borderTop:'1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
      <Field label="Dükkan Adı"><input value={f.name} onChange={(e) => update('name', e.target.value)} className="admin-input" /></Field>
      <Field label="Sektör">
        <select value={f.sector} onChange={(e) => update('sector', e.target.value)} className="admin-input">
          {['mekanik','servis','kaporta','lastik','elektrik','ekspertiz','yikama'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Mahalle"><input value={f.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} className="admin-input" /></Field>
      <Field label="Telefon"><input value={f.phone} onChange={(e) => update('phone', e.target.value)} className="admin-input" /></Field>
      <Field label="Puan"><input type="number" step="0.1" min="0" max="5" value={f.rating} onChange={(e) => update('rating', parseFloat(e.target.value))} className="admin-input" /></Field>
      <Field label="Yorum Sayısı"><input type="number" min="0" value={f.review_count} onChange={(e) => update('review_count', parseInt(e.target.value) || 0)} className="admin-input" /></Field>
      <Field label="Google Maps URL (özel — boş bırakırsan otomatik arama yapar)" full>
        <input value={f.google_maps_url} onChange={(e) => update('google_maps_url', e.target.value)}
               placeholder="https://www.google.com/maps/place/... veya boş"
               className="admin-input" />
      </Field>
      <Field label="Yönetici Notu" full>
        <textarea value={f.notes} onChange={(e) => update('notes', e.target.value)} rows={2}
          placeholder="İç not, kullanıcılar görmez"
          className="admin-input" />
      </Field>
      <div className="sm:col-span-2 flex items-center justify-between mt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={f.featured} onChange={(e) => update('featured', e.target.checked)} />
          <span className="sans text-[13px] font-semibold" style={{ color:'#DC2626' }}>★ PRO olarak işaretle (en üstte gözükür)</span>
        </label>
        <div className="flex gap-2">
          <button onClick={() => onDelete(mechanic.id, mechanic.name)}
            className="sans text-[12.5px] font-medium px-3 py-2 rounded-xl"
            style={{ background:'transparent', color:'#B91C1C', border:'1px solid #FECACA' }}>Sil</button>
          <button onClick={() => onSave(mechanic.id, f)}
            className="sans text-[13px] font-semibold px-5 py-2 rounded-xl"
            style={{ background:'var(--ink)', color:'white' }}>Kaydet</button>
        </div>
      </div>
      <style>{`.admin-input { width:100%; padding:0.55rem 0.75rem; border-radius:0.6rem; background:var(--bg-warm); border:1px solid var(--line); font-family:'Geist',sans-serif; font-size:13px; color:var(--ink); outline:none; }`}</style>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <div className="sans text-[10.5px] uppercase tracking-[0.12em] mb-1" style={{ color:'var(--ink-3)' }}>{label}</div>
      {children}
    </div>
  );
}

function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const whatsappMsg = encodeURIComponent('Merhaba, ototamircimonline üzerinden ulaşıyorum.');
  return (
    <div className="fixed right-4 bottom-24 lg:bottom-6 z-40 flex flex-col gap-3 items-end">
      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Yukarı çık"
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110 fadeIn"
          style={{ background:'var(--ink)', color:'white', boxShadow:'var(--shadow-lg)' }}
        >
          <ArrowUp size={20} strokeWidth={2.4} />
        </button>
      )}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`}
        target="_blank" rel="noreferrer"
        aria-label="WhatsApp ile yaz"
        className="w-14 h-14 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background:'#25D366', color:'white', boxShadow:'var(--shadow-lg)' }}
      >
        <MessageCircle size={24} strokeWidth={2.2} fill="white" color="#25D366" />
      </a>
    </div>
  );
}

export default function App() {
  // URL'den admin/harita view'ı algıla
  const initialView = (() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#admin') return 'admin';
    if (path === '/harita' || hash === '#harita') return 'map';
    return 'home';
  })();
  const [view, setView] = useState(initialView);
  const goToView = (v) => {
    setView(v);
    if (typeof window !== 'undefined') {
      const newHash = v === 'home' ? '' : `#${v === 'map' ? 'harita' : v}`;
      window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      window.scrollTo({ top: 0 });
    }
  };

  const [activeCat, setActiveCat] = useState('all');
  const [activeNeighborhood, setActiveNeighborhood] = useState('all');
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [navTab, setNavTab] = useState('home');
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  useEffect(() => {
    fetchAvailableNeighborhoods()
      .then((list) => setNeighborhoods(list))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMechanics({ category: activeCat, neighborhood: activeNeighborhood, query: submittedQuery })
      .then((list) => {
        if (cancelled) return;
        const sorted = [...list].sort((a, b) => {
          // 1) Featured (PRO) ustalar en üstte
          const af = a.featured ? 1 : 0, bf = b.featured ? 1 : 0;
          if (bf !== af) return bf - af;
          // 2) Sonra fiyatı olanlar
          const ap = a.transparentPrices.length > 0 ? 1 : 0;
          const bp = b.transparentPrices.length > 0 ? 1 : 0;
          if (bp !== ap) return bp - ap;
          // 3) Sonra puana göre
          const ar = a.rating ?? 0, br = b.rating ?? 0;
          if (br !== ar) return br - ar;
          // 4) En sonda yorum sayısı
          return (b.reviews ?? 0) - (a.reviews ?? 0);
        });
        setMechanics(sorted);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeCat, activeNeighborhood, submittedQuery]);

  // Filtre değiştiğinde sayfalamayı sıfırla
  useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [activeCat, activeNeighborhood, submittedQuery]);

  const handleWriteReview = (mechanic) => {
    // place_id olmadığı için Google Maps aramasına yönlendir;
    // kullanıcı oradan "Yorum yaz" diyebilir.
    window.open(googleMapsSearchUrl(mechanic), '_blank', 'noopener,noreferrer');
  };

  const submitSearch = (e) => {
    e?.preventDefault?.();
    setSubmittedQuery(query);
  };

  return (
    <div className="min-h-screen sans grain" style={{ background:'var(--bg)' }}>
      <style>{FONT_INJECT}</style>

      <header className="sticky top-0 z-20 backdrop-blur-xl"
        style={{ background:'rgba(250,250,246,0.82)', borderBottom:'1px solid var(--line)' }}>
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <button onClick={() => goToView('home')} className="cursor-pointer">
            <Logo />
          </button>
          <div className="hidden lg:flex items-center gap-7 sans text-[13.5px]" style={{ color:'var(--ink-2)' }}>
            <button onClick={() => goToView('home')}
              className={`hover:text-[var(--ink)] transition ${view === 'home' ? 'text-[var(--ink)] font-semibold' : ''}`}>
              Keşfet
            </button>
            <button onClick={() => goToView('map')}
              className={`hover:text-[var(--ink)] transition ${view === 'map' ? 'text-[var(--ink)] font-semibold' : ''}`}>
              Harita
            </button>
            <a href={`mailto:${CONTACT_EMAIL}?subject=Usta kayıt başvurusu`}
              className="hover:text-[var(--ink)] transition">Usta misin?</a>
          </div>
          <button onClick={() => goToView('admin')}
            className="sans text-[13px] font-medium px-4 py-2 rounded-full"
            style={{ background:'var(--ink)', color:'white' }}>
            {view === 'admin' ? '✓ Yönetici' : 'Giriş Yap'}
          </button>
        </div>
      </header>

      {view === 'map' && <MapView onBack={() => goToView('home')} />}
      {view === 'admin' && <AdminView onBack={() => goToView('home')} />}

      {view === 'home' && (
      <main className="max-w-6xl mx-auto px-5 pt-8 pb-32 lg:pb-12">
        <section className="fadeUp">
          <div className="flex items-center gap-2 sans text-[11px] uppercase tracking-[0.18em] mb-4"
            style={{ color:'var(--ink-3)' }}>
            <span className="relative inline-block w-1.5 h-1.5 rounded-full pulseRing"
              style={{ background:'var(--accent)' }} />
            Etimesgut · Sadece 4.5+ puanlı ustalar
          </div>
          <h1 className="serif text-[40px] sm:text-[56px] leading-[0.98] font-semibold tracking-tight max-w-3xl"
            style={{ color:'var(--ink)' }}>
            Güvenilir oto ustası,
            <span className="block italic" style={{ color:'var(--accent)' }}>şeffaf fiyatla.</span>
          </h1>
          <p className="sans text-[15px] sm:text-[16px] mt-4 max-w-xl" style={{ color:'var(--ink-2)' }}>
            Etimesgut'un en iyi puanlı oto ustaları tek listede. Topluluktan gelen şeffaf fiyatlarla
            ücret pazarlığı yapmadan bul.
          </p>

          <form onSubmit={submitSearch} className="mt-7 flex items-center gap-2 rounded-full p-1.5 max-w-2xl"
            style={{ background:'var(--card)', border:'1px solid var(--line)', boxShadow:'var(--shadow-md)' }}>
            <div className="pl-4 flex items-center"><Search size={17} color="var(--ink-3)" /></div>
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="Bölge veya hizmet ara…"
              className="flex-1 bg-transparent outline-none sans text-[14px] py-2.5"
              style={{ color:'var(--ink)' }}
            />
            <button type="submit" className="sans text-[13px] font-semibold px-5 py-2.5 rounded-full"
              style={{ background:'var(--ink)', color:'white' }}>
              Ara
            </button>
          </form>
        </section>

        <section className="mt-9 fadeUp" style={{ animationDelay:'120ms' }}>
          <CategoryPills active={activeCat} onChange={setActiveCat} />
        </section>

        {neighborhoods.length > 0 && (
          <section className="mt-3 fadeUp" style={{ animationDelay:'150ms' }}>
            <NeighborhoodPills active={activeNeighborhood} options={neighborhoods} onChange={setActiveNeighborhood} />
          </section>
        )}

        <div className="mt-7 flex items-baseline justify-between fadeUp" style={{ animationDelay:'180ms' }}>
          <h2 className="serif text-[22px] font-semibold" style={{ color:'var(--ink)' }}>
            {loading ? 'Aranıyor…' : `${mechanics.length} usta bulundu`}
          </h2>
          <span className="sans text-[12.5px] font-medium" style={{ color:'var(--ink-3)' }}>
            Sırala: Fiyatlı önce, sonra puan
          </span>
        </div>

        {error && (
          <div className="mt-5 rounded-2xl p-4 sans text-[13px]" style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
            <b>API hatası:</b> {error}
          </div>
        )}

        <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} delay={i * 60} />)
            : mechanics.slice(0, displayCount).map((m, i) => (
                <MechanicCard key={m.id} m={m} onOpen={setSelected} delay={Math.min(i, 12) * 60} />
              ))
          }
        </section>

        {!loading && mechanics.length > displayCount && (
          <div className="mt-8 flex flex-col items-center gap-3 fadeUp">
            <div className="sans text-[13px]" style={{ color:'var(--ink-3)' }}>
              {displayCount} / {mechanics.length} usta gösteriliyor
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDisplayCount(c => Math.min(c + PAGE_SIZE, mechanics.length))}
                className="sans text-[13.5px] font-semibold px-6 py-3 rounded-full transition-all hover:scale-[1.02]"
                style={{ background:'var(--ink)', color:'white', boxShadow:'var(--shadow-md)' }}>
                Daha Fazla Göster (+{Math.min(PAGE_SIZE, mechanics.length - displayCount)})
              </button>
              <button
                onClick={() => setDisplayCount(mechanics.length)}
                className="sans text-[13px] font-medium px-5 py-3 rounded-full"
                style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
                Tümünü Göster
              </button>
            </div>
          </div>
        )}

        {!loading && mechanics.length > 0 && displayCount >= mechanics.length && mechanics.length > PAGE_SIZE && (
          <div className="mt-8 text-center sans text-[13px]" style={{ color:'var(--ink-3)' }}>
            ✓ Tüm {mechanics.length} usta gösterildi
          </div>
        )}

        {!loading && mechanics.length === 0 && !error && (
          <div className="mt-10 rounded-3xl p-10 text-center"
            style={{ background:'var(--card)', border:'1px dashed var(--line)' }}>
            <div className="serif text-[20px] font-semibold" style={{ color:'var(--ink)' }}>Sonuç yok</div>
            <p className="sans text-[13px] mt-1" style={{ color:'var(--ink-3)' }}>
              Filtreyi temizleyip tekrar dene.
            </p>
          </div>
        )}

        <section className="mt-14 rounded-3xl overflow-hidden relative fadeUp" style={{ animationDelay:'250ms' }}>
          <div className="p-7 sm:p-10" style={{
            background: 'linear-gradient(135deg, var(--ink) 0%, #2A211A 100%)',
            color:'white'
          }}>
            <div className="grid sm:grid-cols-3 gap-7">
              <div className="sm:col-span-2">
                <div className="sans text-[11px] uppercase tracking-[0.18em] opacity-70">Neden Kurduk?</div>
                <div className="serif text-[28px] sm:text-[34px] mt-2 font-semibold leading-tight">
                  Aynı arabaya <span className="italic" style={{ color:'#FBBF77' }}>10 bin TL fark.</span>
                </div>
                <p className="sans text-[14px] mt-4 opacity-85 max-w-xl leading-relaxed">
                  Bir gün arabamı çekiciyle Şaşmaz'a, bir ustaya götürdüm. <b>"80 bin TL"</b> dediler.
                  İnanmadım, aracı tekrar Başkent sanayiye götürdüm — orada <b>"70 bin TL"</b> dediler.
                  Aynı arıza, aynı parça. 10 bin TL fark.
                </p>
                <p className="sans text-[14px] mt-3 opacity-85 max-w-xl leading-relaxed">
                  Sonunda arabayı yaptırmadan sattım. <b style={{ color:'#FBBF77' }}>İşte bu yüzden bu siteyi kurduk:</b>
                  hangi ustanın güvenilir olduğunu, gerçek fiyatları ve şeffaf işçiliği görebileceğin
                  tek yer olsun istedik.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
                {[
                  { k:'417', v:'Doğrulanmış usta' },
                  { k:'≥4.5', v:'Puan filtresi' },
                  { k:'7', v:'Sade kategori' },
                ].map((s,i)=>(
                  <div key={i}>
                    <div className="serif text-[28px] font-semibold" style={{ color:'#FBBF77' }}>{s.k}</div>
                    <div className="sans text-[11.5px] opacity-75">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-12 pt-8 sans text-[13px]"
          style={{ borderTop:'1px solid var(--line)', color:'var(--ink-3)' }}>
          <div className="grid sm:grid-cols-3 gap-6 mb-6">
            <div>
              <div className="serif text-[16px] font-semibold mb-2" style={{ color:'var(--ink)' }}>OtoTamircimOnline</div>
              <p className="text-[12.5px] leading-relaxed">
                Etimesgut'un en iyi puanlı oto ustaları, şeffaf fiyatlarla.
              </p>
            </div>
            <div>
              <div className="sans text-[10.5px] uppercase tracking-[0.14em] mb-2" style={{ color:'var(--ink-2)' }}>İletişim</div>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 mb-1.5 hover:text-[var(--ink)]">
                <Mail size={13} /> {CONTACT_EMAIL}
              </a>
              <a href={`https://instagram.com/${INSTAGRAM_USER}`} target="_blank" rel="noreferrer"
                 className="flex items-center gap-2 mb-1.5 hover:text-[var(--ink)]">
                <Instagram size={13} /> @{INSTAGRAM_USER}
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
                 className="flex items-center gap-2 hover:text-[var(--ink)]">
                <MessageCircle size={13} /> WhatsApp
              </a>
            </div>
            <div>
              <div className="sans text-[10.5px] uppercase tracking-[0.14em] mb-2" style={{ color:'var(--ink-2)' }}>Bağlantılar</div>
              <a href="#" className="block mb-1.5 hover:text-[var(--ink)]">Hakkımızda</a>
              <a href="#" className="block mb-1.5 hover:text-[var(--ink)]">Usta misin? Kayıt ol</a>
              <a href="#" className="block hover:text-[var(--ink)]">Gizlilik · Şartlar</a>
            </div>
          </div>
          <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px]"
            style={{ borderTop:'1px solid var(--line)' }}>
            <div>© 2026 ototamircimonline · Ankara</div>
            <div>Etimesgut · 417 doğrulanmış usta</div>
          </div>
        </footer>
      </main>
      )}

      <DetailSheet mechanic={selected} onClose={()=>setSelected(null)} onWriteReview={handleWriteReview} />
      <BottomNav active={navTab} onChange={(tab) => {
        setNavTab(tab);
        if (tab === 'home') goToView('home');
        if (tab === 'map') goToView('map');
      }} />
      <FloatingActions />
    </div>
  );
}
