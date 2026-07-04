import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import FileUpload from '../../components/FileUpload';

const subcategories = resource('subcategories');
const categoriesApi = resource('categories');

export default function SubCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort: 'sortOrder name', limit: 200 };
      if (filterCat) params.category = filterCat;
      const [{ data }, catRes] = await Promise.all([
        subcategories.list(params),
        categoriesApi.list({ limit: 200 }),
      ]);
      setRows(data);
      setCats(catRes.data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [filterCat]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setBanner('');
    reset({ name: '', category: filterCat || cats[0]?._id || '', sortOrder: 0, status: 'active' });
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setBanner(row.banner || '');
    reset({
      name: row.name,
      category: row.category?._id || row.category,
      sortOrder: row.sortOrder,
      status: row.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const payload = {
        name: values.name,
        category: values.category,
        sortOrder: Number(values.sortOrder) || 0,
        status: values.status,
        banner,
      };
      if (editing) await subcategories.update(editing._id, payload);
      else await subcategories.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (row) => {
    try { await subcategories.toggle(row._id); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
  };
  const onDelete = async () => {
    setBusy(true);
    try { await subcategories.remove(confirm._id); setConfirm(null); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'category', header: 'Parent', render: (r) => r.category?.name || '—' },
    { key: 'slug', header: 'Slug', render: (r) => <code className="text-xs text-slate-500">{r.slug}</code> },
    { key: 'sortOrder', header: 'Sort' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Subcategories"
        subtitle="Grouped under a parent category."
        action={
          <button onClick={openCreate} disabled={cats.length === 0} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            + New subcategory
          </button>
        }
      />

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-slate-600">Filter by category:</label>
        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">
          <option value="">All</option>
          {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        empty="No subcategories yet."
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => openEdit(row)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
            <button onClick={() => onToggle(row)} className="text-sm text-slate-500 hover:underline">
              {row.status === 'active' ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => setConfirm(row)} className="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal open={modalOpen} title={editing ? 'Edit subcategory' : 'New subcategory'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Parent category</label>
            <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('category', { required: 'Category is required' })}>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Sort order</label>
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

          <FileUpload label="Banner" kind="image" folder="banners" value={banner} onChange={setBanner} />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        message={`Delete subcategory "${confirm?.name}"?`}
        onConfirm={onDelete}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </div>
  );
}
