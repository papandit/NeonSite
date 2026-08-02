import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { getProductReviews, createReview, deleteReview, uploadReviewMedia } from '../services/catalog';
import { selectIsAuthenticated } from '../store/authSlice';
import { apiErrorMessage } from '../services/api';
import Rating from './Rating';

// Interactive, animated 5-star input.
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="mt-1 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <motion.button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            whileHover={{ scale: 1.25, rotate: -6 }}
            whileTap={{ scale: 0.85 }}
            animate={{ scale: active ? 1.08 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            className={`text-3xl leading-none ${active ? 'text-amber-400' : 'text-gray-300'}`}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </motion.button>
        );
      })}
      <span className="ml-2 text-sm font-medium text-gray-500">{value}/5</span>
    </div>
  );
}

function Avatar({ name }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
      {(name || 'C').charAt(0).toUpperCase()}
    </span>
  );
}

// Mirrors server/src/middleware/upload.js — the server is still the authority,
// this just fails fast so nobody waits on an upload that will be rejected.
const MAX_FILES = 4;
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_MB = 15;
const ACCEPT = 'image/png,image/jpeg,image/webp,video/mp4,video/quicktime,video/webm';

function checkFiles(files) {
  if (files.length > MAX_FILES) return `Up to ${MAX_FILES} attachments.`;
  for (const f of files) {
    const isVideo = f.type.startsWith('video/');
    const maxMb = isVideo ? MAX_VIDEO_MB : MAX_IMAGE_MB;
    if (f.size > maxMb * 1024 * 1024) {
      return `"${f.name}" is too large — ${isVideo ? 'videos' : 'photos'} must be under ${maxMb}MB.`;
    }
  }
  return null;
}

// How many reviews show before "Show all" — enough to judge the product
// without the page becoming a wall of text.
const PREVIEW_COUNT = 3;

// The 5..1 distribution, always all five rows so an empty band reads as
// "nobody gave this 2 stars" rather than silently vanishing.
function RatingBars({ reviews }) {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    n: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  return (
    <div className="space-y-1.5">
      {counts.map(({ star, n }) => (
        <div key={star} className="flex items-center gap-2 text-xs text-gray-500">
          <span className="w-8 shrink-0 tabular-nums">{star}★</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
            <motion.span
              className="block h-full rounded-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: total ? `${(n / total) * 100}%` : 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </span>
          <span className="w-6 shrink-0 text-right tabular-nums">{n}</span>
        </div>
      ))}
    </div>
  );
}

