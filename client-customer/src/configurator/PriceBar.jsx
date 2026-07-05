import { useState } from 'react';
import { formatPaise } from '../utils/money';

// Sticky bar showing the SERVER-authoritative price. Never blocks; when the
// design is incomplete it explains what's missing but stays visible.
export default function PriceBar({ pricing, status, errors, priceUpdated, onAddToCart, adding, added }) {
  const [open, setOpen] = useState(false);
  const invalid = status === 'invalid';
  const loading = status === 'loading' || status === 'idle';

  return (
    <div className="sticky bottom-4 z-10 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      {priceUpdated && (
        <div className="mb-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
          Price updated to match current options.
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Total</div>
          <div className="text-2xl font-bold text-gray-900">
            {invalid ? '—' : loading ? '…' : formatPaise(pricing.subtotalPaise)}
            {pricing.authoritative && !invalid && !loading && (
              <span className="ml-2 align-middle text-[10px] font-medium uppercase text-green-600">verified</span>
            )}
          </div>
        </div>
        <button
          onClick={onAddToCart}
          disabled={invalid || loading || adding}
          className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {adding ? 'Preparing…' : added ? 'Added ✓' : 'Add to cart'}
        </button>
      </div>

      {invalid && errors.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-xs text-red-600">
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}

      {!invalid && pricing.breakdown?.length > 0 && (
        <div className="mt-2">
          <button onClick={() => setOpen((o) => !o)} className="text-xs font-medium text-indigo-600 hover:underline">
            {open ? 'Hide' : 'Show'} price breakdown
          </button>
          {open && (
            <ul className="mt-2 space-y-1 border-t border-gray-100 pt-2 text-sm">
              {pricing.breakdown.map((line, i) => (
                <li key={i} className="flex justify-between text-gray-600">
                  <span>{line.label}</span>
                  <span>{formatPaise(line.amountPaise)}</span>
                </li>
              ))}
              <li className="flex justify-between border-t border-gray-100 pt-1 font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPaise(pricing.subtotalPaise)}</span>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
