import { useEffect, useState } from 'react';
import { uploadAsset, getAdminMeta } from '../services/uploads';
import { apiErrorMessage } from '../services/api';

const ACCEPT = {
  image: 'image/png,image/jpeg,image/webp,image/gif',
  font: '.ttf,.otf,.woff,.woff2',
  svg: 'image/svg+xml,.svg',
};

// A friendly name derived from a filename: "shree-yantra.svg" -> "Shree Yantra".
const nameFromFile = (filename = '') =>
  filename
    .replace(/\.[^./\\]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Server-signed upload with a "paste a URL" fallback (works even without
// Cloudinary configured — handy for local testing).
export default function FileUpload({
  value = '',
  onChange,
  onUploaded,
  kind = 'image',
  folder,
  label = 'File',
  preview = true,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [uploadsEnabled, setUploadsEnabled] = useState(true);

  useEffect(() => {
    getAdminMeta()
      .then((m) => setUploadsEnabled(Boolean(m.uploadsEnabled)))
      .catch(() => setUploadsEnabled(false));
  }, []);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await uploadAsset(kind, file, { folder });
      onChange(res.url);
      onUploaded?.(res.url, nameFromFile(file.name)); // url + a name suggested from the filename
    } catch (err) {
      setError(apiErrorMessage(err, 'Upload failed'));
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const showImagePreview = preview && value && (kind === 'image' || kind === 'svg');

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1 flex items-center gap-3">
        <input
          type="file"
          accept={ACCEPT[kind]}
          onChange={onFile}
          disabled={busy}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {busy && <span className="text-xs text-slate-400">Uploading…</span>}
      </div>

      {!uploadsEnabled && (
        <p className="mt-1 text-xs text-amber-600">
          Cloudinary isn’t configured — paste a URL below instead.
        </p>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste a URL"
        className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {showImagePreview && (
        <img
          src={value}
          alt="preview"
          className="mt-2 h-20 w-auto rounded border border-slate-200 object-contain"
        />
      )}
      {preview && value && kind === 'font' && (
        <p className="mt-2 truncate text-xs text-slate-500">{value}</p>
      )}
    </div>
  );
}
