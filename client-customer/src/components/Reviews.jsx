import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { getProductReviews, createReview } from '../services/catalog';
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

export default function Reviews({ productId, slug }) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

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
      await createReview({ productId, rating: Number(form.rating), title: form.title, comment: form.comment });
      setForm({ rating: 5, title: '', comment: '' });
      setMessage('Thanks! Your review is now live. 🎉');
      await loadReviews(); // show it immediately
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">Reviews</h2>
        {avg && (
          <span className="flex items-center gap-1 text-sm text-gray-500">
            <Rating value={Number(avg)} /> {avg} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map((r) => (
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
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{r.userNameSnapshot || 'Customer'}</span>
                    <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-0.5"><Rating value={r.rating} /></div>
                  {r.title && <div className="mt-1 font-medium text-gray-900">{r.title}</div>}
                  {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Write a review */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="font-semibold">Write a review</h3>
        {!isAuthed ? (
          <p className="mt-2 text-sm text-gray-500">
            Please <Link to="/login" className="text-indigo-600 hover:underline">sign in</Link> to write a review.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Your rating</label>
              <StarInput value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
            </div>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Your experience…" rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
            <motion.button
              type="submit"
              disabled={submitting}
              whileTap={{ scale: 0.96 }}
              className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting…' : 'Submit review'}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
}
