# NameCraft — Project Invariants (read on every task)

NameCraft is a personalized **name-plate customization e-commerce platform** (MERN).
This file holds the NON-NEGOTIABLE rules. Follow them in every change. Code review
rejects anything that violates them.

Reference specs live in `docs/`:
- `docs/NameCraft-Implementation-Plan.md` — the architecture spec (data models, pricing, render, API surface).
- `docs/NameCraft-Prompting-Playbook.md` — the phase-by-phase build sequence.

---

## Repository shape (decided architecture)

This is a **monorepo with SEPARATE frontends and ONE shared backend**:

```
/server           Node + Express + Mongoose API   (own package.json)  — the single source of truth
/client-customer  React 19 + Vite + Tailwind SPA  (own package.json)  — storefront at "/"
/client-admin     React 19 + Vite + Tailwind SPA  (own package.json)  — admin panel, role-guarded
/docs             reference specs
package.json      root — "concurrently" runs all three with `npm run dev`
```

- Both frontends talk to the **same** Express API and the **same** MongoDB, so their data
  is always in sync. There is exactly ONE backend and ONE database.
- The admin app is role-guarded: only users with `role: 'admin'` may use it. The customer
  app is for `role: 'customer'`.
- Shared client concerns (money formatting, the `designDocument` type, the axios client,
  the auth slice) are duplicated per app on purpose to keep the two SPAs independently
  deployable. Keep them consistent.

---

## The 8 invariants (never violate)

1. **All money is stored and computed as INTEGER PAISE** (never floats). Rupees appear ONLY
   at the display edge. Every money field is named `*Paise`. Use `server/src/utils/money.js`
   and the client `money` util; never do float math on money.

2. **Price is ALWAYS computed server-side** from live DB option prices. Client-supplied
   prices are display hints only — the server recomputes and overwrites them. A client can
   never set `pricing.authoritative = true`.

3. **ONE canonical `designDocument` per customized item.** The editor writes it, the server
   prices + validates it, the cart stores it, the order freezes it, and the production render
   is regenerated from it. It carries `schemaVersion`. (Shape: Implementation Plan §4.)

4. **Order status is append-only.** An order has `statusHistory[]`; the current status is the
   last entry. Never overwrite status in place. Transitions are validated server-side.

5. **Orders SNAPSHOT option values** (name, hex, priceDeltaPaise, etc.) at purchase time, so
   deleting or editing a catalog option later never alters past orders.

6. **Razorpay order amount comes ONLY from the server-computed checkout total.** The payment
   signature is verified server-side BEFORE an Order is created.

7. **Cloudinary uploads are server-signed / server-proxied.** No unsigned client uploads.
   Never expose the Cloudinary secret to any client.

8. **`orderNumber` is gapless** via an atomic counter document (`findOneAndUpdate` `$inc`),
   never `count() + 1`.

---

## Conventions

- **Backend layout:** `controllers/ models/ routes/ middleware/ services/ config/ utils/`
  under `server/src`. Business logic in services; controllers stay thin.
- **API response shape** is always `{ success, data, error }`. Use the helpers in
  `server/src/utils/apiResponse.js`. Throw `ApiError` for expected failures; the global error
  handler formats them.
- **Async controllers** are wrapped with `asyncHandler` — no raw try/catch in route handlers.
- **Config** is loaded once through `server/src/config/index.js`, which validates required env
  vars on boot and fails loudly. Never read `process.env` directly outside that module.
- **Auth:** JWT in the `Authorization: Bearer <token>` header. `requireAuth` populates
  `req.user`; `requireRole('admin')` guards admin routes.
- **Money helpers:** `rupeesToPaise` / `paiseToRupees`. Any `*Paise` Mongoose field uses the
  integer-paise validator (`server/src/models/plugins/moneyGuard.js`) that rejects
  non-integer / negative values on save.
- **Env files:** never commit real secrets. `.env.example` documents every required var.
- **Commits:** small and per-task. Message format: `phase(P0.x): <what>`.

---

## Money handling — the one rule people get wrong

Store `12345` for ₹123.45. Convert to rupees ONLY when rendering to a human. A `Number` field
in Mongo holding paise is fine (safe integer range covers realistic prices). Never introduce a
`Float`, never `parseFloat` a price, never divide by 100 before the display edge.
