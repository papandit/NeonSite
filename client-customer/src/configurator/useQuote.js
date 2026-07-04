// Debounced server-authoritative pricing. Watches the design; ~250ms after the
// last change it POSTs /pricing/quote and applies the corrected pricing. If the
// server total differs from the client's optimistic estimate, flags a soft
// "price updated" (the caller shows a toast) — never blocks.

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { requestQuote } from '../services/pricing';
import { applyQuote, selectDesignDocument } from '../store/designSlice';
import { apiErrorMessage } from '../services/api';

// Optimistic client estimate from local snapshots (display hint only).
function clientEstimate(design) {
  let total = design.pricing.basePricePaise || 0;
  for (const sel of Object.values(design.selections || {})) {
    total += sel?.snapshot?.priceDeltaPaise || 0;
  }
  for (const icon of design.icons || []) {
    total += icon?.snapshot?.priceDeltaPaise || 0;
  }
  return total;
}

export function useQuote(productId) {
  const dispatch = useDispatch();
  const design = useSelector(selectDesignDocument);
  const designRef = useRef(design);
  designRef.current = design;

  const [status, setStatus] = useState('idle'); // idle | loading | ok | invalid | error
  const [errors, setErrors] = useState([]);
  const [priceUpdated, setPriceUpdated] = useState(false);
  const timer = useRef();

  // Only the price-affecting parts should trigger a re-quote.
  const key = JSON.stringify({
    productId,
    selections: Object.fromEntries(Object.entries(design.selections).map(([k, v]) => [k, v.optionId])),
    text: design.text,
    icons: design.icons.map((i) => i.optionId),
  });

  useEffect(() => {
    if (!productId) return undefined;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const current = designRef.current;
      const estimate = clientEstimate(current);
      setStatus('loading');
      try {
        const doc = await requestQuote(productId, current);
        dispatch(applyQuote(doc));
        setStatus('ok');
        setErrors([]);
        if (estimate !== doc.pricing.subtotalPaise) {
          setPriceUpdated(true);
          setTimeout(() => setPriceUpdated(false), 2000);
        }
      } catch (err) {
        const details = err?.response?.data?.error?.details;
        if (Array.isArray(details)) {
          setErrors(details);
          setStatus('invalid');
        } else {
          setErrors([apiErrorMessage(err)]);
          setStatus('error');
        }
      }
    }, 250);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { status, errors, priceUpdated };
}
