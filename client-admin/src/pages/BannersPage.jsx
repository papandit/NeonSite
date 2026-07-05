import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { resource } from '../services/resourceApi';
import { apiErrorMessage } from '../services/api';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import FileUpload from '../components/FileUpload';

const banners = resource('banners');
const PLACEMENTS = ['home_hero', 'home_strip', 'promo'];

export default function BannersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await banners.list({ limit: 200 }); setRows(data); setError(null); }
    catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setImageUrl(''); reset({ title: '', link: '', placement: 'home_hero', sortOrder: 0, status: 'active' }); setModalOpen(true); };
  const openEdit = (r) => { setEditing(r); setImageUrl(r.imageUrl || ''); reset({ title: r.title, link: r.link, placement: r.placement, sortOrder: r.sortOrder, status: r.status }); setModalOpen(true); };

  const onSubmit = async (v) => {
    setBusy(true);
    try {
      const payload = { ...v, sortOrder: Number(v.sortOrder) || 0, imageUrl };
      if (editing) await banners.update(editing._id, payload);
      else await banners.create(payload);
      setModalOpen(false);
      await load();
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const onDelete = async () => {
    setBusy(true);
    try { await banners.remove(confirm._id); setConfirm(null); await load(); }
    catch (e) { setError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const columns = [
    { key: 'image', header: 'Image', render: (r) => r.imageUrl ? <img src={r.imageUrl} alt="" className="h-8 w-14 rounded object-cover" /> : <span className="text-slate-300">—</span> },
    { key: 'title', header: 'Title', render: (r) => <span className="font-medium text-slate-900">{r.title}</span> },
    { key: 'placement', header: 'Placement' },
    { key: 'sortOrder', header: 'Sort' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Banners" subtitle="Storefront promotional banners." action={
        <button onClick={openCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New banner</button>
      } />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable columns={columns} rows={rows} loading={loading} empty="No banners yet."
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => openEdit(row)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
            <button onClick={() => setConfirm(row)} className="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal open={modalOpen} title={editing ? 'Edit banner' : 'New banner'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('title', { required: 'Required' })} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>
          <FileUpload label="Image" kind="image" folder="banners" value={imageUrl} onChange={setImageUrl} />
          <div>
            <label className="block text-sm font-medium text-slate-700">Link (optional)</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('link')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Placement</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('placement')}>
                {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Sort</label>
              <input type="number" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('sortOrder')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('status')}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} message={`Delete banner "${confirm?.title}"?`} onConfirm={onDelete} onCancel={() => setConfirm(null)} busy={busy} />
    </div>
  );
}
