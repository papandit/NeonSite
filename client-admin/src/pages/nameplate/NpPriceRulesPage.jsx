// Name Plate Studio price rules. Money entered in rupees, stored as paise.

import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { apiErrorMessage } from '../../services/api';
import { paiseToRupees, rupeesToPaise } from '../../utils/money';
import PageHeader from '../../components/PageHeader';

export default function NpPriceRulesPage() {
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/nameplate/price-rules')
      .then((r) => setRules(r.data.data))
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const setPaise = (k, rupees) => setRules((r) => ({ ...r, [k]: rupeesToPaise(rupees || 0) }));
  const set = (k, v) => setRules((r) => ({ ...r, [k]: v }));

  const onSave = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      await api.put('/admin/nameplate/price-rules', rules);
      setSaved(true);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-slate-400">Loading…</div>;
  if (!rules) return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;

  const money = (label, key, hint) => (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input type="number" step="0.01" min="0" value={paiseToRupees(rules[key] || 0)} onChange={(e) => setPaise(key, e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="Name Plate · Price Rules" subtitle="How the final price is computed from characters and premium options." />
      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Price rules saved.</div>}

      <div className="space-y-6">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Characters</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {money('Extra character price (₹)', 'extraCharPricePaise', 'Charged per character beyond the free allowance.')}
            <div>
              <label className="block text-sm font-medium text-slate-700">Free characters</label>
              <input type="number" min="0" value={rules.freeCharacters} onChange={(e) => set('freeCharacters', Number(e.target.value))} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Premium surcharges</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {money('Premium font (₹)', 'premiumFontPricePaise')}
            {money('Premium colour (₹)', 'premiumColorPricePaise')}
            {money('Premium element (₹)', 'premiumElementPricePaise')}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={rules.applyOptionDeltas} onChange={(e) => set('applyOptionDeltas', e.target.checked)} />
            Also add each option's own price (material, size, colour, etc.)
          </label>
        </section>

        <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save price rules'}
        </button>
      </div>
    </div>
  );
}
