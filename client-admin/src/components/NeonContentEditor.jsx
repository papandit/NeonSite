// Neon page content — everything the neon storefront renders BELOW the
// customizer: the Neon and FloRo product stories, the "expertly crafted" band
// and the closing assurance strip.
//
// It edits the same Settings.content document as the Site content page, so it
// loads the whole document, changes only its own keys and PUTs all of it back —
// never a partial write that would blank another page's copy.

import { useEffect, useState } from 'react';
import { settingsApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';
import { toast } from '../lib/toast';
import { Card, Field, LightStory, ListSection, NL } from './contentBits';
import { Badge, InfoTip, TabPanel, Tabs } from './ui';
import FileUpload from './FileUpload';

const EMPTY = {
  neonInfo: { about: {}, box: {}, install: {}, compare: {}, reviews: [], faqs: [] },
  floroInfo: { about: {}, box: {}, install: {}, compare: {}, reviews: [], faqs: [] },
  crafted: {},
  assurance: [],
};

const CRAFT_SLOTS = ['Top left', 'Top right', 'Bottom left', 'Bottom right'];

export default function NeonContentEditor() {
  const [content, setContent] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [tab, setTab] = useState('neon');

  useEffect(() => {
    settingsApi.get()
      .then((s) => setContent({ ...EMPTY, ...(s.content || {}) }))
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => { setContent((c) => ({ ...c, [key]: val })); setDirty(true); };
  const setNested = (key, subKey, val) => { setContent((c) => ({ ...c, [key]: { ...c[key], [subKey]: val } })); setDirty(true); };
  const setDeep = (key, subKey, leaf, val) => { setContent((c) => ({ ...c, [key]: { ...c[key], [subKey]: { ...(c[key]?.[subKey] || {}), [leaf]: val } } })); setDirty(true); };

  // The collage takes exactly four slots, so edit it as a fixed-length list
  // rather than an add/remove one — an empty slot just renders nothing.
  const setCraftImage = (i, url) => {
    const next = [...(content.crafted?.images || [])];
    while (next.length < CRAFT_SLOTS.length) next.push('');
    next[i] = url || '';
    setNested('crafted', 'images', next);
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await settingsApi.update({ content });
      setDirty(false);
      toast.success('Neon page content saved');
    } catch (e) {
      const msg = apiErrorMessage(e);
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading neon page content…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <div>
          <h3 className="font-semibold text-slate-800">Neon page content</h3>
          <p className="text-xs text-slate-400">
            The story sections under the customizer. Switching Neon Light / FloRo Light on the
            storefront swaps between the two blocks below.
          </p>
        </div>
        <button
          onClick={onSave}
          disabled={saving || !dirty}
          className="shrink-0 rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : dirty ? 'Save content' : 'Saved'}
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Tabs
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'neon', label: 'Neon Light' },
          { value: 'floro', label: 'FloRo Light' },
          { value: 'crafted', label: 'Crafted band' },
          { value: 'assurance', label: 'Assurance', badge: (content.assurance || []).length },
        ]}
      >
        <TabPanel value="neon">
          <LightStory label="Neon Light" k="neonInfo" content={content} setNested={setNested} setDeep={setDeep} />
        </TabPanel>

        <TabPanel value="floro">
          <LightStory label="FloRo Light" k="floroInfo" content={content} setNested={setNested} setDeep={setDeep} />
        </TabPanel>

        <TabPanel value="crafted">
          <Card
            title={<>Expertly crafted band <Badge tone="brand">both light types</Badge></>}
            description="The coloured band at the end of the page. Leave a blank line between paragraphs."
          >
            <Field label="Heading" value={content.crafted?.heading} onChange={(v) => setNested('crafted', 'heading', v)} />
            <Field label="Body" value={content.crafted?.body} textarea onChange={(v) => setNested('crafted', 'body', v)} />
            <div>
              <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                Collage photos
                <InfoTip>
                  Four tilted tiles arranged in a cross. Leave a slot empty to skip it — the
                  remaining photos keep their positions.
                </InfoTip>
              </span>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {CRAFT_SLOTS.map((slot, i) => (
                  <FileUpload
                    key={slot}
                    kind="image"
                    folder="crafted"
                    label={slot}
                    value={content.crafted?.images?.[i] || ''}
                    onChange={(url) => setCraftImage(i, url)}
                  />
                ))}
              </div>
            </div>
          </Card>
        </TabPanel>

        <TabPanel value="assurance">
          <ListSection
            title="Assurance strip"
            description={`The four badges under the crafted band.${NL}Icon must be one of: delivery, guarantee, handcrafted, rated.`}
            items={content.assurance}
            onChange={(v) => set('assurance', v)}
            makeEmpty={() => ({ icon: 'guarantee', title: '', desc: '' })}
            addLabel="Add badge"
            fields={[
              { key: 'title', label: 'Title' },
              { key: 'icon', label: 'Icon (delivery / guarantee / handcrafted / rated)' },
              { key: 'desc', label: 'Subtitle', width: 'full' },
            ]}
          />
        </TabPanel>
      </Tabs>
    </div>
  );
}
