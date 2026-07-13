// Product editor for the plain e-commerce store — a simple product (name,
// category, price/MRP, images, description, status). All customization lives in
// the Name Plate Studio and the Neon Studio, not here.

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { paiseToRupees, rupeesToPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import FileUpload from '../../components/FileUpload';

const products = resource('products');
const categoriesApi = resource('categories');
const subCategoriesApi = resource('subcategories');

export default function ProductBuilderPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [cats, setCats] = useState([]);
  const [subCats, setSubCats] = useState([]);
  const [images, setImages] = useState([]);
  const [newImage, setNewImage] = useState('');
  const [colors, setColors] = useState([]);
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#111827');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [catRes, subRes] = await Promise.all([
          categoriesApi.list({ limit: 200 }),
          subCategoriesApi.list({ limit: 200 }),
        ]);
        setCats(catRes.data);
        setSubCats(subRes.data);

        if (isEdit) {
          const product = await products.get(id);
          reset({
            name: product.name,
            category: product.category?._id || '',
            subCategory: product.subCategory?._id || '',
            description: product.description || '',
            highlights: product.highlights || '',
            material: product.material || '',
            dimensions: product.dimensions || '',
            whatsIncluded: product.whatsIncluded || '',
            careHandling: product.careHandling || '',
            priceRupees: paiseToRupees(product.basePricePaise),
            compareRupees: product.compareAtPricePaise ? paiseToRupees(product.compareAtPricePaise) : '',
            status: product.status,
          });
          setImages(product.images || []);
          setColors(product.colors || []);
        } else {
          reset({ name: '', category: '', subCategory: '', description: '', highlights: '', material: '', dimensions: '', whatsIncluded: '', careHandling: '', priceRupees: 0, compareRupees: '', status: 'active' });
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

  const addImage = () => { if (newImage.trim()) { setImages((im) => [...im, newImage.trim()]); setNewImage(''); } };
  const removeImage = (i) => setImages((im) => im.filter((_, idx) => idx !== i));
  const makeMainImage = (i) => setImages((im) => (i <= 0 ? im : [im[i], ...im.filter((_, idx) => idx !== i)]));

  const addColor = () => {
    const hex = colorHex.trim();
    if (!hex) return;
    if (colors.some((c) => c.hex.toLowerCase() === hex.toLowerCase())) { setColorName(''); return; }
    setColors((cs) => [...cs, { name: colorName.trim(), hex }]);
    setColorName('');
  };
  const removeColor = (i) => setColors((cs) => cs.filter((_, idx) => idx !== i));

  const onSubmit = async (values) => {
    setBusy(true);
    setError(null);
    try {
      const payload = {
        name: values.name,
        category: values.category || undefined,
        subCategory: values.subCategory || undefined,
        description: values.description,
        highlights: values.highlights,
        material: values.material,
        dimensions: values.dimensions,
        whatsIncluded: values.whatsIncluded,
        careHandling: values.careHandling,
        basePricePaise: rupeesToPaise(values.priceRupees),
        compareAtPricePaise: values.compareRupees ? rupeesToPaise(values.compareRupees) : 0,
        status: values.status,
        images,
        colors,
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

  if (loading) return <div className="text-slate-400">Loading…</div>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit product' : 'New product'}
        subtitle="A simple store product. For customizable products use the Name Plate Studio."
        action={<button onClick={() => navigate('/products')} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back</button>}
      />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {subCats.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Selling price (₹)</label>
              <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('priceRupees', { required: true, min: 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Original price / MRP (₹)</label>
              <input type="number" step="0.01" min="0" placeholder="optional — shows a struck-through price" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('compareRupees', { min: 0 })} />
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

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">Images</h3>
          <p className="mb-4 text-xs text-slate-400">Add as many as you like — the first image is the main one shown on the card and gallery. Uploading a file adds it automatically.</p>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={`${url}-${i}`} className="group relative">
                  <img src={url} alt="" className={`h-24 w-24 rounded-lg border object-cover ${i === 0 ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'}`} />
                  {i === 0 && <span className="absolute left-1 top-1 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>}
                  <button type="button" onClick={() => removeImage(i)} className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-red-600 text-xs text-white shadow" title="Remove">✕</button>
                  {i > 0 && (
                    <button type="button" onClick={() => makeMainImage(i)} className="absolute inset-x-1 bottom-1 rounded bg-black/60 py-0.5 text-[10px] font-medium text-white opacity-0 transition group-hover:opacity-100" title="Set as main image">Set main</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 max-w-md">
            <FileUpload
              label="Add image (upload — added automatically, or paste a URL then Add)"
              kind="image"
              folder="products"
              value={newImage}
              onChange={setNewImage}
              onUploaded={(url) => { setImages((im) => [...im, url]); setNewImage(''); }}
            />
            <button type="button" onClick={addImage} disabled={!newImage.trim()} className="mt-2 rounded-full bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-40">Add pasted URL</button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">Colours</h3>
          <p className="mb-4 text-xs text-slate-400">Optional. Colours the buyer can choose on the product page — the chosen colour is saved with the order. Shown as swatches on the product card.</p>
          {colors.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {colors.map((c, i) => (
                <span key={`${c.hex}-${i}`} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-1.5 pr-2 text-sm">
                  <span className="inline-block h-5 w-5 rounded-full border border-black/10" style={{ background: c.hex }} />
                  <span className="text-slate-700">{c.name || c.hex}</span>
                  <button type="button" onClick={() => removeColor(i)} className="text-slate-400 hover:text-red-600" title="Remove">✕</button>
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500">Swatch</label>
              <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="mt-1 h-9 w-12 rounded border border-slate-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Hex</label>
              <input value={colorHex} onChange={(e) => setColorHex(e.target.value)} placeholder="#RRGGBB" className="mt-1 w-28 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Name</label>
              <input value={colorName} onChange={(e) => setColorName(e.target.value)} placeholder="e.g. Midnight Black" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColor(); } }} className="mt-1 w-48 rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <button type="button" onClick={addColor} className="rounded-full bg-slate-800 px-3 py-2 text-sm font-medium text-white hover:bg-slate-900">Add colour</button>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="mb-1 font-semibold">Product details</h3>
          <p className="mb-4 text-xs text-slate-400">Shown as expandable sections on the product page. Put one point per line — each line becomes a bullet.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700">Highlights <span className="font-normal text-slate-400">(short points near the price)</span></label>
              <textarea rows={4} placeholder={'Personalized with your name & title\nMade with durable acrylic & wood\nIncludes 12V/1 Amp adaptor'} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('highlights')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Material</label>
              <input placeholder="Acrylic, Wood" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('material')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Dimensions</label>
              <input placeholder="23cm x 5cm x 6cm" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('dimensions')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">What's included <span className="font-normal text-slate-400">(one per line)</span></label>
              <textarea rows={3} placeholder={'1 x Desk Name Plate\n1 x 12V / 1 Amp Adaptor'} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('whatsIncluded')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Care &amp; handling <span className="font-normal text-slate-400">(one per line)</span></label>
              <textarea rows={3} placeholder={'Wipe it with a damp cloth to clean.\nUse it in covered indoor spaces.'} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('careHandling')} />
            </div>
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
