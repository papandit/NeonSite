// Name Plate templates list. Create/edit opens the template editor.

import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { resource } from '../../services/resourceApi';
import { apiErrorMessage } from '../../services/api';
import { formatPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';

const templates = resource('nameplate/templates');

export default function NpTemplatesPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await templates.list({ limit: 200 }); setRows(data); setError(null); }
    catch (err) { setError(apiErrorMessage(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const onToggle = async (row) => { try { await templates.toggle(row._id); await load(); } catch (e) { setError(apiErrorMessage(e)); } };
  const onDelete = async () => {
    setBusy(true);
    try { await templates.remove(confirm._id); setConfirm(null); await load(); }
    catch (e) { setError(apiErrorMessage(e)); } finally { setBusy(false); }
  };

  const columns = [
    { key: 'img', header: '', render: (r) => (r.previewImageUrl || r.basePlateImageUrl) ? <img src={r.previewImageUrl || r.basePlateImageUrl} alt="" className="h-10 w-14 rounded object-cover" /> : <div className="flex h-10 w-14 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">—</div> },
    { key: 'name', header: 'Template', render: (r) => <span className="font-medium text-slate-900">{r.name}</span> },
    { key: 'category', header: 'Category', render: (r) => r.category?.name || '—' },
    { key: 'fields', header: 'Text fields', render: (r) => <span className="text-xs text-slate-500">{(r.textFields || []).length}</span> },
    { key: 'price', header: 'Base price', render: (r) => formatPaise(r.basePricePaise) },
    { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Name Plate · Templates"
        subtitle="Each template defines the base plate, the dynamic text fields and which options customers can use."
        action={<button onClick={() => navigate('/nameplate/templates/new')} className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New template</button>}
      />
      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <DataTable
        columns={columns} rows={rows} loading={loading} empty="No templates yet."
        actions={(row) => (
          <div className="flex justify-end gap-2">
            <button onClick={() => navigate(`/nameplate/templates/${row._id}`)} className="text-sm font-medium text-indigo-600 hover:underline">Edit</button>
            <button onClick={() => onToggle(row)} className="text-sm text-slate-500 hover:underline">{row.status === 'active' ? 'Hide' : 'Publish'}</button>
            <button onClick={() => setConfirm(row)} className="text-sm text-red-600 hover:underline">Delete</button>
          </div>
        )}
      />
      <ConfirmDialog open={Boolean(confirm)} message={`Delete template "${confirm?.name}"?`} onConfirm={onDelete} onCancel={() => setConfirm(null)} busy={busy} />
    </div>
  );
}
