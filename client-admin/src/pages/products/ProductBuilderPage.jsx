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
            priceRupees: paiseToRupees(product.basePricePaise),
            compareRupees: product.compareAtPricePaise ? paiseToRupees(product.compareAtPricePaise) : '',
            status: product.status,
          });
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

  const addImage = () => { if (newImage.trim()) { setImages((im) => [...im, newImage.trim()]); setNewImage(''); } };
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
