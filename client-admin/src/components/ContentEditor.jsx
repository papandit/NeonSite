// Site Content editor — edits every piece of storefront copy the customer site
// renders (hero, trust features, how-it-works, testimonials, FAQs, promo,
// newsletter, footer, and info pages). Loads Settings.content, edits a local
// copy, and PUTs { content } back. Saving broadcasts an SSE event so open
// storefronts update live.

import { useEffect, useState } from 'react';
import { settingsApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';
import { toast } from '../lib/toast';

const NL = String.fromCharCode(10); // newline — used for the "one per line" fields

const EMPTY = {
  hero: { heading: '', subheading: '', ctaText: '' },
  features: [],
  howItWorks: [],
  testimonials: [],
  faqs: [],
  video: { heading: '', subheading: '', url: '', ctaText: '', ctaLink: '' },
  videoNameplate: { heading: '', subheading: '', url: '', ctaText: '', ctaLink: '' },
  neonInfo: { about: {}, box: {}, install: {}, compare: {}, reviews: [], faqs: [] },
  floroInfo: { about: {}, box: {}, install: {}, compare: {}, reviews: [], faqs: [] },
  crafted: {},
  promo: { heading: '', subheading: '', ctaText: '' },
  newsletter: { heading: '', subheading: '' },
  footer: { about: '', tagline: '' },
  pages: {},
};

function Field({ label, value, onChange, textarea, placeholder }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {textarea ? (
        <textarea
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      ) : (
        <input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      )}
    </label>
  );
}

function Card({ title, description, children }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h3 className="font-semibold text-slate-800">{title}</h3>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      {children}
    </section>
  );
}

