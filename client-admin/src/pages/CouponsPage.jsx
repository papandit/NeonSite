import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { resource } from '../services/resourceApi';
import { apiErrorMessage } from '../services/api';
import { formatPaise, paiseToRupees, rupeesToPaise } from '../utils/money';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';

const coupons = resource('coupons');

export default function CouponsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const type = watch('type', 'percentage');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await coupons.list({ limit: 200 });
      setRows(data);
      setError(null);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing(null);
    reset({ code: '', type: 'percentage', percent: 10, valueRupees: 0, minRupees: 0, maxRupees: 0, expiresAt: '', usageLimit: 0, status: 'active' });
    setModalOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    reset({
      code: r.code, type: r.type, percent: r.percent || 0,
      valueRupees: paiseToRupees(r.valuePaise), minRupees: paiseToRupees(r.minSubtotalPaise), maxRupees: paiseToRupees(r.maxDiscountPaise),
      expiresAt: r.expiresAt ? r.expiresAt.slice(0, 10) : '', usageLimit: r.usageLimit || 0, status: r.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (v) => {
    setBusy(true);
    try {
      const payload = {
        code: v.code.toUpperCase().trim(),
        type: v.type,
        percent: v.type === 'percentage' ? Number(v.percent) : 0,
        valuePaise: v.type === 'flat' ? rupeesToPaise(v.valueRupees) : 0,
        minSubtotalPaise: rupeesToPaise(v.minRupees),
        maxDiscountPaise: rupeesToPaise(v.maxRupees),
        usageLimit: Number(v.usageLimit) || 0,
        status: v.status,
        expiresAt: v.expiresAt || null,
      };
      if (editing) await coupons.update(editing._id, payload);
      else await coupons.create(payload);
      setModalOpen(false);
      await load();
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const onDelete = async () => {
    setBusy(true);
    try { await coupons.remove(confirm._id); setConfirm(null); await load(); }
    catch (e) { setError(apiErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const columns = [
    { key: 'code', header: 'Code', render: (r) => <code className="font-medium text-slate-900">{r.code}</code> },
    { key: 'type', header: 'Type' },
    { key: 'value', header: 'Value', render: (r) => (r.type === 'flat' ? formatPaise(r.valuePaise) : `${r.percent}%`) },
    { key: 'min', header: 'Min order', render: (r) => (r.minSubtotalPaise ? formatPaise(r.minSubtotalPaise) : '—') },
    { key: 'usage', header: 'Used', render: (r) => `${r.used}/${r.usageLimit || '∞'}` },
    { key: 'expiry', header: 'Expires', render: (r) => (r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—') },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Discounts (paise-accurate, server-validated)." action={
        <button onClick={openCreate} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New coupon</button>
      } />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <DataTable columns={columns} rows={rows} loading={loading} empty="No coupons yet."
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => openEdit(row)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
            <button onClick={() => setConfirm(row)} className="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />

      <Modal open={modalOpen} title={editing ? 'Edit coupon' : 'New coupon'} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Code</label>
              <input className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase" {...register('code', { required: 'Required' })} />
              {errors.code && <p className="mt-1 text-xs text-red-600">{errors.code.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('type')}>
                <option value="percentage">percentage</option>
                <option value="flat">flat</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {type === 'percentage' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Percent (%)</label>
                  <input type="number" min="0" max="100" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('percent')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Max discount (₹, 0=none)</label>
                  <input type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('maxRupees')} />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700">Value (₹)</label>
                <input type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('valueRupees')} />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700">Min order (₹)</label>
              <input type="number" min="0" step="0.01" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('minRupees')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Expires</label>
              <input type="date" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('expiresAt')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Usage limit</label>
              <input type="number" min="0" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register('usageLimit')} />
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

      <ConfirmDialog open={Boolean(confirm)} message={`Delete coupon "${confirm?.code}"?`} onConfirm={onDelete} onCancel={() => setConfirm(null)} busy={busy} />
    </div>
  );
}
