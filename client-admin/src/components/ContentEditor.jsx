// Site Content editor — edits every piece of storefront copy the customer site
// renders (hero, trust features, how-it-works, testimonials, FAQs, promo,
// newsletter, footer, and info pages). Loads Settings.content, edits a local
// copy, and PUTs { content } back. Saving broadcasts an SSE event so open
// storefronts update live.

import { useEffect, useState } from 'react';
import { settingsApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';
import { toast } from '../lib/toast';
import { Card, Field, ListSection, NL } from './contentBits';

const EMPTY = {
  hero: { heading: '', subheading: '', ctaText: '' },
  features: [],
  howItWorks: [],
  testimonials: [],
  faqs: [],
  video: { heading: '', subheading: '', url: '', ctaText: '', ctaLink: '' },
  videoNameplate: { heading: '', subheading: '', url: '', ctaText: '', ctaLink: '' },
  highlights: [],
  marquee: [],
  instagram: { heading: '', followers: '', profileUrl: '', items: [] },
  shipping: { heading: '', express: '' },
  promo: { heading: '', subheading: '', ctaText: '' },
  newsletter: { heading: '', subheading: '' },
  footer: { about: '', tagline: '' },
  pages: {},
};

// Info pages are keyed by slug; edit them as a list of { slug, title, intro, body }.
const KNOWN_PAGES = [
  ['about-us', 'About Us'],
  ['about-product', 'About Our Products'],
  ['privacy-policy', 'Privacy Policy'],
  ['refund-and-return-policy', 'Refund and Return Policy'],
  ['shipping-and-delivery', 'Shipping and Delivery'],
  ['terms-of-service', 'Terms of Service Agreement'],
  ['contact-us', 'Contact Us'],
];

function pagesToList(pages = {}) {
  return Object.entries(pages).map(([slug, p]) => ({ slug, title: p.title || '', intro: p.intro || '', body: p.body || '' }));
}
function listToPages(list = []) {
  const out = {};
  for (const p of list) {
    const slug = (p.slug || '').trim();
    if (slug) out[slug] = { title: p.title || '', intro: p.intro || '', body: p.body || '' };
  }
  return out;
}

// One titled block of related cards. `scroll-mt` clears the sticky header so a
// jump lands on the heading rather than under it.
function Group({ id, label, children }) {
  return (
    <section id={`sc-${id}`} className="scroll-mt-24 space-y-6">
      <h3 className="border-b border-slate-200 pb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </h3>
      {children}
    </section>
  );
}

const SECTIONS = [
  { id: 'home', label: 'Home page' },
  { id: 'reviews', label: 'Reviews & FAQs' },
  { id: 'videos', label: 'Videos' },
  { id: 'product', label: 'Product pages' },
  { id: 'promo', label: 'Promo & footer' },
  { id: 'pages', label: 'Info pages' },
];

export default function ContentEditor() {
  const [content, setContent] = useState(EMPTY);
  const [pageList, setPageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    settingsApi.get()
      .then((s) => {
        const c = { ...EMPTY, ...(s.content || {}) };
        setContent(c);
        setPageList(pagesToList(c.pages));
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  // Highlight whichever group is on screen, so the rail tracks scrolling as
  // well as clicking.
  useEffect(() => {
    if (loading) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (seen[0]) setActive(seen[0].target.id.replace('sc-', ''));
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    SECTIONS.forEach((sec) => {
      const el = document.getElementById(`sc-${sec.id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [loading]);

  const go = (id) => document.getElementById(`sc-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const set = (key, val) => { setContent((c) => ({ ...c, [key]: val })); setSaved(false); };
  const setNested = (key, subKey, val) => { setContent((c) => ({ ...c, [key]: { ...c[key], [subKey]: val } })); setSaved(false); };
  const setDeep = (key, subKey, leaf, val) => { setContent((c) => ({ ...c, [key]: { ...c[key], [subKey]: { ...(c[key]?.[subKey] || {}), [leaf]: val } } })); setSaved(false); };

  const onSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const payload = { ...content, pages: listToPages(pageList) };
      await settingsApi.update({ content: payload });
      setSaved(true);
      toast.success('Content saved');
    } catch (e) {
      const msg = apiErrorMessage(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading content…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Site content</h2>
          <p className="text-xs text-slate-400">Everything the storefront shows — updates live on save.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
          <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save content'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[180px_1fr] lg:items-start">
        {/* Jump nav — this page is long, and hunting for the footer fields by
            scrolling is the main thing that made it unpleasant. */}
        <nav className="lg:sticky lg:top-6">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((sec) => (
              <li key={sec.id}>
                <button
                  type="button"
                  onClick={() => go(sec.id)}
                  className={`w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    active === sec.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                >
                  {sec.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-10">
      <Group id="home" label="Home page">
      <Card title="Hero" description="Shown when no home banner is set.">
        <Field label="Heading" value={content.hero?.heading} onChange={(v) => setNested('hero', 'heading', v)} />
        <Field label="Subheading" value={content.hero?.subheading} textarea onChange={(v) => setNested('hero', 'subheading', v)} />
        <Field label="Button text" value={content.hero?.ctaText} onChange={(v) => setNested('hero', 'ctaText', v)} />
      </Card>

      <ListSection
        title="Trust features"
        description="The four cards under the hero. Icon can be any emoji."
        items={content.features}
        onChange={(v) => set('features', v)}
        makeEmpty={() => ({ icon: '⭐', title: '', desc: '' })}
        addLabel="Add feature"
        fields={[
          { key: 'icon', label: 'Icon (emoji)' },
          { key: 'title', label: 'Title' },
          { key: 'desc', label: 'Description', width: 'full', textarea: true },
        ]}
      />

      <ListSection
        title="How it works"
        items={content.howItWorks}
        onChange={(v) => set('howItWorks', v)}
        makeEmpty={() => ({ step: String((content.howItWorks?.length || 0) + 1), title: '', desc: '' })}
        addLabel="Add step"
        fields={[
          { key: 'step', label: 'Step label' },
          { key: 'title', label: 'Title' },
          { key: 'desc', label: 'Description', width: 'full', textarea: true },
        ]}
      />

      <ListSection
        title="Home — Scrolling promises"
        description="The dark ribbon that slides under the hero. Icon must be one of: delivery, warranty, rating, quality, value, install."
        items={content.marquee}
        onChange={(v) => set('marquee', v)}
        makeEmpty={() => ({ icon: 'quality', label: '' })}
        addLabel="Add promise"
        fields={[
          { key: 'label', label: 'Text' },
          { key: 'icon', label: 'Icon (delivery / warranty / rating / quality / value / install)' },
        ]}
      />

      <Card title="Home — Customer videos" description="The clip carousel on the home page. Leave the tiles empty to hide the whole section.">
        <Field label="Heading" value={content.instagram?.heading} placeholder="Happy customers" onChange={(v) => setNested('instagram', 'heading', v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Sub-line" value={content.instagram?.followers} placeholder="Real walls, real installs" onChange={(v) => setNested('instagram', 'followers', v)} />
          <Field label="Instagram profile URL (adds a Follow button)" value={content.instagram?.profileUrl} placeholder="https://instagram.com/yourhandle" onChange={(v) => setNested('instagram', 'profileUrl', v)} />
        </div>
      </Card>

      <ListSection
        title="Home — Customer video tiles"
        description="Up to 15 vertical clips, uploaded here so they autoplay muted on loop — an Instagram embed will not autoplay, so posts are linked rather than embedded. Only filled tiles show, so a half-filled list never leaves gaps."
        items={content.instagram?.items}
        onChange={(v) => setNested('instagram', 'items', v)}
        makeEmpty={() => ({ video: '', image: '', link: '', caption: '' })}
        addLabel="Add tile"
        fields={[
          { key: 'video', label: 'Customer video (autoplays muted on loop)', type: 'video', folder: 'instagram' },
          { key: 'image', label: 'Poster image — shown before the clip loads, or on its own', type: 'image', folder: 'instagram' },
          { key: 'link', label: 'Links to (optional) — e.g. the Instagram post', width: 'full' },
          { key: 'caption', label: 'Caption (optional)', width: 'full' },
        ]}
      />

      </Group>

      <Group id="reviews" label="Reviews & FAQs">
      <ListSection
        title="Testimonials"
        description="The 'What customers say' wall on the home page. Rating, date and photo are optional."
        items={content.testimonials}
        onChange={(v) => set('testimonials', v)}
        makeEmpty={() => ({ name: '', quote: '', rating: 5, date: '', source: 'Google Review', image: '' })}
        addLabel="Add testimonial"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'rating', label: 'Rating (1-5)' },
          { key: 'date', label: 'Date shown (optional)' },
          { key: 'source', label: 'Source badge (e.g. Google Review)' },
          { key: 'image', label: 'Photo (optional)', type: 'image', folder: 'testimonials' },
          { key: 'quote', label: 'Quote', width: 'full', textarea: true },
        ]}
      />

      <ListSection
        title="FAQs"
        items={content.faqs}
        onChange={(v) => set('faqs', v)}
        makeEmpty={() => ({ q: '', a: '' })}
        addLabel="Add FAQ"
        fields={[
          { key: 'q', label: 'Question', width: 'full' },
          { key: 'a', label: 'Answer', width: 'full', textarea: true },
        ]}
      />

      </Group>

      <Group id="videos" label="Videos">
      <Card title="Neon video section" description="The neon 'Behind the craft' video on the home page. Leave the URL blank to hide it.">
        <Field label="Heading" value={content.video?.heading} onChange={(v) => setNested('video', 'heading', v)} />
        <Field label="Subheading" value={content.video?.subheading} textarea onChange={(v) => setNested('video', 'subheading', v)} />
        <Field label="Video URL" value={content.video?.url} placeholder="/neon-studio.mp4 or a hosted .mp4 URL" onChange={(v) => setNested('video', 'url', v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Button text" value={content.video?.ctaText} onChange={(v) => setNested('video', 'ctaText', v)} />
          <Field label="Button link" value={content.video?.ctaLink} placeholder="/neon" onChange={(v) => setNested('video', 'ctaLink', v)} />
        </div>
      </Card>

      <Card title="Name plate video section" description="The name-plate 'Behind the craft' video on the home page. Leave the URL blank to hide it.">
        <Field label="Heading" value={content.videoNameplate?.heading} onChange={(v) => setNested('videoNameplate', 'heading', v)} />
        <Field label="Subheading" value={content.videoNameplate?.subheading} textarea onChange={(v) => setNested('videoNameplate', 'subheading', v)} />
        <Field label="Video URL" value={content.videoNameplate?.url} placeholder="/nameplate-studio.mp4 or a hosted .mp4 URL" onChange={(v) => setNested('videoNameplate', 'url', v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Button text" value={content.videoNameplate?.ctaText} onChange={(v) => setNested('videoNameplate', 'ctaText', v)} />
          <Field label="Button link" value={content.videoNameplate?.ctaLink} placeholder="/nameplates" onChange={(v) => setNested('videoNameplate', 'ctaLink', v)} />
        </div>
      </Card>

      {/* The Neon + FloRo product story, the crafted band and the assurance
          strip are edited on the Neon Studio page, next to the neon catalogue. */}

      </Group>

      <Group id="product" label="Product pages">
      <ListSection
        title="Product page — Story highlights"
        description="The circular reel under the buy button on product and name-plate pages. An entry with no image is skipped; an empty list hides the reel."
        items={content.highlights}
        onChange={(v) => set('highlights', v)}
        makeEmpty={() => ({ label: '', image: '', link: '' })}
        addLabel="Add highlight"
        fields={[
          { key: 'label', label: 'Label' },
          { key: 'link', label: 'Links to (optional, e.g. /neon)' },
          { key: 'image', label: 'Photo', type: 'image', folder: 'highlights', width: 'full' },
        ]}
      />

      <Card title="Product page — Shipping card" description="The delivery timeline under the buy button. Dates are calculated automatically.">
        <Field label="Heading" value={content.shipping?.heading} placeholder="Free Shipping" onChange={(v) => setNested('shipping', 'heading', v)} />
        <Field label="Express note (blank hides it)" value={content.shipping?.express} textarea onChange={(v) => setNested('shipping', 'express', v)} />
      </Card>

      </Group>

      <Group id="promo" label="Promo & footer">
      <Card title="Promo band" description="The coloured call-to-action band.">
        <Field label="Heading" value={content.promo?.heading} onChange={(v) => setNested('promo', 'heading', v)} />
        <Field label="Subheading" value={content.promo?.subheading} textarea onChange={(v) => setNested('promo', 'subheading', v)} />
        <Field label="Button text" value={content.promo?.ctaText} onChange={(v) => setNested('promo', 'ctaText', v)} />
      </Card>

      <Card title="Newsletter">
        <Field label="Heading" value={content.newsletter?.heading} onChange={(v) => setNested('newsletter', 'heading', v)} />
        <Field label="Subheading" value={content.newsletter?.subheading} textarea onChange={(v) => setNested('newsletter', 'subheading', v)} />
      </Card>

      <Card title="Footer">
        <Field label="About text" value={content.footer?.about} textarea onChange={(v) => setNested('footer', 'about', v)} />
        <Field label="Bottom tagline" value={content.footer?.tagline} onChange={(v) => setNested('footer', 'tagline', v)} />
      </Card>

      </Group>

      <Group id="pages" label="Info pages">
      <ListSection
        title="Info pages"
        description={`Footer 'Quick links' pages. Use a known slug (${KNOWN_PAGES.map((p) => p[0]).join(', ')}) to override a built-in page. Leave blank to keep the built-in default. Blank lines separate paragraphs in the body.`}
        items={pageList}
        onChange={(v) => { setPageList(v); setSaved(false); }}
        makeEmpty={() => ({ slug: '', title: '', intro: '', body: '' })}
        addLabel="Add / override a page"
        fields={[
          { key: 'slug', label: 'Slug (e.g. about-us)' },
          { key: 'title', label: 'Title' },
          { key: 'intro', label: 'Intro', width: 'full', textarea: true },
          { key: 'body', label: 'Body (blank line = new paragraph)', width: 'full', textarea: true },
        ]}
      />

      </Group>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save content'}
        </button>
      </div>
    </div>
  );
}
