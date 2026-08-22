import { useParams, Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useSiteSettings } from '../context/SiteSettings';
import Breadcrumbs from '../components/Breadcrumbs';

function humanize(slug) {
  return (slug || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// A page is stored as plain text: a blank line starts a new paragraph, and a
// line beginning '## ' starts a section heading. That round-trips through a
// single textarea in the admin, which is what makes these pages editable at
// all — nobody would maintain prose in a structured section editor.
function parsePage(slug, p = {}) {
  const sections = [];
  let current = null;
  for (const block of String(p.body || '').split(/\n\s*\n/)) {
    const text = block.trim();
    if (!text) continue;
    if (text.startsWith('## ')) {
      current = { heading: text.slice(3).trim(), body: [] };
      sections.push(current);
      continue;
    }
    if (!current) { current = { heading: '', body: [] }; sections.push(current); }
    current.body.push(text);
  }
  return { title: p.title || humanize(slug), intro: p.intro || '', sections };
}

export default function InfoPage() {
  const { slug } = useParams();
  const { settings } = useSiteSettings();

  // Every page comes from Site content now — the shipped defaults are merged
  // under whatever the admin has saved, so there is one source either way.
  const stored = settings.content?.pages?.[slug];
  const page = stored
    ? parsePage(slug, stored)
    : { title: humanize(slug), intro: 'Content coming soon.', sections: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Seo title={page.title} description={page.intro} path={`/p/${slug}`} />

      <Breadcrumbs items={[{ label: page.title }]} />

      <h1 className="font-display text-3xl font-medium text-gray-900 sm:text-4xl">{page.title}</h1>
      {page.intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{page.intro}</p>}

      <div className="mt-8 space-y-8">
        {page.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="font-display text-xl font-medium text-gray-900">{s.heading}</h2>}
            <div className="mt-2 space-y-2 text-gray-600">
              {s.body.map((p, j) => (
                <p key={j} className="leading-relaxed">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <Link to="/products" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          Browse products
        </Link>
      </div>
    </div>
  );
}
