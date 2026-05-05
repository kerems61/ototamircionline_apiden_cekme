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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Geist:wght@300;400;500;600;700;800&display=swap');
:root{
  --bg: #FBF6EE;
  --bg-warm: #F6EFE2;
  --bg-card: #FFFFFF;
  --ink: #1A1410;
  --ink-2: #5C5046;
  --ink-3: #9A8E80;
  --line: #ECE3D2;
  --line-2: #F2EADB;
  --card: #FFFFFF;
  --accent: #C2410C;
  --accent-2: #EA580C;
  --accent-soft: #FEF1E6;
  --green: #166534;
  --green-soft: #ECFDF5;
  --gold: #D97706;
  --pro: #DC2626;
  --pro-soft: #FEE2E2;
  /* Soft gradient mesh paleti — şeftali → kayısı → terrakota → dusty rose */
  --grad-peach: #FFE6D0;
  --grad-apricot: #FFD2A8;
  --grad-coral: #FFC2A0;
  --grad-rose: #F7D2C8;
  --grad-cream: #FFF6E8;
  --grad-mint-soft: #E8F0E2;
  --shadow-sm: 0 1px 2px rgba(60,30,15,.04), 0 1px 3px rgba(60,30,15,.03);
  --shadow-md: 0 2px 4px rgba(60,30,15,.04), 0 12px 28px rgba(60,30,15,.08);
  --shadow-lg: 0 1px 2px rgba(60,30,15,.04), 0 28px 60px -18px rgba(120,60,20,.18);
  --shadow-xl: 0 1px 2px rgba(60,30,15,.05), 0 40px 80px -20px rgba(120,60,20,.24);
  --shadow-pro: 0 0 0 1px rgba(220,38,38,.18), 0 16px 36px -10px rgba(220,38,38,.32);
  --shadow-soft: 0 8px 24px -8px rgba(194,65,12,.18), 0 2px 6px rgba(60,30,15,.04);
}
html { scroll-behavior: smooth; }
body { background: var(--bg); }
/* Sabit gradient mesh — pseudo-element, scroll'da repaint yapmaz */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background-image:
    radial-gradient(900px 700px at 12% -8%,  rgba(255,194,160,0.55) 0%, transparent 55%),
    radial-gradient(800px 600px at 92% 4%,   rgba(247,210,200,0.55) 0%, transparent 60%),
    radial-gradient(900px 700px at 50% 110%, rgba(255,228,196,0.55) 0%, transparent 60%),
    radial-gradient(700px 500px at 100% 60%, rgba(232,240,226,0.40) 0%, transparent 65%);
}
.serif {
  font-family: 'Playfair Display', 'Fraunces', ui-serif, Georgia, serif;
  letter-spacing: 0.005em;
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "dlig" 0, "clig" 0, "calt" 0;
}
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
@keyframes proGlow {
  /* Sade hâl — box-shadow animate etmek yerine sabit gölge, GPU'yu yormaz */
  0%, 100% { opacity: 1; }
}
@keyframes float { 0%,100%{ transform:translateY(0); } 50%{ transform:translateY(-6px); } }
@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.fadeUp { animation: fadeUp .7s cubic-bezier(.2,.8,.2,1) both; }
.fadeIn { animation: fadeIn .5s ease both; }
.slideUp { animation: slideUp .45s cubic-bezier(.2,.8,.2,1) both; }
.pulseRing::after{
  content:''; position:absolute; inset:-4px; border-radius:9999px;
  animation: pulseRing 1.8s ease-out infinite;
}
.proGlow { animation: proGlow 2.4s ease-in-out infinite; }
.skeleton {
  background: linear-gradient(90deg, #EEE9DD 0%, #F6F2E8 50%, #EEE9DD 100%);
  background-size: 800px 100%;
  animation: shimmer 1.4s linear infinite;
}
.scrollbar-none::-webkit-scrollbar { display:none; }
.scrollbar-none { scrollbar-width: none; }
.grain {
  background-image:
    radial-gradient(1400px 700px at 110% -20%, rgba(194,65,12,.07), transparent 60%),
    radial-gradient(900px 500px at -10% 110%, rgba(22,101,52,.04), transparent 60%),
    radial-gradient(600px 400px at 50% 50%, rgba(217,119,6,.025), transparent 70%);
}
.glass {
  background: rgba(255,250,243,0.86);
  backdrop-filter: blur(8px) saturate(140%);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
}
.glass-soft {
  background: rgba(255,253,248,0.92);
  backdrop-filter: blur(8px) saturate(130%);
  -webkit-backdrop-filter: blur(8px) saturate(130%);
  border: 1px solid rgba(255,255,255,0.55);
}
/* Yumuşak aurora blob'ları — hero arka planı için (statik, GPU'yu yormaz) */
.aurora-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.62;
  pointer-events: none;
}
/* Soft gradient kart yüzeyi — şeftali ışıltılı */
.gradient-card {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(255,250,244,0.94) 100%),
    radial-gradient(120% 100% at 0% 0%, rgba(255,210,168,0.20) 0%, transparent 60%);
  background-blend-mode: normal, normal;
}
.gradient-card-pro {
  background:
    linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(255,242,238,0.95) 100%),
    radial-gradient(140% 100% at 0% 0%, rgba(255,180,160,0.22) 0%, transparent 55%);
}
/* Buton/pill için ince gradient */
.btn-gradient-ink {
  background: linear-gradient(135deg, #1A1410 0%, #2A2018 100%);
}
.btn-gradient-accent {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
  box-shadow: 0 6px 16px -4px rgba(194,65,12,0.40);
}
.card-hover {
  transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s cubic-bezier(.2,.8,.2,1), border-color .25s ease;
}
.card-hover:hover {
  transform: translateY(-4px) scale(1.005);
  box-shadow: var(--shadow-lg);
  border-color: var(--line-2);
}
.tap-highlight { -webkit-tap-highlight-color: transparent; }
button, a { -webkit-tap-highlight-color: transparent; }
input, textarea, select { font-family: 'Geist', ui-sans-serif, system-ui, sans-serif; }
input:focus, textarea:focus { box-shadow: 0 0 0 3px rgba(194,65,12,0.12); }
.dot-pattern {
  background-image: radial-gradient(rgba(20,17,15,0.07) 1px, transparent 1px);
  background-size: 18px 18px;
}
`;

// Lucide icon name → React component (kategori DB'den geldiğinde icon string'i resolve etmek için)
const ICON_MAP = {
  Sparkles, Wrench, Shield, Hammer, Zap, Droplet, CircleDot, BadgeCheck,
  Search, MapPin, Star, Clock, Phone, Heart, User, Navigation, Send, Mail, MessageCircle,
};
function resolveIcon(name) {
  return ICON_MAP[name] || Sparkles;
}

// Default fallback — DB'den kategoriler gelmezse veya migration_003 çalışmamışsa kullanılır
const DEFAULT_CATEGORIES = [
  { id: 'all',       label: 'Tümü',              icon: Sparkles,   tones: ['#2C2825', '#4A3F33'] },
  { id: 'mekanik',   label: 'Motor & Mekanik',   icon: Wrench,     tones: ['#1F1B16', '#3F3525'] },
  { id: 'servis',    label: 'Marka Servisi',     icon: BadgeCheck, tones: ['#1F2937', '#374151'] },
  { id: 'kaporta',   label: 'Kaporta & Boya',    icon: Hammer,     tones: ['#3B2616', '#6B4226'] },
  { id: 'lastik',    label: 'Lastik & Jant',     icon: CircleDot,  tones: ['#1E3A2E', '#2F5443'] },
  { id: 'elektrik',  label: 'Elektrik & Klima',  icon: Zap,        tones: ['#5C3A0E', '#8C5A1E'] },
  { id: 'ekspertiz', label: 'Ekspertiz',         icon: Shield,     tones: ['#1F3A4F', '#2F5478'] },
  { id: 'yikama',    label: 'Yıkama & Detailing',icon: Droplet,    tones: ['#0F3F4F', '#1E5A6F'] },
];

// Bu canlı CATEGORIES dizisi App mount'ta DB'den dolduruluyor (replace), yoksa default kalıyor
let CATEGORIES = DEFAULT_CATEGORIES;

const WHATSAPP_NUMBER = '905459029241';
const CONTACT_EMAIL = 'ototamircim134@gmail.com';
const INSTAGRAM_USER = 'ototamircimonline';

function getDisplayWord(name) {
  if (!name) return '??';
  // Anlamlı kelimeleri ayrıştır (en az 2 harf + harf içeren)
  const words = name.trim()
    .split(/[\s\-,&.|/]+/)
    .filter(w => w.length >= 2 && /[A-Za-zÀ-ÿĞğÜüŞşİıÖöÇç]/.test(w));
  if (words.length === 0) return name.slice(0, 12).toLocaleUpperCase('tr-TR');

  const first = words[0];

  // Tek kelime ya da ilk kelime uzunsa → ilk kelime
  if (words.length === 1 || first.length >= 11) {
    return first.slice(0, 13).toLocaleUpperCase('tr-TR');
  }

  // İlk 2 kelime birleştirilebilirse (toplam ≤ 16 char) → ikisini göster
  const combined = `${first} ${words[1]}`;
  if (combined.length <= 16) return combined.toLocaleUpperCase('tr-TR');

  // Aksi takdirde sadece ilk kelime
  return first.slice(0, 13).toLocaleUpperCase('tr-TR');
}

function haversineKm(a, b) {
  if (!a || !b || a.lat == null || b.lat == null || a.lng == null || b.lng == null) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function googleMapsSearchUrl(mechanic) {
  // 1) Admin tarafından özel URL set edildiyse onu kullan
  if (mechanic.googleMapsUrl) return mechanic.googleMapsUrl;
  // 2) Gerçek place_id varsa direkt o yere git (en doğrusu)
  if (mechanic.placeId) {
    return `https://www.google.com/maps/place/?q=place_id:${mechanic.placeId}`;
  }
  // 3) Fallback: isim + mahalle + Etimesgut Ankara araması
  const parts = [
    mechanic.name,
    mechanic.neighborhood,
    'Etimesgut Ankara',
  ].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(' '))}`;
}

function googleWriteReviewUrl(mechanic) {
  // place_id varsa direkt yorum yazma sayfasına git
  if (mechanic.placeId) {
    return `https://search.google.com/local/writereview?placeid=${mechanic.placeId}`;
  }
  return googleMapsSearchUrl(mechanic);
}

function googleDirectionsUrl(mechanic) {
  if (mechanic.placeId) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mechanic.name)}&destination_place_id=${mechanic.placeId}`;
  }
  const parts = [mechanic.name, mechanic.neighborhood, 'Etimesgut Ankara'].filter(Boolean);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(' '))}`;
}

const DEFAULT_PAGE_SIZE_DESKTOP = 15;
const DEFAULT_PAGE_SIZE_MOBILE = 5;
const PAGE_SIZE_OPTIONS = [5, 15, 30, 60, 100];
const getInitialPageSize = () => {
  if (typeof window === 'undefined') return DEFAULT_PAGE_SIZE_DESKTOP;
  return window.innerWidth < 640 ? DEFAULT_PAGE_SIZE_MOBILE : DEFAULT_PAGE_SIZE_DESKTOP;
};

