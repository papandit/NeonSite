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

const categories = resource('categories');

export default function CategoriesPage() {
  const [rows, setRows] = useState([]);
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
      const { data } = await categories.list({ sort: 'sortOrder name', limit: 200 });
      setRows(data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setBanner('');
    reset({ name: '', sortOrder: 0, status: 'active' });
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setBanner(row.banner || '');
    reset({ name: row.name, sortOrder: row.sortOrder, status: row.status });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const payload = {
        name: values.name,
        sortOrder: Number(values.sortOrder) || 0,
        status: values.status,
        banner,
      };
      if (editing) await categories.update(editing._id, payload);
      else await categories.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (row) => {
    try { await categories.toggle(row._id); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
  };

  const onDelete = async () => {
    setBusy(true);
    try { await categories.remove(confirm._id); setConfirm(null); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const columns = [
    {
      key: 'banner',
      header: 'Banner',
      render: (r) =>
        r.banner ? (
          <img src={r.banner} alt="" className="h-8 w-12 rounded object-cover" />
        ) : (
          <span className="text-slate-300">—</span>
        ),
    },
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'slug', header: 'Slug', render: (r) => <code className="text-xs text-slate-500">{r.slug}</code> },
    { key: 'sortOrder', header: 'Sort' },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Top-level catalog categories."
        action={
          <button onClick={openCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + New category
          </button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        empty="No categories yet."
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

      <Modal open={modalOpen} title={editing ? 'Edit category' : 'New category'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
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
            <button type="submit" disabled={busy} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        message={`Delete category "${confirm?.name}"? This cannot be undone.`}
        onConfirm={onDelete}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </div>
  );
}
