import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getProductReviews, createReview } from '../services/catalog';
import { selectIsAuthenticated } from '../store/authSlice';
import { apiErrorMessage } from '../services/api';
import Rating from './Rating';

export default function Reviews({ productId, slug }) {
  const isAuthed = useSelector(selectIsAuthenticated);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProductReviews(slug).then(setReviews).catch(() => setReviews([])).finally(() => setLoading(false));
  }, [slug]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await createReview({ productId, rating: Number(form.rating), title: form.title, comment: form.comment });
      setMessage('Thanks! Your review was submitted and will appear once approved.');
      setForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold">Reviews</h2>

      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet. Be the first to review this product.</p>
        ) : (
          reviews.map((r) => (
            <div key={r._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <Rating value={r.rating} />
                <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.title && <div className="mt-1 font-medium text-gray-900">{r.title}</div>}
              {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
              <div className="mt-2 text-xs text-gray-400">— {r.userNameSnapshot || 'Customer'}</div>
            </div>
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
        ) : message ? (
          <p className="mt-2 text-sm text-green-600">{message}</p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700">Rating</label>
              <select value={form.rating} onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))} className="mt-1 rounded-md border border-gray-300 px-3 py-2 text-sm">
                {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <textarea value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Your experience…" rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
            <button type="submit" disabled={submitting} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