// Dinamik getter — CATEGORIES değiştiğinde güncel sonuç verir
const getCategoryById = (id) => CATEGORIES.find(c => c.id === id);

// DB satırını UI kategori formatına çevir
function dbRowToCategory(row) {
  return {
    id: row.id,
    label: row.label,
    icon: resolveIcon(row.icon),
    tones: [row.tone_dark || '#2C2825', row.tone_light || '#4A3F33'],
    is_default: row.is_default,
    sort_order: row.sort_order,
  };
}

async function fetchCategoriesPublic() {
  try {
    const { data, error } = await supabase.from('categories')
      .select('id, label, icon, tone_dark, tone_light, sort_order, is_default')
      .order('sort_order', { ascending: true });
    if (error) return null;
    return data;
  } catch { return null; }
}

function mapRow(row) {
  // Çoklu kategori — sectors[] varsa onu kullan, yoksa eski tek 'sector'a fallback
  const sectorIds = (Array.isArray(row.sectors) && row.sectors.length > 0)
    ? row.sectors
    : (row.sector ? [row.sector] : []);
  const primaryId = sectorIds[0] ?? 'all';
  const primaryCat = getCategoryById(primaryId) ?? getCategoryById('all') ?? DEFAULT_CATEGORIES[0];
  const allCats = sectorIds.map(id => getCategoryById(id)).filter(Boolean);
  const prices = (row.mechanic_prices ?? [])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map(p => ({ service: p.service, priceTL: p.price_tl }));
  return {
    id: row.id,
    name: row.name ?? 'İsimsiz',
    district: row.district ?? 'Etimesgut',
    neighborhood: row.neighborhood ?? null,
    categoryId: primaryId,
    categoryLabel: primaryCat.label,
    sectorIds,                         // tüm sektör id'leri (filtreleme için)
    categories: allCats,               // tüm kategori objeleri (UI'da rozet için)
    googleCategory: row.google_category ?? null,
    rating: row.rating ?? 0,
    reviews: row.review_count ?? 0,
    phone: row.phone ?? null,
    address: row.address ?? '',
    openingHours: row.opening_hours ?? null,
    photoTone: primaryCat.tones,
    transparentPrices: prices,
    avgLaborTL: null,
    verifiedShop: prices.length > 0,
    featured: row.featured === true,
    googleMapsUrl: row.google_maps_url ?? null,
    notes: row.notes ?? null,
    placeId: row.place_id ?? null,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
  };
}

