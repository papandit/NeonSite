// Admin editor for integration credentials/config (Razorpay, SMTP, Gemini +
// prompt, Google Fonts). Saves to Settings.integrations, which OVERRIDES the
// server .env at runtime — so keys can be updated live from the admin without a
// redeploy. Secrets are write-only: shown as "saved", never echoed; a blank
// secret on save keeps the stored value.

import { useEffect, useState } from 'react';
import { settingsApi } from '../services/ops';
import { apiErrorMessage } from '../services/api';

const EMPTY = {
  razorpay: { keyId: '', keySecret: '' },
  smtp: { host: '', port: 587, user: '', pass: '', from: '' },
  gemini: { apiKey: '', model: '', prompt: '' },
  googleFonts: { apiKey: '' },
};

function Field({ label, value, onChange, type = 'text', placeholder, hint, textarea }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {textarea ? (
        <textarea rows={4} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
      ) : (
        <input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" autoComplete="off" />
      )}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function Card({ title, description, children }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      <div><h3 className="font-semibold text-slate-800">{title}</h3>{description && <p className="text-xs text-slate-400">{description}</p>}</div>
      {children}
    </section>
  );
}

export default function IntegrationsEditor() {
  const [it, setIt] = useState(EMPTY);
  const [secretsSet, setSecretsSet] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    settingsApi.get()
      .then((s) => {
        const i = s.integrations || {};
        setIt({
          razorpay: { keyId: i.razorpay?.keyId || '', keySecret: '' },
          smtp: { host: i.smtp?.host || '', port: i.smtp?.port || 587, user: i.smtp?.user || '', pass: '', from: i.smtp?.from || '' },
          gemini: { apiKey: '', model: i.gemini?.model || '', prompt: i.gemini?.prompt || '' },
          googleFonts: { apiKey: '' },
        });
        setSecretsSet(s.secretsSet || {});
      })
      .catch((e) => setError(apiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const set = (grp, key, v) => { setIt((s) => ({ ...s, [grp]: { ...s[grp], [key]: v } })); setSaved(false); };

  const onSave = async () => {
    setSaving(true); setSaved(false); setError(null);
    try {
      const res = await settingsApi.update({ integrations: it });
      setSecretsSet(res.secretsSet || {});
      // clear secret inputs (they're saved now)
      setIt((s) => ({ ...s, razorpay: { ...s.razorpay, keySecret: '' }, smtp: { ...s.smtp, pass: '' }, gemini: { ...s.gemini, apiKey: '' }, googleFonts: { apiKey: '' } }));
      setSaved(true);
    } catch (e) { setError(apiErrorMessage(e)); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="text-slate-400">Loading integrations…</div>;
  const secretPlaceholder = (k) => (secretsSet[k] ? '•••••••• saved — leave blank to keep' : 'not set');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Integrations</h2>
          <p className="text-xs text-slate-400">Keys &amp; config applied to the live site instantly. Blank secrets keep their saved value.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm font-medium text-green-600">Saved ✓</span>}
          <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save integrations'}</button>
        </div>
      </div>

      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <Card title="Razorpay" description="Live payments. Leave blank to run in mock/test mode.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Key ID" value={it.razorpay.keyId} onChange={(v) => set('razorpay', 'keyId', v)} placeholder="rzp_live_… / rzp_test_…" />
          <Field label="Key Secret" type="password" value={it.razorpay.keySecret} onChange={(v) => set('razorpay', 'keySecret', v)} placeholder={secretPlaceholder('razorpay.keySecret')} />
        </div>
      </Card>

      <Card title="SMTP (email)" description="Order confirmations & status emails. Blank = emails logged to console only.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Host" value={it.smtp.host} onChange={(v) => set('smtp', 'host', v)} placeholder="smtp.gmail.com" />
          <Field label="Port" type="number" value={it.smtp.port} onChange={(v) => set('smtp', 'port', Number(v) || 587)} />
          <Field label="User" value={it.smtp.user} onChange={(v) => set('smtp', 'user', v)} />
          <Field label="Password" type="password" value={it.smtp.pass} onChange={(v) => set('smtp', 'pass', v)} placeholder={secretPlaceholder('smtp.pass')} />
          <div className="sm:col-span-2"><Field label="From" value={it.smtp.from} onChange={(v) => set('smtp', 'from', v)} placeholder='NameCraft <no-reply@yourdomain.com>' /></div>
        </div>
      </Card>

      <Card title="Gemini (AI chatbot)" description="Powers the storefront chat widget. Blank = a canned fallback reply.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="API key" type="password" value={it.gemini.apiKey} onChange={(v) => set('gemini', 'apiKey', v)} placeholder={secretPlaceholder('gemini.apiKey')} />
          <Field label="Model" value={it.gemini.model} onChange={(v) => set('gemini', 'model', v)} placeholder="gemini-1.5-flash" />
        </div>
        <Field label="System prompt" textarea value={it.gemini.prompt} onChange={(v) => set('gemini', 'prompt', v)} placeholder="Leave blank to use the built-in store-assistant prompt." hint="Defines how the assistant behaves. Blank uses the default prompt." />
      </Card>

      <Card title="Google Fonts" description="Full font catalogue in the studios. Blank = the bundled ~200-font list.">
        <Field label="API key" type="password" value={it.googleFonts.apiKey} onChange={(v) => set('googleFonts', 'apiKey', v)} placeholder={secretPlaceholder('googleFonts.apiKey')} />
      </Card>

      <div className="flex justify-end">
        <button onClick={onSave} disabled={saving} className="rounded-full bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Saving…' : 'Save integrations'}</button>
      </div>
    </div>
  );
}
