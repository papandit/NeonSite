// Product Builder — creates/edits a Product and writes its customizationConfig:
// which panels are enabled, the allowed option ids per panel, icon max, and
// text fields. Base price entered in rupees, stored as integer paise.

import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { paiseToRupees, rupeesToPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import FileUpload from '../../components/FileUpload';
import InlineOptionCreator from '../../components/InlineOptionCreator';

// Panel -> option collection mapping. `metaFields` mirrors the server option
// registry so the admin can create a new option inline with the right fields.
const PANELS = [
  { panel: 'material', collKey: 'materials', label: 'Material', hasRequired: true, metaFields: [] },
  { panel: 'size', collKey: 'sizes', label: 'Size', hasRequired: true, metaFields: [
    { name: 'widthMm', type: 'number', label: 'Width (mm)' },
    { name: 'heightMm', type: 'number', label: 'Height (mm)' },
  ] },
  { panel: 'font', collKey: 'fonts', label: 'Font', metaFields: [
    { name: 'fileUrl', type: 'font', label: 'Font file (ttf/otf/woff)' },
    { name: 'format', type: 'text', label: 'Format' },
    { name: 'family', type: 'text', label: 'Family name' },
  ] },
  { panel: 'color', collKey: 'colors', label: 'Color', metaFields: [
    { name: 'hex', type: 'color', label: 'Hex' },
  ] },
  { panel: 'background', collKey: 'backgrounds', label: 'Background', metaFields: [
    { name: 'type', type: 'text', label: 'Type (color/texture/image)' },
    { name: 'value', type: 'text', label: 'Value (hex or URL)' },
  ] },
  { panel: 'border', collKey: 'borders', label: 'Border', metaFields: [] },
  { panel: 'mountType', collKey: 'mounttypes', label: 'Mount Type', metaFields: [] },
  { panel: 'icons', collKey: 'icons', label: 'Icons', isIcons: true, metaFields: [
    { name: 'svgUrl', type: 'svg', label: 'SVG file' },
    { name: 'group', type: 'text', label: 'Group' },
  ] },
];

const products = resource('products');
const categoriesApi = resource('categories');
const subCategoriesApi = resource('subcategories');

function emptyConfig() {
  const cfg = {};
  for (const p of PANELS) {
    cfg[p.panel] = { enabled: false, required: false, options: [], ...(p.isIcons ? { max: 3 } : {}) };
  }
  return cfg;
}

function configFromProduct(product) {
  const cfg = emptyConfig();
  for (const p of PANELS) {
    const c = product?.customizationConfig?.[p.panel] || {};
    cfg[p.panel] = {
      enabled: Boolean(c.enabled),
      required: Boolean(c.required),
      options: (c.options || []).map(String),
      ...(p.isIcons ? { max: c.max ?? 3 } : {}),
    };
  }
  return cfg;
}

export default function ProductBuilderPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [allOptions, setAllOptions] = useState({});
  const [cats, setCats] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [config, setConfig] = useState(emptyConfig());
  const [textFields, setTextFields] = useState([]);
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch every option collection + categories + subcategories in parallel.
        const optionKeys = PANELS.map((p) => p.collKey);
        const [optionResults, catRes, subRes] = await Promise.all([
          Promise.all(optionKeys.map((k) => resource(k).list({ limit: 200 }))),
          categoriesApi.list({ limit: 200 }),
          subCategoriesApi.list({ limit: 200 }),
        ]);
        const optionsMap = {};
        optionKeys.forEach((k, i) => { optionsMap[k] = optionResults[i].data; });
        setAllOptions(optionsMap);
        setCats(catRes.data);
        setSubCats(subRes.data);

        if (isEdit) {
          const product = await products.get(id);
          reset({
            name: product.name,
            category: product.category?._id || '',
            subCategory: product.subCategory?._id || '',
            description: product.description || '',
            priceRupees: paiseToRupees(product.basePricePaise),
            compareRupees: product.compareAtPricePaise ? paiseToRupees(product.compareAtPricePaise) : '',
            status: product.status,
          });
          setConfig(configFromProduct(product));
          setTextFields(product.customizationConfig?.textFields || []);
          setImages(product.images || []);
        } else {
          reset({ name: '', category: '', subCategory: '', description: '', priceRupees: 0, compareRupees: '', status: 'active' });
        }
        setError(null);
      } catch (err) {
        setError(apiErrorMessage(err));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setPanel = (panel, patch) =>
    setConfig((c) => ({ ...c, [panel]: { ...c[panel], ...patch } }));

  const toggleOption = (panel, optId) =>
    setConfig((c) => {
      const opts = c[panel].options;
      const next = opts.includes(optId) ? opts.filter((o) => o !== optId) : [...opts, optId];
      return { ...c, [panel]: { ...c[panel], options: next } };
    });

  // A newly-created option (from the inline creator): add it to the collection
  // list and auto-select it on this product's panel.
  const handleOptionCreated = (panel, collKey, option) => {
    setAllOptions((prev) => ({ ...prev, [collKey]: [...(prev[collKey] || []), option] }));
    setConfig((c) => ({ ...c, [panel]: { ...c[panel], options: [...c[panel].options, String(option._id)] } }));
  };

  // Text fields editor
  const addTextField = () =>
    setTextFields((t) => [...t, { key: '', label: '', required: false, maxLength: 40 }]);
  const updateTextField = (i, patch) =>
    setTextFields((t) => t.map((tf, idx) => (idx === i ? { ...tf, ...patch } : tf)));
  const removeTextField = (i) => setTextFields((t) => t.filter((_, idx) => idx !== i));

  const addImage = () => {
    if (newImage.trim()) { setImages((im) => [...im, newImage.trim()]); setNewImage(''); }
  };
  const removeImage = (i) => setImages((im) => im.filter((_, idx) => idx !== i));

  const onSubmit = async (values) => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: values.name,
        category: values.category || undefined,
        subCategory: values.subCategory || undefined,
        description: values.description,
        basePricePaise: rupeesToPaise(values.priceRupees),
        compareAtPricePaise: values.compareRupees ? rupeesToPaise(values.compareRupees) : 0,
        status: values.status,
        images,
        customizationConfig: {
          ...config,
          textFields: textFields
            .filter((tf) => tf.key && tf.label)
            .map((tf) => ({
              key: tf.key,
              label: tf.label,
              required: Boolean(tf.required),
              maxLength: Number(tf.maxLength) || 40,
            })),
        },
      };
      if (isEdit) await products.update(id, payload);
      else await products.create(payload);
      navigate('/products');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const filteredSubCats = useMemo(() => subCats, [subCats]);

  if (loading) return <div className="text-slate-400">Loading builder…</div>;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={isEdit ? 'Edit product' : 'New product'}
        subtitle="Define the product and exactly which customization panels + options it exposes."
        action={
          <button onClick={() => navigate('/products')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Back
          </button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basics */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Basics</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Name</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('name', { required: 'Name is required' })} />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Category</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('category')}>
                <option value="">—</option>
                {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Subcategory</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('subCategory')}>
                <option value="">—</option>
                {filteredSubCats.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Selling price (₹)</label>
              <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('priceRupees', { required: true, min: 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Original price / MRP (₹)</label>
              <input type="number" step="0.01" min="0" placeholder="optional — shows a struck-through price" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('compareRupees', { min: 0 })} />
              <p className="mt-1 text-xs text-slate-400">Leave blank if there's no discount. Must be higher than the selling price to show an offer.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('status')}>
                <option value="active">active</option>
                <option value="hidden">hidden</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Description</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('description')} />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-4 font-semibold">Images</h3>
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative">
                <img src={url} alt="" className="h-20 w-20 rounded border border-slate-200 object-cover" />
                <button type="button" onClick={() => removeImage(i)} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white">✕</button>
              </div>
            ))}
          </div>
          <div className="mt-4 max-w-md">
            <FileUpload label="Add image (upload or paste URL, then Add)" kind="image" folder="products" value={newImage} onChange={setNewImage} />
            <button type="button" onClick={addImage} className="mt-2 rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900">Add image</button>
          </div>
        </section>

        {/* Customization panels */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">Customization panels</h3>
          <p className="mb-4 text-sm text-slate-500">Enable a panel and pick which options it exposes.</p>
          <div className="space-y-4">
            {PANELS.map(({ panel, collKey, label, hasRequired, isIcons, metaFields }) => {
              const opts = allOptions[collKey] || [];
              const panelCfg = config[panel];
              return (
                <div key={panel} className={`rounded-lg border p-4 ${panelCfg.enabled ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 font-medium">
                      <input type="checkbox" checked={panelCfg.enabled} onChange={(e) => setPanel(panel, { enabled: e.target.checked })} />
                      {label}
                    </label>
                    <div className="flex items-center gap-4">
                      {(hasRequired || isIcons) && panelCfg.enabled && (
                        <label className="flex items-center gap-1 text-sm text-slate-600">
                          <input type="checkbox" checked={panelCfg.required} onChange={(e) => setPanel(panel, { required: e.target.checked })} />
                          required
                        </label>
                      )}
                      {isIcons && panelCfg.enabled && (
                        <label className="flex items-center gap-1 text-sm text-slate-600">
                          max
                          <input type="number" min="0" value={panelCfg.max} onChange={(e) => setPanel(panel, { max: Number(e.target.value) })} className="w-16 rounded border border-slate-300 px-2 py-1 text-sm" />
                        </label>
                      )}
                    </div>
                  </div>

                  {panelCfg.enabled && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {opts.length === 0 && <span className="text-xs text-slate-400">No {label.toLowerCase()} options exist yet — add one below.</span>}
                        {opts.map((o) => {
                          const checked = panelCfg.options.includes(String(o._id));
                          return (
                            <button
                              type="button"
                              key={o._id}
                              onClick={() => toggleOption(panel, String(o._id))}
                              className={`rounded-full border px-3 py-1 text-sm ${checked ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                              {o.meta?.hex && <span className="mr-1 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ background: o.meta.hex }} />}
                              {o.name}
                              {o.priceDeltaPaise > 0 && <span className={checked ? 'ml-1 text-indigo-100' : 'ml-1 text-slate-400'}>+₹{(o.priceDeltaPaise / 100).toFixed(0)}</span>}
                            </button>
                          );
                        })}
                      </div>
                      <InlineOptionCreator
                        collKey={collKey}
                        label={label}
                        metaFields={metaFields}
                        onCreated={(opt) => handleOptionCreated(panel, collKey, opt)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Text fields */}
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold">Text fields</h3>
            <button type="button" onClick={addTextField} className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900">+ Add field</button>
          </div>
          {textFields.length === 0 && <p className="text-sm text-slate-400">No text fields. Add ones like “familyName”, “subtitle”.</p>}
          <div className="space-y-3">
            {textFields.map((tf, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <input placeholder="key" value={tf.key} onChange={(e) => updateTextField(i, { key: e.target.value })} className="col-span-3 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <input placeholder="label" value={tf.label} onChange={(e) => updateTextField(i, { label: e.target.value })} className="col-span-4 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <input type="number" placeholder="max" value={tf.maxLength} onChange={(e) => updateTextField(i, { maxLength: e.target.value })} className="col-span-2 rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                <label className="col-span-2 flex items-center gap-1 text-sm text-slate-600">
                  <input type="checkbox" checked={tf.required} onChange={(e) => updateTextField(i, { required: e.target.checked })} />
                  req
                </label>
                <button type="button" onClick={() => removeTextField(i)} className="col-span-1 text-red-600">✕</button>
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/products')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
}