async function fetchMechanics({ category, neighborhood, query }) {
  const buildQuery = (useSectors) => {
    let q = supabase
      .from('mechanics')
      .select('*, mechanic_prices(service, price_tl, display_order)');
    if (category && category !== 'all') {
      q = useSectors
        ? q.or(`sectors.cs.{${category}},sector.eq.${category}`)
        : q.eq('sector', category);
    }
    if (neighborhood && neighborhood !== 'all') q = q.eq('neighborhood', neighborhood);
    if (query?.trim()) q = q.ilike('name', `%${query.trim()}%`);
    return q.limit(500);
  };
  // Önce sectors[] dahil dene; kolon yoksa eski 'sector' tek-değerli filtreye düş
  let { data, error } = await buildQuery(true);
  if (error && /sectors/i.test(error.message || '')) {
    ({ data, error } = await buildQuery(false));
  }
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

function MechanicPhoto({ tones, verified, featured, name, categoryIcon: CatIcon, categoryLabel, extraCategoriesCount = 0, distanceKm, isFavorite, onToggleFavorite }) {
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
      className="relative w-full h-28 sm:h-40 rounded-2xl overflow-hidden flex items-center justify-center"
      style={{ background: grad }}
    >
      <div className="absolute inset-0 opacity-40"
        style={{ background:
          'repeating-linear-gradient(115deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px)' }} />

      {CatIcon && (
        <div className="absolute -right-3 -bottom-3 sm:-right-4 sm:-bottom-4 opacity-15">
          <CatIcon size={110} color="white" strokeWidth={1.5} />
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
        <div className="absolute bottom-3 left-3 sans text-[10.5px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1.5"
          style={{ background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.95)', border:'1px solid rgba(255,255,255,0.2)' }}>
          <span>{categoryLabel}</span>
          {extraCategoriesCount > 0 && (
            <span className="font-bold px-1.5 py-0.5 rounded-full"
              style={{ background:'rgba(255,255,255,0.30)', fontSize:'9.5px' }}>
              +{extraCategoriesCount}
            </span>
          )}
        </div>
      )}

      {distanceKm != null && (
        <div className="absolute bottom-3 right-3 sans text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-md"
          style={{ background:'rgba(255,255,255,0.95)', color:'var(--ink)', boxShadow:'0 2px 8px rgba(0,0,0,0.15)' }}>
          <Navigation size={11} strokeWidth={2.6} color="var(--accent)" />
          {distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`}
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
          <span className="sans text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
            style={{
              background:'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color:'white',
              boxShadow:'0 2px 8px rgba(16,185,129,0.35)',
            }}>
            ₺ Şeffaf Fiyat
          </span>
        )}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(); }}
        aria-label={isFavorite ? 'Kayıtlıdan çıkar' : 'Kayıtlılara ekle'}
        className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all hover:scale-110"
        style={{ background: isFavorite ? '#DC2626' : 'rgba(255,255,255,0.9)' }}>
        <Heart size={16} color={isFavorite ? 'white' : 'var(--ink)'} fill={isFavorite ? 'white' : 'none'} strokeWidth={2.2} />
      </button>
    </div>
  );
}

const MechanicCard = React.memo(function MechanicCard({ m, onOpen, delay = 0, isFavorite, onToggleFavorite }) {
  const hasPrices = m.transparentPrices.length > 0;
  const isPriced = hasPrices && !m.featured; // Fiyatı belli & PRO değil → yeşil görsel ipucu
  const cardBg = m.featured
    ? undefined
    : isPriced
      ? 'linear-gradient(135deg, rgba(255,255,255,0.97) 0%, rgba(236,253,245,0.94) 100%), radial-gradient(120% 100% at 0% 0%, rgba(16,185,129,0.14) 0%, transparent 60%)'
      : undefined;
  return (
    <article
      onClick={() => onOpen(m)}
      className={`fadeUp group cursor-pointer rounded-3xl p-3 sm:p-4 card-hover tap-highlight ${m.featured ? 'proGlow gradient-card-pro' : isPriced ? '' : 'gradient-card'}`}
      style={{
        background: cardBg,
        border: m.featured
          ? '1.5px solid rgba(220,38,38,0.32)'
          : isPriced
            ? '1.5px solid rgba(16,185,129,0.32)'
            : '1px solid rgba(255,255,255,0.65)',
        boxShadow: m.featured
          ? 'var(--shadow-pro)'
          : isPriced
            ? '0 10px 28px -10px rgba(16,185,129,0.32), 0 2px 6px rgba(60,30,15,0.04)'
            : 'var(--shadow-soft)',
        animationDelay: `${delay}ms`,
      }}
    >
      <MechanicPhoto
        tones={m.photoTone}
        verified={m.verifiedShop}
        featured={m.featured}
        name={m.name}
        categoryIcon={getCategoryById(m.categoryId)?.icon}
        categoryLabel={m.categoryLabel}
        extraCategoriesCount={Math.max(0, (m.categories?.length ?? 1) - 1)}
        distanceKm={m.distanceKm}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="pt-4 px-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="serif text-[18px] sm:text-[19px] font-semibold leading-tight truncate" style={{ color: 'var(--ink)' }}>
              {m.name}
            </h3>
            <p className="sans text-[12px] mt-1 flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--ink-3)' }}>
              <span className="font-medium" style={{ color: m.featured ? 'var(--pro)' : 'var(--accent)' }}>
                {(m.categories?.length > 0 ? m.categories : [{ label: m.categoryLabel }])
                  .map(c => c.label).join(' · ')}
              </span>
              {m.neighborhood && (
                <>
                  <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--ink-3)' }} />
                  <span>{m.neighborhood}</span>
                </>
              )}
            </p>
          </div>
          <StarRow rating={m.rating} reviews={m.reviews} dense />
        </div>

        <div className="mt-3 flex items-center gap-2.5 sans text-[12px] flex-wrap" style={{ color: 'var(--ink-2)' }}>
          {m.openingHours && (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background:'var(--bg-warm)' }}>
              <Clock size={11} strokeWidth={2.2} /> {m.openingHours}
            </span>
          )}
          {m.phone && (
            <a href={`tel:${m.phone.replace(/\s+/g,'')}`} onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
              style={{ background:'var(--bg-warm)' }}>
              <Phone size={11} strokeWidth={2.2} /> {m.phone}
            </a>
          )}
        </div>

        {hasPrices && (
          <div className="mt-3">
            <div className="sans flex items-center justify-between gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'var(--accent-soft)', border:'1px solid rgba(194,65,12,0.12)' }}>
              <div className="min-w-0 flex items-center gap-1.5">
                <Shield size={11} color="var(--accent)" strokeWidth={2.6} className="shrink-0" />
                <span className="text-[11.5px] font-medium truncate" style={{ color: 'var(--ink)' }}>{m.transparentPrices[0].service}</span>
              </div>
              <span className="text-[12px] font-bold whitespace-nowrap" style={{ color: 'var(--accent)' }}>
                {m.transparentPrices[0].priceTL.toLocaleString('tr-TR')} ₺
              </span>
            </div>
            {m.transparentPrices.length > 1 && (
              <div className="sans text-[11px] mt-1 text-center" style={{ color:'var(--ink-3)' }}>
                +{m.transparentPrices.length - 1} işçilik daha
              </div>
            )}
          </div>
        )}

        <button className="sans mt-4 w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-[13.5px] font-semibold transition-all hover:gap-2.5"
          style={{
            background: m.featured
              ? 'linear-gradient(135deg, var(--pro), #B91C1C)'
              : 'linear-gradient(135deg, #1A1410 0%, #2A2018 100%)',
            color: 'white',
            boxShadow: m.featured ? '0 8px 18px -4px rgba(220,38,38,0.40)' : '0 6px 14px -4px rgba(60,30,15,0.28)',
          }}>
          Detayları Gör <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
});

function CardSkeleton({ delay = 0 }) {
  return (
    <div
      className="fadeUp rounded-3xl p-3 sm:p-4 gradient-card"
      style={{ border: '1px solid rgba(255,255,255,0.65)', boxShadow:'var(--shadow-soft)', animationDelay: `${delay}ms` }}
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
            {(mechanic.categories?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {mechanic.categories.map(c => (
                  <span key={c.id} className="sans text-[10.5px] font-semibold px-2 py-1 rounded-full"
                    style={{ background:'rgba(255,255,255,0.22)', color:'white', border:'1px solid rgba(255,255,255,0.3)' }}>
                    {c.label}
                  </span>
                ))}
              </div>
            )}
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
              href={googleDirectionsUrl(mechanic)}
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

function BottomNav({ active, onChange, savedCount = 0 }) {
  const items = [
    { id:'home',   label:'Keşfet',   icon: Home          },
    { id:'map',    label:'Harita',   icon: MapPin        },
    { id:'saved',  label:'Kayıtlı',  icon: Heart, badge: savedCount > 0 ? savedCount : null },
    { id:'bildir', label:'Bildir',   icon: Send          },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
      style={{ paddingBottom:'env(safe-area-inset-bottom)' }}>
      <div className="px-2 pt-2 pb-2 backdrop-blur-xl"
        style={{
          background:'linear-gradient(180deg, rgba(255,250,243,0.82) 0%, rgba(255,246,232,0.95) 100%)',
          borderTop:'1px solid rgba(236,227,210,0.65)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          boxShadow: '0 -10px 32px -6px rgba(120,60,20,0.10)',
        }}>
        <div className="grid grid-cols-4">
          {items.map(({id,label,icon:Icon,badge})=>{
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
                  {badge != null && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full flex items-center justify-center text-[9.5px] font-bold px-1"
                      style={{ background:'#DC2626', color:'white' }}>
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
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

function MapView({ onBack, onSelectMechanic }) {
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const clusterGroupRef = React.useRef(null);
  const [allMechanics, setAllMechanics] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [leafletReady, setLeafletReady] = useState(false);

  // Leaflet'in yüklenmesini bekle
  useEffect(() => {
    if (window.L && window.L.markerClusterGroup) {
      setLeafletReady(true);
      return;
    }
    const check = setInterval(() => {
      if (window.L && window.L.markerClusterGroup) {
        setLeafletReady(true);
        clearInterval(check);
      }
    }, 100);
    return () => clearInterval(check);
  }, []);

  // Ustaları çek
  useEffect(() => {
    setLoading(true);
    supabase.from('mechanics')
      .select('id, name, sector, neighborhood, phone, rating, review_count, address, opening_hours, lat, lng, featured, google_maps_url')
      .not('lat', 'is', null)
      .limit(1000)
      .then(({ data, error }) => {
        if (error) console.error(error);
        setAllMechanics(data || []);
        setLoading(false);
      });
  }, []);

  // Haritayı başlat
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;
    const L = window.L;
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([39.9540, 32.6790], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    mapInstanceRef.current = map;
  }, [leafletReady]);

  // Marker'ları güncelle (filtre değiştiğinde)
  useEffect(() => {
    if (!leafletReady || !mapInstanceRef.current) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Eski cluster grubunu temizle
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const filtered = allMechanics.filter(m => filter === 'all' || m.sector === filter);
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 50,
    });

    filtered.forEach(m => {
      if (!m.lat || !m.lng) return;
      const cat = getCategoryById(m.sector) ?? getCategoryById('all');
      const isFeatured = m.featured;
      const color = isFeatured ? '#DC2626' : (cat.tones?.[1] || '#1F1B16');
      const ringColor = isFeatured ? '#FCA5A5' : 'rgba(255,255,255,0.9)';

      const html = `
        <div style="
          width:30px;height:30px;border-radius:50%;
          background:${color};
          border:2.5px solid ${ringColor};
          box-shadow: 0 2px 8px rgba(0,0,0,0.25)${isFeatured ? ', 0 0 0 4px rgba(220,38,38,0.18)' : ''};
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:700;font-size:13px;
          font-family:'Geist',system-ui,sans-serif;
        ">${isFeatured ? '★' : '✦'}</div>
      `;
      const icon = L.divIcon({
        html, className: 'omech-pin',
        iconSize: [30, 30], iconAnchor: [15, 15],
      });

      const marker = L.marker([m.lat, m.lng], { icon });
      const popupHtml = `
        <div style="font-family:'Geist',system-ui,sans-serif;min-width:200px;">
          ${isFeatured ? '<div style="display:inline-block;background:#DC2626;color:white;font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;margin-bottom:6px;letter-spacing:0.05em;">★ PRO</div>' : ''}
          <div style="font-family:'Fraunces',serif;font-size:15px;font-weight:600;color:#14110F;line-height:1.2;">${(m.name || '').replace(/[<>]/g,'')}</div>
          <div style="font-size:12px;color:#5C5650;margin-top:3px;">${cat.label} · ${m.neighborhood || 'Etimesgut'}</div>
          <div style="font-size:13px;color:#14110F;margin-top:6px;">★ ${(m.rating || 0).toFixed(1)} <span style="color:#8C857C;">(${m.review_count || 0})</span></div>
          <button id="omech-detail-${m.id}" style="margin-top:10px;width:100%;padding:8px 12px;background:#14110F;color:white;border:none;border-radius:10px;font-weight:600;font-size:12px;cursor:pointer;">Detayları Gör →</button>
        </div>
      `;
      marker.bindPopup(popupHtml);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`omech-detail-${m.id}`);
        if (btn) btn.onclick = () => onSelectMechanic && onSelectMechanic(m);
      });
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterGroupRef.current = cluster;
  }, [leafletReady, allMechanics, filter, onSelectMechanic]);

  const counts = React.useMemo(() => {
    const out = { all: allMechanics.length };
    for (const m of allMechanics) out[m.sector] = (out[m.sector] || 0) + 1;
    return out;
  }, [allMechanics]);

  return (
    <main className="max-w-6xl mx-auto px-5 pt-6 pb-32 lg:pb-12">
      <div className="flex items-center justify-between mb-5 fadeUp">
        <div>
          <h2 className="serif text-[28px] sm:text-[36px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>
            Etimesgut Haritası
          </h2>
          <p className="sans text-[13.5px] mt-1.5" style={{ color:'var(--ink-3)' }}>
            {loading ? 'Yükleniyor…' : `${allMechanics.length} usta haritada · pin'lere tıkla, detaya git`}
          </p>
        </div>
        <button onClick={onBack}
          className="sans text-[13px] font-medium px-4 py-2 rounded-full transition-all hover:scale-105"
          style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
          ← Listeye dön
        </button>
      </div>

      {/* Kategori filtresi */}
      <div className="mb-4 fadeUp" style={{ animationDelay:'80ms' }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-5 px-5 lg:mx-0 lg:px-0">
          <div className="flex gap-2 min-w-max lg:min-w-0 lg:flex-wrap">
            {CATEGORIES.map(({ id, label, icon: Icon }) => {
              const isActive = filter === id;
              const count = counts[id] || 0;
              return (
                <button key={id} onClick={() => setFilter(id)}
                  className="sans flex items-center gap-2 px-3.5 py-2 rounded-full text-[12.5px] font-medium transition-all whitespace-nowrap"
                  style={{
                    background: isActive ? 'var(--ink)' : 'var(--card)',
                    color: isActive ? 'white' : 'var(--ink)',
                    border: `1px solid ${isActive ? 'var(--ink)' : 'var(--line)'}`,
                  }}>
                  <Icon size={14} strokeWidth={2.2} />
                  {label}
                  {count > 0 && (
                    <span className="text-[10.5px] px-1.5 py-0.5 rounded-full"
                      style={{ background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-warm)', color: isActive ? 'white' : 'var(--ink-3)' }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Harita */}
      <div className="rounded-3xl overflow-hidden fadeUp"
        style={{ border:'1px solid var(--line)', boxShadow:'var(--shadow-md)', animationDelay:'120ms' }}>
        <div ref={mapRef} style={{ width: '100%', height: '600px', background: 'var(--bg-warm)' }} />
        {!leafletReady && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ pointerEvents:'none' }}>
            <div className="sans text-[13px]" style={{ color:'var(--ink-3)' }}>Harita yükleniyor…</div>
          </div>
        )}
      </div>

      {/* Bilgi notu */}
      <div className="mt-4 p-4 rounded-2xl flex items-start gap-3 fadeUp"
        style={{ background:'var(--bg-warm)', border:'1px solid var(--line-2)', animationDelay:'150ms' }}>
        <Sparkles size={16} color="var(--accent)" className="shrink-0 mt-0.5" />
        <div className="sans text-[12.5px] leading-relaxed" style={{ color:'var(--ink-2)' }}>
          <b style={{ color:'var(--ink)' }}>Yol tarifi için pin'e tıkla</b> → "Detayları Gör" → "Yol Tarifi" Google Maps'te ustanın konumunu açar.
        </div>
      </div>
    </main>
  );
}

const AdminMechanicRow = React.memo(function AdminMechanicRow({ mechanic: m, isEditing, onToggle, onSave, onDelete, callApi }) {
  return (
    <div
      className={`rounded-2xl p-4 cursor-pointer transition-colors ${isEditing ? 'ring-2' : ''}`}
      style={{
        background: 'var(--card)',
        border: m.featured ? '2px solid #DC2626' : '1px solid var(--line)',
        ...(isEditing ? { '--tw-ring-color': 'var(--accent)' } : {}),
      }}>
      <div className="flex items-start justify-between gap-3" onClick={onToggle}>
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
          style={{ transform: isEditing ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }} />
      </div>
      {isEditing && (
        <AdminEditForm mechanic={m} onSave={onSave} onDelete={onDelete} callApi={callApi} />
      )}
    </div>
  );
});

function AdminView({ onBack }) {
  const [password, setPassword] = useState(() => {
    try { return localStorage.getItem('admin-pwd') || ''; } catch { return ''; }
  });
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [autoChecking, setAutoChecking] = useState(() => {
    try { return !!localStorage.getItem('admin-pwd'); } catch { return false; }
  });

  const [mechanics, setMechanics] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [renderLimit, setRenderLimit] = useState(30);

  // Bu callApi her zaman EN GÜNCEL şifreyi kullanır (closure değil, parametre)
  const callApiWith = async (pwd, action, data = {}) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd, action, ...data }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Hata');
    return json;
  };
  const callApi = (action, data = {}) => callApiWith(password, action, data);

  // Mount'ta: localStorage'da şifre varsa otomatik doğrula
  useEffect(() => {
    let saved = '';
    try { saved = localStorage.getItem('admin-pwd') || ''; } catch {}
    if (!saved) { setAutoChecking(false); return; }
    callApiWith(saved, 'verify')
      .then(() => {
        setAuthed(true);
        loadListWith(saved, '');
      })
      .catch(() => {
        try { localStorage.removeItem('admin-pwd'); } catch {}
        setAuthError('Kayıtlı şifre geçersiz, tekrar giriş yap');
      })
      .finally(() => setAutoChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadListWith = async (pwd, q) => {
    setLoading(true);
    setRenderLimit(30);
    try {
      const { mechanics } = await callApiWith(pwd, 'list_mechanics', { search: q });
      setMechanics(mechanics);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tryLogin = async (e) => {
    e?.preventDefault?.();
    setAuthError('');
    setAuthLoading(true);
    try {
      await callApi('verify');
      try { localStorage.setItem('admin-pwd', password); } catch {}
      setAuthed(true);
      loadList();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    try { localStorage.removeItem('admin-pwd'); } catch {}
    setPassword('');
    setAuthed(false);
    setMechanics([]);
    setEditing(null);
    setCreating(false);
  };

  const loadList = async (q = '') => {
    setLoading(true);
    setRenderLimit(30);
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

  const onCreate = async (fields) => {
    setSaveMsg('Oluşturuluyor...');
    try {
      await callApi('create_mechanic', { fields });
      setSaveMsg('✓ Yeni usta eklendi');
      setTimeout(() => setSaveMsg(''), 2500);
      setCreating(false);
      loadList(search);
    } catch (err) {
      setSaveMsg('✗ ' + err.message);
    }
  };

  if (autoChecking) {
    return (
      <main className="max-w-md mx-auto px-5 pt-20 pb-32 lg:pb-12">
        <div className="rounded-3xl p-8 text-center fadeUp" style={{ background:'var(--card)', border:'1px solid var(--line)', boxShadow:'var(--shadow-md)' }}>
          <Shield size={28} color="var(--accent)" className="mx-auto mb-3" />
          <div className="serif text-[18px] font-semibold" style={{ color:'var(--ink)' }}>Oturum kontrol ediliyor…</div>
        </div>
      </main>
    );
  }

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
          <button onClick={() => { setCreating(true); setEditing(null); }}
            className="sans text-[13px] font-semibold px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{ background:'var(--accent)', color:'white' }}>
            + Yeni Usta
          </button>
          <button onClick={logout}
            className="sans text-[13px] font-medium px-4 py-2 rounded-full"
            style={{ background:'transparent', color:'#B91C1C', border:'1px solid #FECACA' }}
            title="Yönetici oturumunu kapat">
            Çıkış
          </button>
          <button onClick={onBack}
            className="sans text-[13px] font-medium px-4 py-2 rounded-full"
            style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
            ← Siteye dön
          </button>
        </div>
      </div>

      {creating && (
        <div className="rounded-2xl p-5 mb-5 fadeUp"
          style={{ background:'var(--accent-soft)', border:'1.5px solid var(--accent)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="serif text-[18px] font-semibold" style={{ color:'var(--ink)' }}>Yeni Usta Ekle</div>
            <button onClick={() => setCreating(false)}
              className="sans text-[12px]" style={{ color:'var(--ink-3)' }}>✕ İptal</button>
          </div>
          <AdminCreateForm onCreate={onCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

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
      {!loading && authError && (
        <div className="sans text-[13px] px-4 py-3 mb-4 rounded-xl"
          style={{ background:'#FEF2F2', color:'#991B1B', border:'1px solid #FECACA' }}>
          <b>Hata:</b> {authError}
        </div>
      )}

      <div className="space-y-2">
        {mechanics.slice(0, renderLimit).map((m) => (
          <AdminMechanicRow
            key={m.id}
            mechanic={m}
            isEditing={editing === m.id}
            onToggle={() => setEditing(editing === m.id ? null : m.id)}
            onSave={onSave}
            onDelete={onDelete}
            callApi={callApi}
          />
        ))}
      </div>

      {mechanics.length > renderLimit && (
        <button onClick={() => setRenderLimit(n => n + 30)}
          className="sans w-full mt-4 py-3 rounded-2xl text-[13px] font-medium transition-all hover:scale-[1.01]"
          style={{ background:'var(--card)', color:'var(--ink-2)', border:'1px solid var(--line)' }}>
          Daha fazla göster ({mechanics.length - renderLimit} kalan)
        </button>
      )}

      {!loading && mechanics.length === 0 && (
        <div className="text-center py-10 sans text-[13px]" style={{ color:'var(--ink-3)' }}>
          Sonuç yok. Aramayı temizle.
        </div>
      )}
    </main>
  );
}

function AdminCreateForm({ onCreate, onCancel }) {
  const [f, setF] = useState({
    name: '', sectors: ['mekanik'], neighborhood: '', phone: '',
    address: '', rating: 5.0, review_count: 0, opening_hours: '',
  });
  const update = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const canSubmit = f.name.trim().length >= 2 && f.sectors.length > 0;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <Field label="Dükkan Adı *" full><input value={f.name} onChange={(e) => update('name', e.target.value)} className="admin-input" placeholder="Örn: Soylu Otomotiv" /></Field>
      <Field label={`Kategoriler * (${f.sectors.length})`} full>
        <CategoryCheckboxes value={f.sectors} onChange={(v) => update('sectors', v)} />
      </Field>
      <Field label="Mahalle"><input value={f.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} className="admin-input" placeholder="Bahçekapı" /></Field>
      <Field label="Telefon"><input value={f.phone} onChange={(e) => update('phone', e.target.value)} className="admin-input" placeholder="0532 123 45 67" /></Field>
      <Field label="Puan"><input type="number" step="0.1" min="0" max="5" value={f.rating} onChange={(e) => update('rating', parseFloat(e.target.value) || 0)} className="admin-input" /></Field>
      <Field label="Yorum Sayısı"><input type="number" min="0" value={f.review_count} onChange={(e) => update('review_count', parseInt(e.target.value) || 0)} className="admin-input" /></Field>
      <Field label="Adres" full>
        <input value={f.address} onChange={(e) => update('address', e.target.value)} className="admin-input" placeholder="Tam adres" />
      </Field>
      <Field label="Çalışma Saatleri"><input value={f.opening_hours} onChange={(e) => update('opening_hours', e.target.value)} className="admin-input" placeholder="08:00-19:00" /></Field>
      <div className="sm:col-span-2 flex items-center justify-end gap-2 mt-2">
        <button onClick={onCancel}
          className="sans text-[13px] font-medium px-4 py-2 rounded-xl"
          style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>İptal</button>
        <button disabled={!canSubmit} onClick={() => canSubmit && onCreate(f)}
          className="sans text-[13px] font-semibold px-5 py-2 rounded-xl transition-all"
          style={{ background:'var(--ink)', color:'white', opacity: canSubmit ? 1 : 0.5 }}>
          Ustayı Oluştur
        </button>
      </div>
      <style>{`.admin-input { width:100%; padding:0.55rem 0.75rem; border-radius:0.6rem; background:white; border:1px solid var(--line); font-family:'Geist',sans-serif; font-size:13px; color:var(--ink); outline:none; }`}</style>
    </div>
  );
}

function AdminEditForm({ mechanic, onSave, onDelete, callApi }) {
  // sectors önce, fallback eski tek 'sector'
  const initSectors = (Array.isArray(mechanic.sectors) && mechanic.sectors.length > 0)
    ? mechanic.sectors
    : (mechanic.sector ? [mechanic.sector] : ['mekanik']);
  const [f, setF] = useState({
    name: mechanic.name ?? '',
    sectors: initSectors,
    neighborhood: mechanic.neighborhood ?? '',
    phone: mechanic.phone ?? '',
    address: mechanic.address ?? '',
    opening_hours: mechanic.opening_hours ?? '',
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
      <Field label={`Kategoriler (${f.sectors.length}) — birden fazla seçebilirsin`} full>
        <CategoryCheckboxes value={f.sectors} onChange={(v) => update('sectors', v)} />
      </Field>
      <Field label="Mahalle"><input value={f.neighborhood} onChange={(e) => update('neighborhood', e.target.value)} className="admin-input" /></Field>
      <Field label="Telefon"><input value={f.phone} onChange={(e) => update('phone', e.target.value)} className="admin-input" /></Field>
      <Field label="Çalışma Saatleri">
        <input value={f.opening_hours} onChange={(e) => update('opening_hours', e.target.value)}
          className="admin-input" placeholder="08:00-19:00" />
      </Field>
      <Field label="Adres">
        <input value={f.address} onChange={(e) => update('address', e.target.value)}
          className="admin-input" placeholder="Sokak, no, mahalle" />
      </Field>
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

      {callApi && <PriceManager mechanicId={mechanic.id} callApi={callApi} />}

      <style>{`.admin-input { width:100%; padding:0.55rem 0.75rem; border-radius:0.6rem; background:var(--bg-warm); border:1px solid var(--line); font-family:'Geist',sans-serif; font-size:13px; color:var(--ink); outline:none; }`}</style>
    </div>
  );
}

function PriceManager({ mechanicId, callApi }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newService, setNewService] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { prices } = await callApi('list_prices', { mechanic_id: mechanicId });
      setPrices(prices || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [mechanicId]);

  const addPrice = async () => {
    setError('');
    if (!newService.trim() || !newPrice) return;
    try {
      await callApi('add_price', { mechanic_id: mechanicId, service: newService, price_tl: newPrice });
      setNewService(''); setNewPrice('');
      load();
    } catch (e) { setError(e.message); }
  };

  const deletePrice = async (id) => {
    if (!confirm('Bu fiyat silinsin mi?')) return;
    try {
      await callApi('delete_price', { id });
      load();
    } catch (e) { setError(e.message); }
  };

  const movePrice = async (id, direction) => {
    setError('');
    try {
      await callApi('move_price', { id, direction });
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="sm:col-span-2 mt-4 pt-4" style={{ borderTop:'1px solid var(--line-2)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Shield size={14} color="var(--accent)" strokeWidth={2.4} />
        <span className="sans text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color:'var(--accent)' }}>
          Şeffaf Fiyat Listesi
        </span>
        <span className="sans text-[11px]" style={{ color:'var(--ink-3)' }}>
          ({prices.length} işçilik)
        </span>
      </div>

      {/* Mevcut fiyatlar */}
      {!loading && prices.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {prices.map((p, idx) => (
            <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background:'var(--accent-soft)', border:'1px solid rgba(194,65,12,0.15)' }}>
              {/* ▲▼ sıralama */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button onClick={() => movePrice(p.id, 'up')} disabled={idx === 0}
                  aria-label="Yukarı taşı"
                  className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                  style={{
                    background: idx === 0 ? 'transparent' : 'rgba(255,255,255,0.7)',
                    color: idx === 0 ? 'rgba(194,65,12,0.25)' : 'var(--accent)',
                    cursor: idx === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '12px', lineHeight: 1,
                  }}>▲</button>
                <button onClick={() => movePrice(p.id, 'down')} disabled={idx === prices.length - 1}
                  aria-label="Aşağı taşı"
                  className="w-5 h-5 flex items-center justify-center rounded-md transition-colors"
                  style={{
                    background: idx === prices.length - 1 ? 'transparent' : 'rgba(255,255,255,0.7)',
                    color: idx === prices.length - 1 ? 'rgba(194,65,12,0.25)' : 'var(--accent)',
                    cursor: idx === prices.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '12px', lineHeight: 1,
                  }}>▼</button>
              </div>
              <span className="flex-1 sans text-[13px] font-medium" style={{ color:'var(--ink)' }}>{p.service}</span>
              <span className="sans text-[13px] font-semibold whitespace-nowrap" style={{ color:'var(--accent)' }}>
                {p.price_tl.toLocaleString('tr-TR')} ₺
              </span>
              <button onClick={() => deletePrice(p.id)}
                className="sans text-[11px] px-2 py-1 rounded-lg"
                style={{ background:'transparent', color:'#B91C1C', border:'1px solid #FECACA' }}>Sil</button>
            </div>
          ))}
        </div>
      )}

      {!loading && prices.length === 0 && (
        <div className="sans text-[12.5px] mb-3 px-3 py-2.5 rounded-xl"
          style={{ background:'var(--bg-warm)', color:'var(--ink-3)' }}>
          Henüz işçilik eklenmedi. Aşağıdan ekle.
        </div>
      )}

      {/* Yeni fiyat ekleme */}
      <div className="flex gap-2">
        <input value={newService} onChange={(e) => setNewService(e.target.value)}
          placeholder="İşçilik (örn: Yağ değişimi)"
          className="admin-input flex-1" />
        <input type="number" min="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
          placeholder="Fiyat ₺" className="admin-input" style={{ width: '120px' }} />
        <button onClick={addPrice} disabled={!newService.trim() || !newPrice}
          className="sans text-[13px] font-semibold px-4 py-2 rounded-xl whitespace-nowrap"
          style={{ background:'var(--accent)', color:'white', opacity: (!newService.trim() || !newPrice) ? 0.5 : 1 }}>
          + Ekle
        </button>
      </div>

      {error && <div className="sans text-[12px] mt-2" style={{ color:'#B91C1C' }}>{error}</div>}
    </div>
  );
}

function CategoryCheckboxes({ value, onChange }) {
  const arr = Array.isArray(value) ? value : (value ? [value] : []);
  const toggle = (id) => {
    const next = arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
    onChange(next);
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.filter(c => c.id !== 'all').map(c => {
        const active = arr.includes(c.id);
        const Icon = c.icon;
        return (
          <button key={c.id} type="button" onClick={() => toggle(c.id)}
            className="sans flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 rounded-full transition-all"
            style={{
              background: active ? 'var(--accent)' : 'var(--bg-warm)',
              color: active ? 'white' : 'var(--ink-2)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
            }}>
            <Icon size={12} strokeWidth={2.4} />
            {c.label}
            {active && <span style={{ opacity:0.85 }}>✓</span>}
          </button>
        );
      })}
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

function Pagination({ current, total, totalItems, pageSize, onChange, onPageSizeChange }) {
  // Görünür sayfa numaralarını hesapla: 1 ... 4 5 [6] 7 8 ... 14
  const getVisiblePages = () => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', total);
    } else if (current >= total - 3) {
      pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', total);
    }
    return pages;
  };

  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, totalItems);

  return (
    <div className="mt-12 fadeUp">
      <div className="rounded-3xl p-6 sm:p-8 glass-soft"
        style={{
          backgroundImage:
            'radial-gradient(120% 100% at 0% 0%, rgba(255,210,168,0.20) 0%, transparent 60%), linear-gradient(180deg, rgba(255,253,248,0.85) 0%, rgba(255,255,255,0.92) 100%)',
          boxShadow: 'var(--shadow-soft)',
        }}>
        {/* Üst: durum + sayfa boyutu seçici */}
        <div className="flex items-center justify-between gap-4 flex-wrap mb-5">
          <div className="sans text-[13px]" style={{ color:'var(--ink-2)' }}>
            <span className="serif text-[18px] font-semibold" style={{ color:'var(--accent)' }}>{startItem}-{endItem}</span>
            <span className="mx-1.5" style={{ color:'var(--ink-3)' }}>/</span>
            <span className="font-semibold" style={{ color:'var(--ink)' }}>{totalItems}</span>
            <span className="ml-1.5" style={{ color:'var(--ink-3)' }}>usta</span>
            <span className="mx-2" style={{ color:'var(--line)' }}>·</span>
            <span style={{ color:'var(--ink-3)' }}>Sayfa <b style={{ color:'var(--ink-2)' }}>{current}/{total}</b></span>
          </div>

          {onPageSizeChange && (
            <label className="flex items-center gap-2 sans text-[12.5px]" style={{ color:'var(--ink-3)' }}>
              <span>Sayfa başı:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
                className="sans text-[13px] font-semibold pl-3 pr-2 py-1.5 rounded-full cursor-pointer outline-none"
                style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} usta</option>)}
              </select>
            </label>
          )}
        </div>

        {/* Alt: sayfa numaraları */}
        <nav className="flex items-center gap-1.5 flex-wrap justify-center" aria-label="Sayfalama">
          <button
            onClick={() => current > 1 && onChange(current - 1)}
            disabled={current === 1}
            className="sans w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              color: current === 1 ? 'var(--ink-3)' : 'var(--ink)',
              opacity: current === 1 ? 0.35 : 1,
              cursor: current === 1 ? 'not-allowed' : 'pointer',
            }}
            aria-label="Önceki sayfa">
            <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} />
          </button>

          {getVisiblePages().map((p, i) => (
            p === '...' ? (
              <span key={`dots-${i}`} className="sans w-10 h-10 flex items-center justify-center text-[13px]"
                style={{ color:'var(--ink-3)' }}>···</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className="sans min-w-[40px] h-10 px-3 rounded-xl transition-all hover:scale-105"
                style={{
                  background: p === current
                    ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)'
                    : 'var(--card)',
                  color: p === current ? 'white' : 'var(--ink)',
                  border: `1px solid ${p === current ? 'var(--accent)' : 'var(--line)'}`,
                  fontWeight: p === current ? 700 : 500,
                  fontSize: '13.5px',
                  boxShadow: p === current ? '0 6px 16px -4px rgba(194,65,12,0.4)' : 'none',
                }}
                aria-label={`Sayfa ${p}`}
                aria-current={p === current ? 'page' : undefined}>
                {p}
              </button>
            )
          ))}

          <button
            onClick={() => current < total && onChange(current + 1)}
            disabled={current === total}
            className="sans w-10 h-10 rounded-xl flex items-center justify-center transition-all"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--line)',
              color: current === total ? 'var(--ink-3)' : 'var(--ink)',
              opacity: current === total ? 0.35 : 1,
              cursor: current === total ? 'not-allowed' : 'pointer',
            }}
            aria-label="Sonraki sayfa">
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}

function JoinDialog({ type, open, onClose }) {
  if (!open) return null;
  const isCustomer = type === 'customer';

  const CUSTOMER_GROUP_URL = 'https://chat.whatsapp.com/Iewci71HtZtKTw9jreZnsw?mode=gi_t';
  const ownerWaMsg = encodeURIComponent(
    'Merhaba, ustayım. ototamircim online listesine sabit işçilik fiyatlarımı göndermek istiyorum.\n\n· Usta adı:\n· Adres / mahalle:\n· İşçilik 1:  ___ ₺\n· İşçilik 2:  ___ ₺\n· İşçilik 3:  ___ ₺'
  );

  const cfg = isCustomer ? {
    accent: '#166534',
    accentSoft: 'rgba(22,101,52,0.10)',
    accentBorder: 'rgba(22,101,52,0.18)',
    iconBg: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
    Icon: User,
    title: 'Müşteri WhatsApp Grubu',
    subtitle: 'Ücretsiz · sadece müşteriler',
    bullets: [
      'Etimesgut\'taki güncel işçilik fiyatları',
      'Diğer müşterilerin gerçek deneyimleri',
      'Ustaya gitmeden önce buradan sor',
      'Reklam ve usta yok — sadece konu',
    ],
    question: 'Müşteri grubuna katılmak ister misiniz?',
    waUrl: CUSTOMER_GROUP_URL,
    cta: 'Evet, katıl',
    ctaShade: '#166534',
  } : {
    accent: 'var(--accent)',
    accentSoft: 'rgba(194,65,12,0.10)',
    accentBorder: 'rgba(194,65,12,0.18)',
    iconBg: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
    Icon: Wrench,
    title: 'Listeye katılın',
    subtitle: 'Sabit işçilik fiyatlarınızı paylaşın',
    bullets: [
      'Profilinizi bizzat doğrularız',
      '24 saat içinde yayında',
      'Fiyatlar her zaman güncellenebilir',
      'Müşteri pazarlık için değil iş için gelir',
    ],
    question: 'Fiyat listenizi göndermek ister misiniz?',
    waUrl: `https://wa.me/${WHATSAPP_NUMBER}?text=${ownerWaMsg}`,
    cta: 'WhatsApp\'tan gönder',
    ctaShade: 'var(--accent)',
  };
  const { Icon } = cfg;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fadeIn p-4"
      style={{ background: 'rgba(20,17,15,0.55)' }}
      onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
        className="slideUp w-full sm:max-w-md rounded-3xl p-6 sm:p-7"
        style={{ background:'var(--card)', boxShadow:'var(--shadow-xl)', border:'1px solid var(--line-2)' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: cfg.iconBg }}>
              <Icon size={20} color="white" strokeWidth={2.4} />
            </div>
            <div>
              <div className="serif text-[20px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>
                {cfg.title}
              </div>
              <div className="sans text-[11.5px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                {cfg.subtitle}
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background:'var(--bg-warm)', color:'var(--ink)' }}>
            <X size={16} />
          </button>
        </div>

        <ul className="space-y-2.5 mt-2">
          {cfg.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 sans text-[13px]" style={{ color:'var(--ink-2)' }}>
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-[1px]"
                style={{ background: cfg.accentSoft, color: cfg.accent }}>
                <BadgeCheck size={12} strokeWidth={2.6} />
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 p-4 rounded-2xl text-center"
          style={{ background: cfg.accentSoft, border: `1px solid ${cfg.accentBorder}` }}>
          <div className="serif text-[16px] font-semibold" style={{ color:'var(--ink)' }}>
            {cfg.question}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
          <button onClick={onClose}
            className="sans text-[13.5px] font-medium py-3 rounded-2xl transition-colors"
            style={{ background:'var(--bg-warm)', color:'var(--ink-2)', border:'1px solid var(--line)' }}>
            Şimdi değil
          </button>
          <a href={cfg.waUrl} target="_blank" rel="noreferrer"
            onClick={() => setTimeout(onClose, 200)}
            className="sans flex items-center justify-center gap-2 py-3 rounded-2xl text-[13.5px] font-semibold transition-transform hover:scale-[1.02]"
            style={{
              background: '#25D366',
              color: 'white',
              boxShadow: '0 6px 16px -4px rgba(37,211,102,0.40)',
            }}>
            <MessageCircle size={16} fill="white" color="#25D366" /> {cfg.cta}
          </a>
        </div>

        <div className="mt-4 pt-3 text-[11.5px] sans text-center" style={{ color:'var(--ink-3)', borderTop:'1px dashed var(--line)' }}>
          {isCustomer ? 'Spam göndermiyoruz · İstediğin zaman ayrılabilirsin' : 'Bilgileriniz sadece doğrulama için kullanılır'}
        </div>
      </div>
    </div>
  );
}

function SuggestionCallout({ open: externalOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v) => {
    setInternalOpen(v);
    onOpenChange && onOpenChange(v);
  };
  const waMsg = encodeURIComponent(
    "Merhaba!\n\n[ ] Yaptırdığım işlemi ve fiyatını bildirmek istiyorum:\n  · Usta:\n  · İşlem:\n  · Fiyat: ___ ₺\n\n[ ] Listenize eklenmesini istediğim usta var:\n  · Usta adı:\n  · Adres:\n  · Telefon:"
  );
  const mailSubject = encodeURIComponent("Fiyat veya usta önerisi · OtoTamircimOnline");
  const mailBody = encodeURIComponent(
    "Merhaba,\n\n[ ] Yaptırdığım işlemi ve fiyatını bildirmek istiyorum:\n  · Usta:\n  · İşlem:\n  · Fiyat: ___ ₺\n\n[ ] Listenize eklenmesini istediğim usta var:\n  · Usta adı:\n  · Adres:\n  · Telefon:"
  );

  return (
    <>
      {/* Sol kenarda yan banner — masaüstünde dikey, mobilde alt-sol pill */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Fiyat veya usta öner"
        className="fixed z-40 transition-all hover:scale-105 group
                   lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:left-0
                   hidden lg:flex items-center gap-2 px-4 py-3 rounded-full lg:rounded-r-2xl lg:rounded-l-none lg:px-3 lg:py-5"
        style={{
          background: 'linear-gradient(135deg, var(--ink) 0%, #2A211A 100%)',
          color: 'white',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <Sparkles size={16} color="#FBBF77" />
        <span className="sans text-[12.5px] font-semibold lg:hidden">Fiyat / Usta Öner</span>
        <span className="hidden lg:flex flex-col items-center gap-2">
          <span className="sans text-[10.5px] font-bold uppercase tracking-[0.2em] lg:[writing-mode:vertical-rl]">
            Fiyat / Usta Öner
          </span>
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fadeIn p-4"
          style={{ background: 'rgba(20,17,15,0.55)' }}
          onClick={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="slideUp w-full sm:max-w-md rounded-3xl p-6 sm:p-7"
            style={{
              background: 'var(--card)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--line-2)',
            }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                  style={{ background:'linear-gradient(135deg, var(--accent) 0%, var(--gold) 100%)' }}>
                  <Sparkles size={20} color="white" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="serif text-[20px] font-semibold leading-tight" style={{ color:'var(--ink)' }}>
                    Topluluğa katkı yap
                  </div>
                  <div className="sans text-[11.5px] mt-0.5" style={{ color:'var(--ink-3)' }}>
                    Birlikte daha şeffaf
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background:'var(--bg-warm)', color:'var(--ink)' }}>
                <X size={16} />
              </button>
            </div>

            <p className="sans text-[13.5px] mt-4 leading-relaxed" style={{ color:'var(--ink-2)' }}>
              <b style={{ color:'var(--ink)' }}>Yaptırdığınız işlemleri ve fiyatlarını bize bildirin</b> —
              Şeffaf Fiyat listesine ekleyelim, başka sürücülere yol göstersin.
            </p>
            <p className="sans text-[13.5px] mt-3 leading-relaxed" style={{ color:'var(--ink-2)' }}>
              <b style={{ color:'var(--ink)' }}>İstediğiniz ustaları da</b> listemize ekleyebiliriz.
              Adı ve adresini gönderin, biz halledelim.
            </p>

            <div className="mt-5 space-y-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                target="_blank" rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl sans text-[13.5px] font-semibold transition-transform hover:scale-[1.02]"
                style={{ background: '#25D366', color: 'white', boxShadow: '0 6px 16px -4px rgba(37,211,102,0.4)' }}>
                <MessageCircle size={17} fill="white" color="#25D366" /> WhatsApp ile Bildir
              </a>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl sans text-[13.5px] font-semibold transition-transform hover:scale-[1.02]"
                style={{ background: 'var(--ink)', color: 'white' }}>
                <Mail size={17} /> E-posta ile Bildir
              </a>
            </div>

            <div className="mt-4 pt-4 text-[11.5px] sans text-center" style={{ color:'var(--ink-3)', borderTop:'1px dashed var(--line)' }}>
              Bilgileriniz sadece doğrulama için kullanılır · Spam göndermeyiz
            </div>
          </div>
        </div>
      )}
    </>
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
  // URL'den admin/harita/fiyatlar view'ı algıla
  const initialView = (() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/admin' || hash === '#admin') return 'admin';
    if (path === '/harita' || hash === '#harita') return 'map';
    if (path === '/fiyatlar' || hash === '#fiyatlar') return 'pricelist';
    return 'home';
  })();
  const [view, setView] = useState(initialView);
  const goToView = (v) => {
    setView(v);
    if (typeof window !== 'undefined') {
      const hashMap = { home:'', map:'#harita', pricelist:'#fiyatlar', admin:'#admin' };
      const newHash = hashMap[v] ?? '';
      window.history.replaceState(null, '', window.location.pathname + window.location.search + newHash);
      window.scrollTo({ top: 0 });
    }
  };
  const priceOnly = view === 'pricelist';

  const [activeCat, setActiveCat] = useState('all');
  const [activeNeighborhood, setActiveNeighborhood] = useState('all');
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [totalMechanics, setTotalMechanics] = useState(null);
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [navTab, setNavTab] = useState('home');
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(getInitialPageSize);
  const [userLocation, setUserLocation] = useState(null);
  const [sortMode, setSortMode] = useState('default'); // 'default' | 'distance'
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState('');
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('omech-favs') || '[]')); }
    catch { return new Set(); }
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [refetchKey, setRefetchKey] = useState(0);
  const [categoriesVersion, setCategoriesVersion] = useState(0);
  const [suggestionOpen, setSuggestionOpen] = useState(false);
  const [customerJoinOpen, setCustomerJoinOpen] = useState(false);
  const [ownerJoinOpen, setOwnerJoinOpen] = useState(false);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem('omech-favs', JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const toggleDistanceSort = () => {
    setLocError('');
    if (sortMode === 'distance') {
      setSortMode('default');
      return;
    }
    if (userLocation) {
      // Konum zaten var, tekrar istemeye gerek yok
      setSortMode('distance');
      return;
    }
    if (!navigator.geolocation) {
      setLocError('Tarayıcınız konum desteklemiyor');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSortMode('distance');
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocError(err.code === 1 ? 'Konum izni reddedildi' : 'Konum alınamadı');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    fetchAvailableNeighborhoods()
      .then((list) => setNeighborhoods(list))
      .catch((err) => setError(err.message));
    // Toplam usta sayısını çek (filtre fark etmez)
    supabase.from('mechanics').select('id', { count: 'exact', head: true })
      .then(({ count }) => { if (count != null) setTotalMechanics(count); });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMechanics({ category: activeCat, neighborhood: activeNeighborhood, query: submittedQuery })
      .then((list) => {
        if (cancelled) return;
        // Eğer kullanıcı konumu varsa, her ustaya mesafeyi ekle
        const withDistance = userLocation
          ? list.map(m => ({ ...m, distanceKm: haversineKm(userLocation, { lat: m.lat, lng: m.lng }) }))
          : list;
        const sorted = [...withDistance].sort((a, b) => {
          // 1) Featured (PRO) her zaman en üstte
          const af = a.featured ? 1 : 0, bf = b.featured ? 1 : 0;
          if (bf !== af) return bf - af;
          // 2) Mesafe modu: yakın olanlar üstte
          if (sortMode === 'distance' && userLocation) {
            const da = a.distanceKm, db = b.distanceKm;
            if (da != null && db != null) return da - db;
            if (da != null) return -1;
            if (db != null) return 1;
          }
          // 3) Varsayılan: fiyatı olanlar
          const ap = a.transparentPrices.length > 0 ? 1 : 0;
          const bp = b.transparentPrices.length > 0 ? 1 : 0;
          if (bp !== ap) return bp - ap;
          // 4) Puana göre
          const ar = a.rating ?? 0, br = b.rating ?? 0;
          if (br !== ar) return br - ar;
          // 5) Yorum sayısı
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
  }, [activeCat, activeNeighborhood, submittedQuery, userLocation, sortMode, refetchKey]);

  // Tab tekrar görünür olduğunda otomatik refetch (admin'de yapılan değişiklik anında yansısın)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        setRefetchKey(k => k + 1);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, []);

  // Mount'ta kategorileri DB'den çek (yoksa default kalır)
  useEffect(() => {
    fetchCategoriesPublic().then(rows => {
      if (!rows || rows.length === 0) return; // migration_003 yok ya da boş tablo → default kullan
      // 'all' her zaman ilk eleman olarak kalır
      const all = DEFAULT_CATEGORIES.find(c => c.id === 'all');
      const newCats = [all, ...rows.map(dbRowToCategory)];
      CATEGORIES = newCats;
      setCategoriesVersion(v => v + 1);
      setRefetchKey(k => k + 1); // mechanics'ı yeni kategorilere göre re-map et
    });
  }, []);

  // Filtre veya sayfa boyutu değiştiğinde sayfayı sıfırla
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCat, activeNeighborhood, submittedQuery, pageSize, priceOnly]);

  const handleWriteReview = (mechanic) => {
    // place_id varsa direkt Google "yorum yaz" formuna git
    window.open(googleWriteReviewUrl(mechanic), '_blank', 'noopener,noreferrer');
  };

  const submitSearch = (e) => {
    e?.preventDefault?.();
    setSubmittedQuery(query);
  };

  return (
    <div className="min-h-screen sans" style={{ background:'transparent' }}>
      <style>{FONT_INJECT}</style>

      <header className="sticky top-0 z-20 glass"
        style={{ borderBottom:'1px solid rgba(236,227,210,0.5)', boxShadow:'0 1px 12px rgba(120,60,20,0.06)' }}>
        <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <button onClick={() => goToView('home')} className="cursor-pointer transition-transform hover:scale-[1.02]">
            <Logo />
          </button>
          <nav className="hidden lg:flex items-center gap-1 sans text-[13.5px]">
            {[
              { id: 'home', label: 'Keşfet' },
              { id: 'pricelist', label: 'Fiyatı Belli', accent: '#10B981' },
              { id: 'map',  label: 'Harita' },
            ].map(item => (
              <button key={item.id} onClick={() => goToView(item.id)}
                className="px-4 py-2 rounded-full transition-all flex items-center gap-1.5"
                style={{
                  background: view === item.id
                    ? (item.accent
                        ? `linear-gradient(135deg, ${item.accent} 0%, #059669 100%)`
                        : 'var(--ink)')
                    : 'transparent',
                  color: view === item.id ? 'white' : 'var(--ink-2)',
                  fontWeight: view === item.id ? 600 : 500,
                  boxShadow: view === item.id && item.accent
                    ? '0 4px 12px -2px rgba(16,185,129,0.35)' : 'none',
                }}>
                {item.accent && <span className="font-bold" style={{ color: view === item.id ? 'white' : item.accent }}>₺</span>}
                {item.label}
              </button>
            ))}
            <button onClick={() => setOwnerJoinOpen(true)}
              className="px-4 py-2 hover:text-[var(--ink)] transition" style={{ color:'var(--ink-2)' }}>
              Usta misin?
            </button>
          </nav>
          <button onClick={() => goToView('admin')}
            className="sans text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all hover:scale-105"
            style={{
              background: view === 'admin' ? 'var(--accent)' : 'var(--ink)',
              color: 'white',
              boxShadow: 'var(--shadow-sm)',
            }}>
            {view === 'admin' ? '✓ Yönetici' : 'Giriş Yap'}
          </button>
        </div>
      </header>

      {view === 'map' && <MapView onBack={() => goToView('home')} onSelectMechanic={(rawRow) => setSelected(mapRow(rawRow))} />}
      {view === 'admin' && <AdminView onBack={() => goToView('home')} />}

      {(view === 'home' || view === 'pricelist') && (
      <main className="max-w-6xl mx-auto px-5 pt-10 sm:pt-14 pb-32 lg:pb-12">
        <section className="fadeUp relative flex flex-col items-center text-center">
          {/* Soft gradient aurora blob'ları (priceOnly modunda yeşilimsi) */}
          <div className="aurora-blob"
            style={{ width:380, height:380, top:-60, left:'-8%',
              background: priceOnly
                ? 'radial-gradient(circle at 30% 30%, #A7F3D0 0%, #ECFDF5 60%, transparent 75%)'
                : 'radial-gradient(circle at 30% 30%, #FFC2A0 0%, #FFE6D0 60%, transparent 75%)',
              animationDelay:'0s' }} />
          <div className="aurora-blob"
            style={{ width:340, height:340, top:-30, right:'-6%',
              background: priceOnly
                ? 'radial-gradient(circle at 60% 40%, #BBF7D0 0%, #D1FAE5 55%, transparent 75%)'
                : 'radial-gradient(circle at 60% 40%, #F7D2C8 0%, #FFD2A8 55%, transparent 75%)',
              animationDelay:'-5s' }} />
          <div className="aurora-blob hidden sm:block"
            style={{ width:260, height:260, bottom:-40, left:'30%',
              background:'radial-gradient(circle at 50% 50%, #FFE6D0 0%, transparent 70%)',
              animationDelay:'-10s', opacity:0.5 }} />

          <div className="relative z-10 flex flex-col items-center text-center w-full">
          {priceOnly ? (
            <div className="flex items-center gap-2.5 sans text-[11px] uppercase tracking-[0.2em] mb-5 px-3 py-1.5 rounded-full inline-flex"
              style={{ color:'#059669', background:'#ECFDF5', border:'1px solid rgba(16,185,129,0.25)' }}>
              <span className="font-bold">₺</span>
              <span className="font-semibold">Şeffaf Fiyat Listesi · Pazarlıksız</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 sans text-[11px] uppercase tracking-[0.2em] mb-5 px-3 py-1.5 rounded-full inline-flex glass-soft"
              style={{ color:'var(--accent)' }}>
              <span className="relative inline-block w-1.5 h-1.5 rounded-full pulseRing"
                style={{ background:'var(--accent)' }} />
              <span className="font-semibold">Etimesgut · {totalMechanics ?? '...'} Doğrulanmış Usta</span>
            </div>
          )}
          <h1 className="serif text-[44px] sm:text-[68px] lg:text-[80px] leading-[1.05] font-semibold max-w-4xl"
            style={{ color:'var(--ink)' }}>
            {priceOnly ? (
              <>
                Fiyatı belli olan
                <span className="block mt-2" style={{
                  backgroundImage: 'linear-gradient(120deg, #059669 0%, #10B981 50%, #34D399 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>ustalar.</span>
              </>
            ) : (
              <>
                Güvenilir oto ustası,
                <span className="block mt-2" style={{
                  backgroundImage: 'linear-gradient(120deg, #C2410C 0%, #EA580C 35%, #F59E0B 65%, #DB2777 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                }}>şeffaf fiyatla.</span>
              </>
            )}
          </h1>
          <p className="sans text-[16px] sm:text-[18px] mt-6 max-w-2xl leading-relaxed" style={{ color:'var(--ink-2)' }}>
            {priceOnly
              ? 'İşçilik fiyatlarını önceden açıklayan, şeffaflığa açık ustalar. Pazarlık yok, sürpriz yok — gittiğinde ne ödeyeceğini biliyorsun.'
              : 'Etimesgut sanayisinin en iyi puanlı oto ustalarını tek bakışta gör. Topluluktan gelen şeffaf fiyatlarla ücret pazarlığı yapmadan, doğru ustayı bul.'}
          </p>

          <form onSubmit={submitSearch} className="mt-8 flex items-center gap-2 rounded-2xl p-2 w-full max-w-2xl glass-soft"
            style={{ boxShadow:'var(--shadow-soft)' }}>
            <div className="pl-4 flex items-center"><Search size={19} color="var(--ink-3)" strokeWidth={2.2} /></div>
            <input
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              placeholder="Mahalle, marka veya hizmet ara…"
              className="flex-1 bg-transparent outline-none sans text-[15px] py-3 text-left"
              style={{ color:'var(--ink)' }}
            />
            <button type="submit" className="sans text-[13.5px] font-semibold px-6 py-3 rounded-xl transition-transform hover:scale-105 btn-gradient-accent"
              style={{ color:'white' }}>
              Ara
            </button>
          </form>
          </div>

        </section>

        <section className="mt-12 fadeUp" style={{ animationDelay:'140ms' }}>
          <div className="sans text-[10.5px] uppercase tracking-[0.16em] font-semibold mb-3" style={{ color:'var(--ink-3)' }}>
            Kategori
          </div>
          <CategoryPills active={activeCat} onChange={setActiveCat} />
        </section>


        <div className="mt-9 flex items-center justify-between gap-3 flex-wrap fadeUp" style={{ animationDelay:'200ms' }}>
          <h2 className="serif text-[24px] sm:text-[28px] font-semibold" style={{ color:'var(--ink)' }}>
            {loading
              ? 'Aranıyor…'
              : priceOnly
                ? `${mechanics.filter(m => m.transparentPrices.length > 0).length} şeffaf fiyatlı usta`
                : `${mechanics.length} usta bulundu`}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => goToView(priceOnly ? 'home' : 'pricelist')}
              className="sans flex items-center gap-2 text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all hover:scale-[1.03]"
              style={{
                background: priceOnly ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'var(--card)',
                color: priceOnly ? 'white' : 'var(--ink)',
                border: `1px solid ${priceOnly ? '#059669' : 'var(--line)'}`,
                boxShadow: priceOnly ? '0 4px 12px -2px rgba(16,185,129,0.35)' : 'none',
              }}>
              <span className="font-bold">₺</span>
              {priceOnly ? 'Fiyatı Belli · Aktif' : 'Fiyatı Belli'}
            </button>
            <button
              onClick={() => setShowOnlyFavorites(v => !v)}
              className="sans flex items-center gap-2 text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all hover:scale-[1.03]"
              style={{
                background: showOnlyFavorites ? '#DC2626' : 'var(--card)',
                color: showOnlyFavorites ? 'white' : 'var(--ink)',
                border: `1px solid ${showOnlyFavorites ? '#DC2626' : 'var(--line)'}`,
                boxShadow: showOnlyFavorites ? '0 4px 12px -2px rgba(220,38,38,0.3)' : 'none',
              }}>
              <Heart size={13} strokeWidth={2.4} fill={showOnlyFavorites ? 'white' : 'none'} />
              Kayıtlılar{favorites.size > 0 && ` (${favorites.size})`}
            </button>
            <button
              onClick={toggleDistanceSort}
              disabled={locating}
              className="sans flex items-center gap-2 text-[12.5px] font-semibold px-4 py-2 rounded-full transition-all hover:scale-[1.03]"
              style={{
                background: sortMode === 'distance' ? 'var(--accent)' : 'var(--card)',
                color: sortMode === 'distance' ? 'white' : 'var(--ink)',
                border: `1px solid ${sortMode === 'distance' ? 'var(--accent)' : 'var(--line)'}`,
                opacity: locating ? 0.6 : 1,
                boxShadow: sortMode === 'distance' ? '0 4px 12px -2px rgba(194,65,12,0.3)' : 'none',
              }}>
              <Navigation size={13} strokeWidth={2.4} />
              {locating ? 'Konum alınıyor…' : sortMode === 'distance' ? 'Yakına göre · Aktif' : 'Yakına göre sırala'}
            </button>
          </div>
        </div>
        {locError && (
          <div className="mt-2 sans text-[12.5px] px-3 py-2 rounded-xl"
            style={{ background:'#FEF2F2', color:'#991B1B', border:'1px solid #FECACA' }}>
            {locError}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-2xl p-4 sans text-[13px]" style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#991B1B' }}>
            <b>API hatası:</b> {error}
          </div>
        )}

        {(() => {
          let visible = mechanics;
          if (priceOnly) visible = visible.filter(m => m.transparentPrices.length > 0);
          if (showOnlyFavorites) visible = visible.filter(m => favorites.has(m.id));
          return (
            <>
              <section className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} delay={i * 60} />)
                  : visible.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((m, i) => (
                      <MechanicCard key={m.id} m={m} onOpen={setSelected} delay={Math.min(i, 12) * 50}
                        isFavorite={favorites.has(m.id)}
                        onToggleFavorite={() => toggleFavorite(m.id)} />
                    ))
                }
              </section>

              {!loading && showOnlyFavorites && visible.length === 0 && (
                <div className="mt-10 rounded-3xl p-10 text-center"
                  style={{ background:'var(--card)', border:'1px dashed var(--line)' }}>
                  <Heart size={32} color="var(--accent)" className="mx-auto mb-3" />
                  <div className="serif text-[20px] font-semibold" style={{ color:'var(--ink)' }}>Henüz kayıtlı usta yok</div>
                  <p className="sans text-[13px] mt-2" style={{ color:'var(--ink-3)' }}>
                    Bir usta kartının sağ üstündeki kalp ikonuna tıklayarak kaydet, sonra burada gör.
                  </p>
                  <button onClick={() => setShowOnlyFavorites(false)}
                    className="sans mt-4 text-[13px] font-semibold px-5 py-2.5 rounded-full"
                    style={{ background:'var(--ink)', color:'white' }}>
                    Tüm ustalara dön
                  </button>
                </div>
              )}

              {!loading && visible.length > 0 && (
                <Pagination
                  current={currentPage}
                  total={Math.max(1, Math.ceil(visible.length / pageSize))}
                  totalItems={visible.length}
                  pageSize={pageSize}
                  onChange={(p) => {
                    setCurrentPage(p);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onPageSizeChange={setPageSize}
                />
              )}
            </>
          );
        })()}

        {!loading && mechanics.length === 0 && !error && (
          <div className="mt-10 rounded-3xl p-10 text-center"
            style={{ background:'var(--card)', border:'1px dashed var(--line)' }}>
            <div className="serif text-[20px] font-semibold" style={{ color:'var(--ink)' }}>Sonuç yok</div>
            <p className="sans text-[13px] mt-1" style={{ color:'var(--ink-3)' }}>
              Filtreyi temizleyip tekrar dene.
            </p>
          </div>
        )}

        {/* HAKKIMIZDA — Eyecatcher + Hikaye + 2 CTA */}
        <section id="hakkimizda" className="mt-16 fadeUp" style={{ animationDelay:'250ms' }}>
          {/* Eyecatcher başlık */}
          <div className="text-center max-w-3xl mx-auto mb-10 px-2">
            <div className="sans text-[11px] uppercase tracking-[0.22em] mb-4 inline-block px-3 py-1.5 rounded-full"
              style={{ color:'var(--accent)', background:'var(--accent-soft)', border:'1px solid rgba(194,65,12,0.15)' }}>
              Bu Siteyi Neden Kurduk
            </div>
            <h2 className="serif text-[30px] sm:text-[42px] lg:text-[48px] font-semibold leading-[1.1]" style={{ color:'var(--ink)' }}>
              "Motoru açmadan fiyat verilmez —
              <span className="block mt-1" style={{ color:'var(--ink)' }}>buna katılıyoruz."</span>
            </h2>
            <div className="serif text-[22px] sm:text-[30px] mt-5 font-semibold" style={{
              backgroundImage: 'linear-gradient(120deg, #C2410C 0%, #EA580C 35%, #F59E0B 65%, #DB2777 100%)',
              WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            }}>
              Ama işçilik fiyatları, baştan belli olmalı.
            </div>
          </div>

          {/* Hikaye kartı — koyu, yumuşatılmış */}
          <div className="rounded-3xl overflow-hidden relative" style={{
            background: 'linear-gradient(135deg, #1F1A14 0%, #2A211A 55%, #3F2A1E 100%)',
            color:'white',
            boxShadow:'0 24px 60px -20px rgba(60,30,15,0.45)',
          }}>
            {/* dekoratif gradient blob */}
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-30 pointer-events-none"
              style={{ background:'radial-gradient(circle, #FBBF77 0%, transparent 65%)', filter:'blur(40px)' }} />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-20 pointer-events-none"
              style={{ background:'radial-gradient(circle, #EA580C 0%, transparent 70%)', filter:'blur(50px)' }} />

            <div className="p-7 sm:p-10 relative">
              <div className="grid sm:grid-cols-3 gap-7">
                <div className="sm:col-span-2">
                  <div className="sans text-[11px] uppercase tracking-[0.18em] opacity-70">Hikaye</div>
                  <div className="serif text-[24px] sm:text-[30px] mt-2 font-semibold leading-tight">
                    Aynı arabaya <span className="italic" style={{ color:'#FBBF77' }}>10 bin TL fark.</span>
                  </div>
                  <p className="sans text-[14px] mt-4 opacity-85 max-w-xl leading-relaxed">
                    Bir gün arabamı çekiciyle bir ustaya götürdüm. <b>"80 bin TL"</b> dediler.
                    İnanmadım, başka bir sanayiye götürdüm — orada <b>"70 bin TL"</b> dediler.
                    Aynı iş, aynı parça. 10 bin TL fark.
                  </p>
                  <p className="sans text-[14px] mt-3 opacity-85 max-w-xl leading-relaxed">
                    Sonunda arabayı yaptırmadan sattım. <b style={{ color:'#FBBF77' }}>İşte bu yüzden buradayız:</b>
                    Sabit işçilikleri (balata, yağ, akü, klima gazı, eksoz, ekspertiz, lastik dengeleme)
                    önceden bilinebilir bir şekilde topluyoruz. Motor arızası gibi <i>"açmadan bilinmez"</i>
                    işler için değil — <b>tahmin edilebilir, tekrar eden işler</b> için.
                  </p>
                  <p className="sans text-[14px] mt-3 opacity-90 max-w-xl leading-relaxed">
                    Çünkü güven, sürpriz olmamasıdır.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-1">
                  {[
                    { k: totalMechanics ?? '...', v:'Doğrulanmış usta' },
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
          </div>

          {/* İki CTA kartı: Usta + Müşteri */}
          <div className="grid sm:grid-cols-2 gap-4 mt-5">

            {/* Usta için */}
            <div className="rounded-3xl p-7 relative overflow-hidden gradient-card transition-all hover:-translate-y-1"
              style={{ border:'1px solid rgba(194,65,12,0.18)', boxShadow:'var(--shadow-soft)' }}>
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-50 pointer-events-none"
                style={{ background:'radial-gradient(circle, rgba(255,210,168,0.55) 0%, transparent 70%)', filter:'blur(20px)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background:'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                           boxShadow:'0 8px 18px -4px rgba(194,65,12,0.40)' }}>
                  <Wrench size={20} color="white" strokeWidth={2.4} />
                </div>
                <div className="serif text-[22px] sm:text-[24px] font-semibold leading-tight mb-2" style={{ color:'var(--ink)' }}>
                  Ustaysanız, fiyatınızı <span style={{ color:'var(--accent)' }}>siz yazın.</span>
                </div>
                <p className="sans text-[13.5px] leading-relaxed mb-4" style={{ color:'var(--ink-2)' }}>
                  Sabit işçilik fiyatlarınız profilinizde göründüğünde,
                  müşteri <b>pazarlık için değil iş için</b> gelir. WhatsApp'tan listenizi gönderin, biz ekleyelim.
                </p>
                <div className="sans text-[11.5px] mb-5 flex flex-wrap gap-x-2.5 gap-y-1" style={{ color:'var(--ink-3)' }}>
                  <span>· Ücretsiz</span><span>· 2 dakika</span><span>· 24 saatte yayında</span>
                </div>
                <button onClick={() => setOwnerJoinOpen(true)}
                  className="sans w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13.5px] font-semibold transition-transform hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%)',
                    color:'white',
                    boxShadow:'0 8px 20px -4px rgba(194,65,12,0.42)',
                  }}>
                  <MessageCircle size={16} fill="white" color="var(--accent)" /> WhatsApp'tan fiyat gönder
                </button>
              </div>
            </div>

            {/* Müşteri için — yeşil/mint accent */}
            <div className="rounded-3xl p-7 relative overflow-hidden transition-all hover:-translate-y-1"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(236,253,245,0.94) 100%), radial-gradient(120% 100% at 100% 0%, rgba(22,101,52,0.10) 0%, transparent 60%)',
                border:'1px solid rgba(22,101,52,0.20)',
                boxShadow:'0 8px 24px -8px rgba(22,101,52,0.18), 0 2px 6px rgba(60,30,15,0.04)',
              }}>
              <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full opacity-50 pointer-events-none"
                style={{ background:'radial-gradient(circle, rgba(187,247,208,0.65) 0%, transparent 70%)', filter:'blur(20px)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                  style={{ background:'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                           boxShadow:'0 8px 18px -4px rgba(22,101,52,0.40)' }}>
                  <User size={20} color="white" strokeWidth={2.4} />
                </div>
                <div className="serif text-[22px] sm:text-[24px] font-semibold leading-tight mb-2" style={{ color:'var(--ink)' }}>
                  Müşteriyseniz, <span style={{ color:'#166534' }}>yalnız değilsiniz.</span>
                </div>
                <p className="sans text-[13.5px] leading-relaxed mb-4" style={{ color:'var(--ink-2)' }}>
                  Aynı iş için "ne ödedin?" sormak hakkın. Etimesgut <b>müşteri WhatsApp grubunda</b>
                  gerçek fiyatları, deneyimleri ve usta tavsiyelerini paylaşıyoruz.
                </p>
                <div className="sans text-[11.5px] mb-5 flex flex-wrap gap-x-2.5 gap-y-1" style={{ color:'var(--ink-3)' }}>
                  <span>· Reklam yok</span><span>· Ustalar yok</span><span>· Sadece müşteriler</span>
                </div>
                <button onClick={() => setCustomerJoinOpen(true)}
                  className="sans w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13.5px] font-semibold transition-transform hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                    color:'white',
                    boxShadow:'0 8px 20px -4px rgba(22,101,52,0.42)',
                  }}>
                  <MessageCircle size={16} fill="white" color="#166534" /> Müşteri grubuna katıl
                </button>
              </div>
            </div>

          </div>
        </section>

        <footer className="mt-16 sans text-[13px]" style={{ color:'var(--ink-3)' }}>
          <div className="rounded-3xl p-8 sm:p-10"
            style={{
              background: 'linear-gradient(135deg, var(--bg-warm) 0%, var(--card) 60%, var(--accent-soft) 100%)',
              border: '1px solid var(--line-2)',
            }}>
            <div className="grid sm:grid-cols-3 gap-8 mb-8">
              <div>
                <Logo size={20} />
                <p className="text-[12.5px] leading-relaxed mt-3 max-w-xs">
                  Etimesgut sanayisinin en iyi puanlı oto ustalarını, şeffaf fiyatlarla tek listede topluyoruz.
                </p>
              </div>
              <div>
                <div className="sans text-[10.5px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color:'var(--accent)' }}>İletişim</div>
                <a href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-2 mb-2 transition-colors hover:text-[var(--ink)]">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'var(--card)', border:'1px solid var(--line-2)' }}>
                    <Mail size={13} color="var(--accent)" />
                  </span>
                  {CONTACT_EMAIL}
                </a>
                <a href={`https://instagram.com/${INSTAGRAM_USER}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 mb-2 transition-colors hover:text-[var(--ink)]">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'var(--card)', border:'1px solid var(--line-2)' }}>
                    <Instagram size={13} color="var(--accent)" />
                  </span>
                  @{INSTAGRAM_USER}
                </a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 transition-colors hover:text-[var(--ink)]">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background:'var(--card)', border:'1px solid var(--line-2)' }}>
                    <MessageCircle size={13} color="#25D366" />
                  </span>
                  WhatsApp
                </a>
              </div>
              <div>
                <div className="sans text-[10.5px] uppercase tracking-[0.18em] font-semibold mb-3" style={{ color:'var(--accent)' }}>Bağlantılar</div>
                <a href="#hakkimizda" className="block mb-2 transition-colors hover:text-[var(--ink)]">Hakkımızda</a>
                <button onClick={() => setOwnerJoinOpen(true)} className="block mb-2 transition-colors hover:text-[var(--ink)] text-left">Usta misin? Kayıt ol</button>
                <button onClick={() => setCustomerJoinOpen(true)} className="block mb-2 transition-colors hover:text-[var(--ink)] text-left">Müşteri grubuna katıl</button>
                <a href="#" className="block mb-2 transition-colors hover:text-[var(--ink)]">Gizlilik · Şartlar</a>
                <a href="#admin" className="block transition-colors hover:text-[var(--ink)]">Yönetici girişi</a>
              </div>
            </div>
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px]"
              style={{ borderTop:'1px dashed var(--line)' }}>
              <div>© 2026 ototamircimonline · Ankara</div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full pulseRing relative" style={{ background:'var(--accent)' }} />
                <span>Etimesgut · <b style={{ color:'var(--ink-2)' }}>{totalMechanics ?? '...'}</b> doğrulanmış usta</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
      )}

      <DetailSheet mechanic={selected} onClose={()=>setSelected(null)} onWriteReview={handleWriteReview} />
      <BottomNav active={navTab} savedCount={favorites.size} onChange={(tab) => {
        setNavTab(tab);
        if (tab === 'home') { goToView('home'); setShowOnlyFavorites(false); }
        if (tab === 'map') goToView('map');
        if (tab === 'saved') { goToView('home'); setShowOnlyFavorites(true); }
        if (tab === 'bildir') { setSuggestionOpen(true); }
      }} />
      <FloatingActions />
      {view === 'home' && <SuggestionCallout open={suggestionOpen} onOpenChange={setSuggestionOpen} />}
      <JoinDialog type="customer" open={customerJoinOpen} onClose={() => setCustomerJoinOpen(false)} />
      <JoinDialog type="owner"    open={ownerJoinOpen}    onClose={() => setOwnerJoinOpen(false)} />
    </div>
  );
}
