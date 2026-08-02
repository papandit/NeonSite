// Shared building blocks for the admin content editors. Both the Settings >
// Site content page and the Neon Studio page compose these, so a field only
// ever exists in one place.

import FileUpload from './FileUpload';

export const NL = String.fromCharCode(10); // newline - for the "one per line" fields

export function Field({ label, value, onChange, textarea, placeholder }) {
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

export function Card({ title, description, children }) {
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
export function ListSection({ title, description, items, fields, onChange, makeEmpty, addLabel }) {
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
                  {f.type === 'image' ? (
                    <FileUpload
                      kind="image"
                      folder={f.folder || 'content'}
                      label={f.label}
                      value={it[f.key] || ''}
                      onChange={(v) => setItem(i, f.key, v)}
                    />
                  ) : (
                    <Field label={f.label} value={it[f.key]} textarea={f.textarea} onChange={(v) => setItem(i, f.key, v)} />
                  )}
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

// The Neon and FloRo product stories share a shape, so one component edits
// either (`k` is the content key: neonInfo | floroInfo).
export function LightStory({ label, k, content, setNested, setDeep }) {
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
        description="Steps shown as cards. Upload a photo, or leave it blank for a numbered tile."
        items={content[k]?.install?.steps}
        onChange={(v) => setDeep(k, 'install', 'steps', v)}
        makeEmpty={() => ({ title: '', desc: '', image: '' })}
        addLabel="Add step"
        fields={[
          { key: 'title', label: 'Title' },
          { key: 'image', label: 'Step photo (optional)', type: 'image', folder: 'neon-install' },
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
        description="Shown as a masonry wall, same as the product pages. Photo and rating are optional."
        items={content[k]?.reviews}
        onChange={(v) => setNested(k, 'reviews', v)}
        makeEmpty={() => ({ name: '', quote: '', rating: 5, date: '', image: '' })}
        addLabel="Add review"
        fields={[
          { key: 'name', label: 'Name' },
          { key: 'rating', label: 'Rating (1-5)' },
          { key: 'date', label: 'Date shown (optional, e.g. Jul 2026)' },
          { key: 'image', label: 'Photo (optional)', type: 'image', folder: 'reviews' },
          { key: 'quote', label: 'Review', width: 'full', textarea: true },
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
