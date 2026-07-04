import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { settingsApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';
import { paiseToRupees, rupeesToPaise } from '../utils/money';
import PageHeader from '../components/PageHeader';
import FileUpload from '../components/FileUpload';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    settingsApi.get()
      .then((s) => {
        setLogoUrl(s.logoUrl || '');
        reset({
          storeName: s.storeName, supportEmail: s.supportEmail, supportPhone: s.supportPhone,
          invoicePrefix: s.invoicePrefix, gstRatePercent: s.gstRatePercent,
          flatRupees: paiseToRupees(s.shipping.flatPaise),
          freeAboveRupees: paiseToRupees(s.shipping.freeAbovePaise),
          instagram: s.socials?.instagram || '', facebook: s.socials?.facebook || '',
        });
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (v) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await settingsApi.update({
        storeName: v.storeName,
        logoUrl,
        supportEmail: v.supportEmail,
        supportPhone: v.supportPhone,
        invoicePrefix: v.invoicePrefix,
        gstRatePercent: Number(v.gstRatePercent),
        socials: { instagram: v.instagram, facebook: v.facebook },
        shipping: {
          flatPaise: rupeesToPaise(v.flatRupees),
          freeAbovePaise: rupeesToPaise(v.freeAboveRupees),
        },
      });
      setSaved(true);
    } catch (e) {
      setError(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading settings…</div>;

  const field = (name, label, type = 'text', props = {}) => (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <input type={type} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm" {...register(name)} {...props} />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Store info, GST, and shipping. GST flows into checkout tax." />

      {error && <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {saved && <div className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Settings saved.</div>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Store</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {field('storeName', 'Store name')}
            {field('invoicePrefix', 'Invoice prefix')}
            {field('supportEmail', 'Support email', 'email')}
            {field('supportPhone', 'Support phone')}
          </div>
          <FileUpload label="Logo" kind="image" folder="store" value={logoUrl} onChange={setLogoUrl} />
          <div className="grid gap-4 sm:grid-cols-2">
            {field('instagram', 'Instagram URL')}
            {field('facebook', 'Facebook URL')}
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Tax &amp; shipping</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            {field('gstRatePercent', 'GST rate (%)', 'number', { min: 0, max: 100, step: '0.01' })}
            {field('flatRupees', 'Flat shipping (₹)', 'number', { min: 0, step: '0.01' })}
            {field('freeAboveRupees', 'Free shipping above (₹)', 'number', { min: 0, step: '0.01' })}
          </div>
          <p className="text-xs text-slate-400">Orders at or above the free-shipping threshold ship free; the GST rate is applied to the taxable amount at checkout.</p>
        </section>

        <button type="submit" disabled={saving} className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
