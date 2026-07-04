// Order status state machine (INVARIANT 4). Transitions are validated; illegal
// jumps are rejected. Status is derived from statusHistory[last] and appended,
// never overwritten.

// design_review -> confirmed is the "rework" path (send the design back to be
// redone before manufacturing).
export const TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['design_review', 'cancelled'],
  design_review: ['approved', 'confirmed', 'cancelled'],
  approved: ['manufacturing', 'cancelled'],
  manufacturing: ['packed', 'cancelled'], // cancel here needs an override flag
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const TERMINAL = ['delivered', 'cancelled'];

// Cancelling from these requires an explicit admin override.
export const CANCEL_NEEDS_OVERRIDE = ['manufacturing', 'packed'];

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

/**
 * @param {string} from current status
 * @param {string} to   requested status
 * @param {{ override?: boolean }} [opts]
 * @returns {{ ok: boolean, reason?: string }}
 */
export function checkTransition(from, to, { override = false } = {}) {
  if (!TRANSITIONS[from]) return { ok: false, reason: `Unknown current status "${from}"` };
  if (!canTransition(from, to)) {
    return { ok: false, reason: `Cannot move from "${from}" to "${to}"` };
  }
  if (to === 'cancelled' && CANCEL_NEEDS_OVERRIDE.includes(from) && !override) {
    return { ok: false, reason: `Cancelling from "${from}" requires an override` };
  }
  return { ok: true };
}

/** Statuses reachable from `from` (for building admin UI dropdowns). */
export function nextStatuses(from) {
  return TRANSITIONS[from] || [];
}
