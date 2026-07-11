// Lightweight toast system — a tiny pub/sub store so `toast.*` can be called
// from ANYWHERE (components, redux thunks, axios interceptors, plain services),
// plus a <Toaster/> that renders the stack. No dependencies. Duplicated per app
// on purpose (see CLAUDE.md — the two SPAs stay independently deployable).

import { useSyncExternalStore } from 'react';

let toasts = [];
const listeners = new Set();
let seq = 0;

function notify() {
  listeners.forEach((l) => l());
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() {
  return toasts;
}

function remove(id) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

function push(type, message, opts = {}) {
  if (!message) return undefined;
  const id = ++seq;
  const duration = opts.duration ?? (type === 'error' ? 5000 : 3000);
  toasts = [...toasts, { id, type, message: String(message) }];
  notify();
  if (duration !== Infinity) setTimeout(() => remove(id), duration);
  return id;
}

// Callable from any module — components or not.
export const toast = {
  success: (m, o) => push('success', m, o),
  error: (m, o) => push('error', m, o),
  info: (m, o) => push('info', m, o),
  dismiss: (id) => remove(id),
};

const STYLES = {
  success: { box: 'border-green-200', accent: 'bg-green-500', icon: 'text-green-600', glyph: '✓' },
  error: { box: 'border-red-200', accent: 'bg-red-500', icon: 'text-red-600', glyph: '✕' },
  info: { box: 'border-indigo-200', accent: 'bg-indigo-500', icon: 'text-indigo-600', glyph: 'ℹ' },
};

// Mount once near the app root. Sits above modals (z-index 100 > modal 50).
export function Toaster() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
    >
      {items.map((t) => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toast.dismiss(t.id)}
            className={`nc-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-xl border bg-white py-3 pl-3 pr-4 text-left text-sm text-slate-800 shadow-lg ring-1 ring-black/5 ${s.box}`}
          >
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.accent}`}>
              {s.glyph}
            </span>
            <span className="flex-1 font-medium leading-snug">{t.message}</span>
          </button>
        );
      })}
      <style>{`@keyframes nc-toast-in{from{opacity:0;transform:translateY(-10px) scale(.97)}to{opacity:1;transform:none}}.nc-toast{animation:nc-toast-in .22s cubic-bezier(.2,.8,.2,1)}`}</style>
    </div>
  );
}

export default toast;
