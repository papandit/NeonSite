// Admin UI kit — a thin, themed layer over Radix primitives.
//
// Radix gives the behaviour that is tedious and easy to get wrong (focus traps,
// escape/outside-click, ARIA wiring, collision-aware positioning); everything
// visual is plain Tailwind using the same tokens as the storefront, so the
// console reskins with the brand instead of shipping a second design system.
//
// Prefer these over hand-rolled markup for anything interactive.

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { HelpCircle, X } from 'lucide-react';

/* ------------------------------------------------------------------ tooltip */

// One provider at the app root; `delayDuration` keeps hints from flashing as
// the pointer crosses a toolbar.
export function TooltipProvider({ children }) {
  return <TooltipPrimitive.Provider delayDuration={250}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({ label, side = 'top', children }) {
  if (!label) return children;
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className="z-50 max-w-xs rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium leading-snug text-white shadow-lg data-[state=delayed-open]:animate-in"
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-slate-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

// The "why does this field exist" hint. Sits inline next to a label.
export function InfoTip({ children }) {
  return (
    <Tooltip label={children}>
      <button type="button" aria-label="More information" className="align-middle text-slate-400 transition hover:text-indigo-600">
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </Tooltip>
  );
}

/* ------------------------------------------------------------------- dialog */

export function Dialog({ open, onOpenChange, title, description, children, footer, wide }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={`fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[92vw] ${wide ? 'max-w-3xl' : 'max-w-lg'} -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl focus:outline-none`}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <DialogPrimitive.Title className="font-display text-lg font-medium text-slate-900">{title}</DialogPrimitive.Title>
              {description && <DialogPrimitive.Description className="mt-1 text-sm text-slate-500">{description}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          </div>
          {children}
          {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/* --------------------------------------------------------------------- tabs */

// `items` = [{ value, label, badge? }]. Keeps long editor pages navigable
// instead of one endless scroll.
export function Tabs({ items, value, onValueChange, children }) {
  return (
    <TabsPrimitive.Root value={value} onValueChange={onValueChange}>
      <TabsPrimitive.List className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((t) => (
          <TabsPrimitive.Trigger
            key={t.value}
            value={t.value}
            className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-800 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
          >
            {t.label}
            {t.badge != null && (
              <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{t.badge}</span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {children}
    </TabsPrimitive.Root>
  );
}

export const TabPanel = ({ value, children }) => (
  <TabsPrimitive.Content value={value} className="space-y-6 focus:outline-none">
    {children}
  </TabsPrimitive.Content>
);

/* ------------------------------------------------------------ small pieces */

const TONES = {
  neutral: 'bg-slate-100 text-slate-600',
  brand: 'bg-indigo-50 text-indigo-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-gold-100 text-gold-700',
  danger: 'bg-red-50 text-red-700',
};

export function Badge({ tone = 'neutral', children }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[tone] || TONES.neutral}`}>{children}</span>;
}

// Shown instead of a bare "No rows yet" — says what the thing is for and how to
// start, which is the part people actually need.
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-6 py-10 text-center">
      {Icon && (
        <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-medium text-slate-800">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
