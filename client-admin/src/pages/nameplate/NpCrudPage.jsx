// Generic CRUD page reused for every Name Plate Studio simple collection
// (categories, fonts, colors, elements, icons, shapes, materials, sizes,
// backgrounds). Config-driven from nameplateCollections; talks to
// /api/admin/nameplate/<key>. Price entered in rupees, stored as integer paise.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { NP_BY_KEY } from '../../config/nameplateCollections';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import StatusBadge from '../../components/StatusBadge';
import FileUpload from '../../components/FileUpload';
import FontLibraryModal from '../../components/FontLibraryModal';

function Thumb({ row }) {
  const img = row.meta?.image || row.meta?.thumbnail || row.meta?.svg || row.imageUrl;
  if (row.meta?.family) return <span className="text-2xl leading-none text-slate-700" style={{ fontFamily: row.meta.family }}>Ag</span>;
  if (row.meta?.hex) return <span className="inline-block h-6 w-6 rounded-full border border-slate-200" style={{ background: row.meta.hex }} />;
  if (img) return <img src={img} alt="" className="h-8 w-8 rounded object-cover" />;
  return <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">—</div>;
}

export default function NpCrudPage() {
  const { key } = useParams();
  const collection = NP_BY_KEY[key];
  const apiRes = useMemo(() => resource(`nameplate/${key}`), [key]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [fontLibOpen, setFontLibOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState({});

  const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm();

  // Auto-fill the Name from an uploaded file when the admin hasn't typed one.
  const suggestName = (suggested) => { if (suggested && !getValues('name')?.trim()) setValue('name', suggested, { shouldValidate: true }); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiRes.list({ sort: 'sortOrder name', limit: 200 });
      setRows(data);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [apiRes]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setMeta({}); reset({ name: '', priceRupees: 0, status: 'active' }); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setMeta(row.meta || {});
    reset({ name: row.name, priceRupees: paiseToRupees(row.priceDeltaPaise), status: row.status });
    setModalOpen(true);
  };
  const setMetaField = (k, v) => setMeta((m) => ({ ...m, [k]: v }));

  const onSubmit = async (values) => {
    setBusy(true);
    try {
      const payload = {
        name: values.name,
        priceDeltaPaise: rupeesToPaise(values.priceRupees || 0),
        status: values.status,
        meta,
        imageUrl: meta.image || meta.thumbnail || '',
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

  // Fonts only: add the picked library families (each renders in its own type).
  const addFromLibrary = async (families) => {
    setBusy(true);
    try {
      const existing = new Set(rows.map((r) => (r.meta?.family || r.name)));
      for (const fam of families) {
        if (existing.has(fam)) continue;
        await apiRes.create({ name: fam, status: 'active', priceDeltaPaise: 0, meta: { family: fam } });
      }
      await load();
      setFontLibOpen(false);
    } catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  const onToggle = async (row) => { try { await apiRes.toggle(row._id); await load(); } catch (err) { setError(apiErrorMessage(err)); } };
  const onDelete = async () => {
    setBusy(true);
    try { await apiRes.remove(confirm._id); setConfirm(null); await load(); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setBusy(false); }
  };

  if (!collection) return <div className="text-red-600">Unknown collection: {key}</div>;

  const columns = [
    { key: 'thumb', header: '', render: (r) => <Thumb row={r} /> },
    { key: 'name', header: 'Name', render: (r) => (
      <span className={r.meta?.family ? 'text-lg text-slate-900' : 'font-medium text-slate-900'} style={r.meta?.family ? { fontFamily: r.meta.family } : undefined}>{r.name}</span>
    ) },
    ...collection.metaFields.filter((f) => f.input !== 'file' && f.input !== 'color').map((f) => ({
      key: `meta_${f.key}`, header: f.label, render: (r) => (r.meta?.[f.key] ?? '—'),
    })),
    { key: 'price', header: 'Price', render: (r) => formatPaise(r.priceDeltaPaise) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  const single = collection.label.replace(/s$/, '');

  return (
    <div>
      <PageHeader
        title={`Name Plate · ${collection.label}`}
        subtitle="Prices entered in rupees, stored as integer paise. Everything here is exposed to templates."
        action={
          <div className="flex gap-2">
            {key === 'fonts' && (
              <button onClick={() => setFontLibOpen(true)} className="rounded-full border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50">✨ Add from library</button>
            )}
            <button onClick={openCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New {single.toLowerCase()}</button>
          </div>
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
            <button onClick={() => onToggle(row)} className="text-sm text-slate-500 hover:underline">{row.status === 'active' ? 'Disable' : 'Enable'}</button>
            <button onClick={() => setConfirm(row)} className="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal open={modalOpen} title={`${editing ? 'Edit' : 'New'} ${single}`} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('name', { required: 'Name is required' })} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Price / extra (₹)</label>
              <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('priceRupees', { min: 0 })} />
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
                  return <FileUpload key={f.key} label={f.label} kind={f.kind} folder={`nameplate/${key}`} value={meta[f.key] || ''} onChange={(v) => setMetaField(f.key, v)} onUploaded={(_url, suggested) => suggestName(suggested)} />;
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
                    <input type={f.input === 'number' ? 'number' : 'text'} value={meta[f.key] ?? ''} onChange={(e) => setMetaField(f.key, f.input === 'number' ? Number(e.target.value) : e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(confirm)} message={`Delete "${confirm?.name}"?`} onConfirm={onDelete} onCancel={() => setConfirm(null)} busy={busy} />

      {key === 'fonts' && (
        <FontLibraryModal
          open={fontLibOpen}
          onClose={() => setFontLibOpen(false)}
          existingFamilies={new Set(rows.map((r) => r.meta?.family || r.name))}
          onAddMany={addFromLibrary}
          busy={busy}
        />
      )}
    </div>
  );
}
