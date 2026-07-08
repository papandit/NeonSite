// Storefront-wide settings + content, fetched once from GET /api/settings and
// kept live via the SSE 'settings:changed' event (fires when an admin saves).
// Ships with full defaults so every consumer renders immediately and never
// blanks out if a field is missing or the request is still in flight.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSiteSettings } from '../services/catalog';
import { API_BASE_URL } from '../services/api';

export const DEFAULT_CONTENT = {
  hero: {
    heading: 'Custom name plates, designed by you',
    subheading:
      'Personalize material, size, font, colour and icons in a live editor — then we craft your exact design and deliver it.',
    ctaText: 'Start designing',
  },
  features: [
    { icon: '✍️', title: 'Made to order', desc: 'Every plate is handcrafted just for you.' },
    { icon: '🚚', title: 'Free shipping over ₹2000', desc: 'Fast, tracked delivery across India.' },
    { icon: '🎨', title: 'Live design preview', desc: 'See exactly what you get before you buy.' },
    { icon: '🔒', title: 'Secure checkout', desc: 'Razorpay-protected payments, always.' },
  ],
  howItWorks: [
    { step: '1', title: 'Pick a design', desc: 'Choose a name plate and open the live customizer.' },
    { step: '2', title: 'Make it yours', desc: 'Set material, size, font, colour, icons and your text.' },
    { step: '3', title: 'We craft & ship', desc: 'We produce your exact design and deliver it to your door.' },
  ],
  testimonials: [
    { name: 'Aarti S.', quote: 'The wooden plate looks stunning on our door. Exactly like the preview!' },
    { name: 'Rahul M.', quote: 'Loved the live editor — I could see my name in different fonts instantly.' },
    { name: 'Priya K.', quote: 'Premium quality and fast delivery. Highly recommend.' },
    { name: 'Imran Q.', quote: 'Ordered a brass plate for our office cabin — looks so professional.' },
    { name: 'Sneha D.', quote: 'The resin ocean design is gorgeous. Everyone asks where I got it.' },
    { name: 'Vikram N.', quote: 'Simple to customise and the finish is top-notch. Will order again.' },
  ],
  faqs: [
    { q: 'How long does delivery take?', a: 'Custom plates are made to order and typically ship in 5–7 business days.' },
    { q: 'Can I change my design after ordering?', a: 'Yes — there is a design review step before manufacturing where you approve the final artwork.' },
    { q: 'What materials are available?', a: 'Wood, acrylic, brass, steel and resin, with new options added regularly.' },
    { q: 'How do I customize my name plate?', a: 'Open any product and use the live editor to set material, size, font, colour, border, background, mount and icons — the price updates instantly.' },
    { q: 'Can I buy a plate without customizing?', a: 'Yes. Every product has an "Add to cart (as-is)" option that uses sensible defaults, or you can personalize it fully.' },
    { q: 'Do you offer bulk or corporate orders?', a: 'Absolutely — reach out via the support email for office and bulk pricing.' },
    { q: 'Do you ship across India?', a: 'Yes, we deliver pan-India with tracking. Shipping is free on orders over ₹2000.' },
    { q: 'What is your return policy?', a: 'Because each plate is personalised, we replace items only for manufacturing defects or shipping damage.' },
  ],
  promo: {
    heading: 'Ready to design yours?',
    subheading: 'Create a one-of-a-kind name plate in minutes — or grab a ready design as-is.',
    ctaText: 'Start designing',
  },
  newsletter: {
    heading: 'Join our list',
    subheading: 'Design ideas, new materials and offers — straight to your inbox.',
  },
  footer: {
    about: 'Handcrafted, personalized name plates — designed by you, crafted to order by Onewebmart.',
    tagline: 'Custom name plates, crafted to order in India 🇮🇳',
  },
  pages: {},
};

const DEFAULT_SETTINGS = {
  storeName: 'OWM NameCraft Ecom',
  logoUrl: '',
  supportEmail: 'support@namecraft.local',
  supportPhone: '',
  storeAddress: '',
  socials: {},
  freeShippingAbovePaise: 200000,
  content: DEFAULT_CONTENT,
};

const SiteSettingsContext = createContext({ settings: DEFAULT_SETTINGS, loading: true });

function withDefaults(data) {
  if (!data) return DEFAULT_SETTINGS;
  const c = data.content || {};
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    socials: data.socials || {},
    content: {
      hero: { ...DEFAULT_CONTENT.hero, ...(c.hero || {}) },
      features: c.features?.length ? c.features : DEFAULT_CONTENT.features,
      howItWorks: c.howItWorks?.length ? c.howItWorks : DEFAULT_CONTENT.howItWorks,
      testimonials: c.testimonials?.length ? c.testimonials : DEFAULT_CONTENT.testimonials,
      faqs: c.faqs?.length ? c.faqs : DEFAULT_CONTENT.faqs,
      promo: { ...DEFAULT_CONTENT.promo, ...(c.promo || {}) },
      newsletter: { ...DEFAULT_CONTENT.newsletter, ...(c.newsletter || {}) },
      footer: { ...DEFAULT_CONTENT.footer, ...(c.footer || {}) },
      pages: c.pages && typeof c.pages === 'object' ? c.pages : {},
    },
  };
}

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    getSiteSettings()
      .then((data) => setSettings(withDefaults(data)))
      .catch(() => {}) // keep defaults on failure
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live refresh when an admin saves settings/content.
  useEffect(() => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const es = new EventSource(`${base}/events`);
    let timer;
    const handler = () => {
      clearTimeout(timer);
      timer = setTimeout(load, 300);
    };
    es.addEventListener('settings:changed', handler);
    es.onerror = () => {};
    return () => { clearTimeout(timer); es.close(); };
  }, [load]);

  const value = useMemo(() => ({ settings, loading, reload: load }), [settings, loading, load]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