export default function Reviews({ productId, slug }) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [writing, setWriting] = useState(false);

  const loadReviews = () =>
    getProductReviews(slug).then(setReviews).catch(() => setReviews([]));

  useEffect(() => {
    setLoading(true);
    loadReviews().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      // Upload attachments first so the review is only written once its media
      // is safely stored.
      const media = files.length ? await uploadReviewMedia(files) : [];
      await createReview({ productId, rating: Number(form.rating), comment: form.comment, media });
      setForm({ rating: 5, comment: '' });
      setFiles([]);
      setMessage('Thanks! Your review is now live. 🎉');
      setWriting(false); // collapse back so the list is what you land on
      await loadReviews(); // show it immediately
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    setRemovingId(id);
    setError(null);
    try {
      await deleteReview(id);
      setMessage('Review removed.');
      await loadReviews();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not remove review'));
    } finally {
      setRemovingId(null);
    }
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const shown = showAll ? reviews : reviews.slice(0, PREVIEW_COUNT);
  const hidden = reviews.length - shown.length;

  return (
    <div>
      <h2 className="text-xl font-bold">Reviews</h2>

      {/* Summary — score on the left, the full 5..1 spread on the right */}
      {reviews.length > 0 && (
        <div className="mt-4 grid gap-6 rounded-xl border border-gray-200 bg-white p-5 sm:grid-cols-[auto_1fr] sm:gap-10">
          <div className="text-center sm:text-left">
            <div className="font-display text-4xl font-semibold text-gray-900">{avg}</div>
            <div className="mt-1 flex justify-center sm:justify-start"><Rating value={Number(avg)} /></div>
            <div className="mt-1 text-xs text-gray-500">
              {reviews.length} review{reviews.length > 1 ? 's' : ''}
            </div>
          </div>
          <RatingBars reviews={reviews} />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          shown.map((r) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                <Avatar name={r.userNameSnapshot} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-gray-900">
                      {r.userNameSnapshot || 'Customer'}
                      {r.mine && <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">You</span>}
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                      {r.mine && (
                        <button
                          type="button"
                          onClick={() => remove(r._id)}
                          disabled={removingId === r._id}
                          className="text-xs font-medium text-red-600 transition hover:underline disabled:opacity-50"
                        >
                          {removingId === r._id ? 'Removing…' : 'Remove'}
                        </button>
                      )}
                    </span>
                  </div>
                  <div className="mt-0.5"><Rating value={r.rating} /></div>
                  {r.title && <div className="mt-1 font-medium text-gray-900">{r.title}</div>}
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                  {(r.media || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.media.map((m, i) => (m.type === 'video' ? (
                        <video
                          key={i}
                          src={m.url}
                          controls
                          preload="metadata"
                          className="h-28 w-40 rounded-lg border border-gray-200 bg-black object-cover"
                        />
                      ) : (
                        <a key={i} href={m.url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={m.url}
                            alt=""
                            loading="lazy"
                            className="h-28 w-28 rounded-lg border border-gray-200 object-cover transition hover:opacity-90"
                          />
                        </a>
                      )))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Only the first few show; the rest are one click away rather than an
          endless column of cards. */}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-4 w-full rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-400 hover:text-indigo-700"
        >
          Show all {reviews.length} reviews
        </button>
      )}
      {showAll && reviews.length > PREVIEW_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll(false)}
          className="mt-4 w-full rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-indigo-400 hover:text-indigo-700"
        >
          Show fewer
        </button>
      )}

      {/* Write a review — its own section, collapsed until asked for, so the
          form doesn't sit open under every product page. */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Write a review</h3>
          {isAuthed && (
            <button
              type="button"
              onClick={() => { setWriting((w) => !w); setMessage(null); setError(null); }}
              className="rounded-full bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {writing ? 'Cancel' : 'Write a review'}
            </button>
          )}
        </div>
        {message && !writing && <div className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
        {!isAuthed ? (
          <p className="mt-2 text-sm text-gray-500">
            Please <Link to="/login" className="text-indigo-600 hover:underline">sign in</Link> to write a review.
          </p>
        ) : !writing ? (
          <p className="mt-2 text-sm text-gray-500">Bought this? Tell other customers how it turned out.</p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Your rating</label>
              <StarInput value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
            </div>
            <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="How did it turn out? What did you use it for?" rows={4} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />

            {/* Photos & video */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Add photos or a video <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="file"
                accept={ACCEPT}
                multiple
                onChange={(e) => {
                  const picked = [...e.target.files];
                  const problem = checkFiles(picked);
                  if (problem) { setError(problem); e.target.value = ''; return; }
                  setError(null);
                  setFiles(picked);
                }}
                className="mt-1.5 block w-full text-sm text-gray-500 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <p className="mt-1 text-xs text-gray-400">
                Up to {MAX_FILES} files · photos under {MAX_IMAGE_MB}MB · video under {MAX_VIDEO_MB}MB
              </p>

              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600">
                      <span className="truncate">
                        {f.type.startsWith('video/') ? '🎬' : '🖼️'} {f.name}
                        <span className="ml-1 text-gray-400">({(f.size / (1024 * 1024)).toFixed(1)}MB)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles((list) => list.filter((_, idx) => idx !== i))}
                        className="shrink-0 font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={{ scale: 0.96 }}
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? (files.length ? 'Uploading…' : 'Submitting…') : 'Submit review'}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}
