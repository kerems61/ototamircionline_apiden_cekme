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

function getInitials(name) {
  if (!name) return '??';
  const words = name.trim().split(/\s+/).filter(w => /[A-Za-zÀ-ÿĞğÜüŞşİıÖöÇç]/.test(w));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

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

function MechanicPhoto({ tones, verified, name, categoryIcon: CatIcon, categoryLabel }) {
  const initials = getInitials(name);
  return (
    <div
      className="relative w-full h-44 sm:h-48 rounded-2xl overflow-hidden flex items-center justify-center"
      style={{
        background: `radial-gradient(120% 80% at 20% 10%, ${tones[1]} 0%, ${tones[0]} 70%)`,
      }}
    >
      <div className="absolute inset-0 opacity-40"
        style={{ background:
          'repeating-linear-gradient(115deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px)' }} />

      {CatIcon && (
        <div className="absolute -right-4 -bottom-4 opacity-15">
          <CatIcon size={140} color="white" strokeWidth={1.5} />
        </div>
      )}

      <div className="serif font-semibold relative" style={{
        color: 'rgba(255,255,255,0.95)',
        fontSize: 'clamp(48px, 8vw, 64px)',
        letterSpacing: '-0.04em',
        textShadow: '0 2px 12px rgba(0,0,0,0.3)',
      }}>
        {initials}
      </div>

      {categoryLabel && (
        <div className="absolute bottom-3 left-3 sans text-[10.5px] font-medium px-2.5 py-1 rounded-full backdrop-blur-md"
          style={{ background:'rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.95)', border:'1px solid rgba(255,255,255,0.2)' }}>
          {categoryLabel}
        </div>
      )}

      <div className="absolute top-3 left-3 flex gap-1.5">
        {verified && (
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
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mechanic.name + ' ' + (mechanic.address ?? ''))}`}
              target="_blank" rel="noreferrer"
              className="sans flex items-center justify-center gap-2 py-3.5 rounded-2xl text-[13px] font-semibold"
              style={{ background:'var(--card)', color:'var(--ink)', border:'1px solid var(--line)' }}>
              <Navigation size={15} /> Yol Tarifi
            </a>
          </div>

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mechanic.name + ' ' + (mechanic.address ?? ''))}`}
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
          const ap = a.transparentPrices.length > 0 ? 1 : 0;
          const bp = b.transparentPrices.length > 0 ? 1 : 0;
          if (bp !== ap) return bp - ap;
          const ar = a.rating ?? 0, br = b.rating ?? 0;
          if (br !== ar) return br - ar;
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

  const handleWriteReview = (mechanic) => {
    // place_id olmadığı için, isim+adres ile Google Maps araması açıyoruz;
    // kullanıcı oradan "Yorum yaz" diyebilir.
    const q = encodeURIComponent(`${mechanic.name} ${mechanic.address ?? ''}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank', 'noopener,noreferrer');
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
          <Logo />
          <div className="hidden lg:flex items-center gap-7 sans text-[13.5px]" style={{ color:'var(--ink-2)' }}>
            <a className="hover:text-[var(--ink)] transition" href="#">Keşfet</a>
            <a className="hover:text-[var(--ink)] transition" href="#">Şeffaflık</a>
            <a className="hover:text-[var(--ink)] transition" href="#">Usta misin?</a>
          </div>
          <button className="sans text-[13px] font-medium px-4 py-2 rounded-full"
            style={{ background:'var(--ink)', color:'white' }}>
            Giriş Yap
          </button>
        </div>
      </header>

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
            : mechanics.map((m, i) => (
                <MechanicCard key={m.id} m={m} onOpen={setSelected} delay={i * 70} />
              ))
          }
        </section>

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
                  { k:'442', v:'Doğrulanmış usta' },
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
            <div>Etimesgut · 442 doğrulanmış usta</div>
          </div>
        </footer>
      </main>

      <DetailSheet mechanic={selected} onClose={()=>setSelected(null)} onWriteReview={handleWriteReview} />
      <BottomNav active={navTab} onChange={setNavTab} />
      <FloatingActions />
    </div>
  );
}
