// One page, reused for every option collection (materials, sizes, colors,
// fonts, borders, backgrounds, mounts, icons). Renders the collection's
// specific meta fields, enters price in rupees, stores integer paise.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { OPTION_BY_KEY } from '../../config/optionCollections';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import FileUpload from '../../components/FileUpload';

export default function OptionCrudPage() {
  const { key } = useParams();
  const collection = OPTION_BY_KEY[key];
  const apiRes = useMemo(() => resource(key), [key]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState({});

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiRes.list({ sort: 'name', limit: 200 });
      setRows(data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apiRes]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    setMeta({});
    reset({ name: '', priceRupees: 0, status: 'active' });
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setMeta(row.meta || {});
    reset({
      name: row.name,
      priceRupees: paiseToRupees(row.priceDeltaPaise),
      status: row.status,
    });
    setModalOpen(true);
  };

  const setMetaField = (k, v) => setMeta((m) => ({ ...m, [k]: v }));

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const payload = {
        name: values.name,
        priceDeltaPaise: rupeesToPaise(values.priceRupees), // rupees -> integer paise
        status: values.status,
        meta,
      };
      if (editing) await apiRes.update(editing._id, payload);
      else await apiRes.create(payload);
      setModalOpen(false);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const onToggle = async (row) => {
    try { await apiRes.toggle(row._id); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
  };
  const onDelete = async () => {
    setBusy(true);
    try { await apiRes.remove(confirm._id); setConfirm(null); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  if (!collection) {
    return <div className="text-red-600">Unknown option collection: {key}</div>;
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (r) => (
        <div className="flex items-center gap-2">
          {r.meta?.hex && (
            <span className="inline-block h-4 w-4 rounded-full border border-slate-200" style={{ background: r.meta.hex }} />
          )}
          <span className="font-medium text-slate-900">{r.name}</span>
        </div>
      ),
    },
    ...collection.metaFields
      .filter((f) => f.input !== 'file')
      .map((f) => ({
        key: `meta_${f.key}`,
        header: f.label,
        render: (r) => (r.meta?.[f.key] ?? '—'),
      })),
    { key: 'price', header: 'Price delta', render: (r) => formatPaise(r.priceDeltaPaise) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title={collection.label}
        subtitle="Prices are entered in rupees and stored as integer paise."
        action={
          <button onClick={openCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            + New {collection.label.replace(/s$/, '').toLowerCase()}
          </button>
        }
      />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        empty={`No ${collection.label.toLowerCase()} yet.`}
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

      <Modal open={modalOpen} title={`${editing ? 'Edit' : 'New'} ${collection.label.replace(/s$/, '')}`} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Price delta (₹)</label>
              <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('priceRupees', { required: true, min: 0 })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('status')}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
          </div>

          {collection.metaFields.length > 0 && (
            <div className="space-y-4 rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">Details</p>
              {collection.metaFields.map((f) => {
                if (f.input === 'file') {
                  return (
                    <FileUpload
                      key={f.key}
                      label={f.label}
                      kind={f.kind}
                      value={meta[f.key] || ''}
                      onChange={(v) => setMetaField(f.key, v)}
                    />
                  );
                }
                if (f.input === 'color') {
                  return (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-slate-700">{f.label}</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input type="color" value={meta[f.key] || '#000000'} onChange={(e) => setMetaField(f.key, e.target.value)} className="h-9 w-12 rounded border border-slate-300" />
                        <input type="text" value={meta[f.key] || ''} onChange={(e) => setMetaField(f.key, e.target.value)} placeholder="#RRGGBB" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-700">{f.label}</label>
                    <input
                      type={f.input === 'number' ? 'number' : 'text'}
                      value={meta[f.key] ?? ''}
                      onChange={(e) => setMetaField(f.key, f.input === 'number' ? Number(e.target.value) : e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                );
              })}
            </div>
          )}

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
        message={`Delete "${confirm?.name}"?`}
        onConfirm={onDelete}
        onCancel={() => setConfirm(null)}
        busy={busy}
      />
    </div>
  );
}