// A repeatable list of records. `fields` = [{ key, label, textarea, width }].
function ListSection({ title, description, items, fields, onChange, makeEmpty, addLabel }) {
  const list = Array.isArray(items) ? items : [];
  const setItem = (i, key, val) => {
    const next = list.map((it, idx) => (idx === i ? { ...it, [key]: val } : it));
    onChange(next);
  };
  const remove = (i) => onChange(list.filter((_, idx) => idx !== i));
  const add = () => onChange([...list, makeEmpty()]);
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Card title={title} description={description}>
      <div className="space-y-3">
        {list.length === 0 && <p className="text-sm text-slate-400">No items yet.</p>}
        {list.map((it, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">#{i + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded px-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30" title="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === list.length - 1} className="rounded px-1.5 text-slate-500 hover:bg-slate-200 disabled:opacity-30" title="Move down">↓</button>
                <button type="button" onClick={() => remove(i)} className="rounded px-2 text-sm font-medium text-red-600 hover:bg-red-50">Remove</button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => (
                <div key={f.key} className={f.width === 'full' ? 'sm:col-span-2' : ''}>
                  <Field label={f.label} value={it[f.key]} textarea={f.textarea} onChange={(v) => setItem(i, f.key, v)} />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button type="button" onClick={add} className="rounded-full border border-dashed border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">
          + {addLabel}
        </button>
      </div>
    </Card>
  );
}

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

// The Neon and FloRo product stories share a shape, so one component edits
// either (`k` is the content key: neonInfo | floroInfo).
function LightStory({ label, k, content, setNested, setDeep }) {
  return (
    <>
      <Card title={`${label} — About`} description="The long-form section under the Neon Studio customizer.">
        <Field label="Heading" value={content[k]?.about?.heading} onChange={(v) => setDeep(k, 'about', 'heading', v)} />
        <Field label="Body" value={content[k]?.about?.body} textarea onChange={(v) => setDeep(k, 'about', 'body', v)} />
      </Card>

      <Card title={`${label} — What's in the box`} description="One item per line.">
        <Field label="Heading" value={content[k]?.box?.heading} onChange={(v) => setDeep(k, 'box', 'heading', v)} />
        <Field label="Intro" value={content[k]?.box?.body} textarea onChange={(v) => setDeep(k, 'box', 'body', v)} />
        <Field
          label="Items (one per line)"
          value={(content[k]?.box?.items || []).join(NL)}
          textarea
          onChange={(v) => setDeep(k, 'box', 'items', v.split(NL).map((x) => x.trim()).filter(Boolean))}
        />
      </Card>

      <ListSection
        title={`${label} — How to install`}
        description="Steps shown as cards. Leave the image blank to show a numbered tile."
        items={content[k]?.install?.steps}
        onChange={(v) => setDeep(k, 'install', 'steps', v)}
        makeEmpty={() => ({ title: '', desc: '', image: '' })}
        addLabel="Add step"
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'image', label: 'Image URL (optional)' },
          { key: 'desc', label: 'Description', width: 'full', textarea: true },
        ]}
      />

      <Card title={`${label} — Comparison table`} description="The green 'Us vs Them' table. One claim per line; empty hides the table.">
        <Field label="Heading" value={content[k]?.compare?.heading} placeholder="Go For the best!" onChange={(v) => setDeep(k, 'compare', 'heading', v)} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Our column label" value={content[k]?.compare?.usLabel} placeholder="Us" onChange={(v) => setDeep(k, 'compare', 'usLabel', v)} />
          <Field label="Their column label" value={content[k]?.compare?.themLabel} placeholder="Them" onChange={(v) => setDeep(k, 'compare', 'themLabel', v)} />
        </div>
        <Field
          label="Rows (one per line)"
          value={(content[k]?.compare?.rows || []).join(NL)}
          textarea
          onChange={(v) => setDeep(k, 'compare', 'rows', v.split(NL).map((x) => x.trim()).filter(Boolean))}
        />
      </Card>

      <ListSection
        title={`${label} — Reviews`}
        items={content[k]?.reviews}
        onChange={(v) => setNested(k, 'reviews', v)}
        makeEmpty={() => ({ name: '', quote: '' })}
        addLabel="Add review"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'quote', label: 'Quote', width: 'full', textarea: true },
        ]}
      />

      <ListSection
        title={`${label} — FAQs`}
        items={content[k]?.faqs}
        onChange={(v) => setNested(k, 'faqs', v)}
        makeEmpty={() => ({ q: '', a: '' })}
        addLabel="Add FAQ"
        fields={[
          { key: 'q', label: 'Question', width: 'full' },
          { key: 'a', label: 'Answer', width: 'full', textarea: true },
        ]}
      />
    </>
  );
}

export default function ContentEditor() {
  const [content, setContent] = useState(EMPTY);
  const [pageList, setPageList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

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
        title="Testimonials"
        description="The 'What customers say' cards on the home page."
        items={content.testimonials}
        onChange={(v) => set('testimonials', v)}
        makeEmpty={() => ({ name: '', quote: '' })}
        addLabel="Add testimonial"
        fields={[
          { key: 'name', label: 'Name' },
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

      {/* Neon Studio product story — one block per light type */}
      <LightStory label="Neon page" k="neonInfo" content={content} setNested={setNested} setDeep={setDeep} />
      <LightStory label="FloRo page" k="floroInfo" content={content} setNested={setNested} setDeep={setDeep} />

      <Card title="Neon page — Expertly crafted" description="The workshop story at the end of the neon page. One image URL per line (up to 4).">
        <Field label="Heading" value={content.crafted?.heading} onChange={(v) => setNested('crafted', 'heading', v)} />
        <Field label="Body" value={content.crafted?.body} textarea onChange={(v) => setNested('crafted', 'body', v)} />
        <Field
          label="Image URLs (one per line)"
          value={(content.crafted?.images || []).join(NL)}
          textarea
          onChange={(v) => setNested('crafted', 'images', v.split(NL).map((x) => x.trim()).filter(Boolean))}
        />
      </Card>

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

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save content'}
        </button>
      </div>
    </div>
  );
}
