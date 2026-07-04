# NameCraft — End-to-End Implementation Plan

**Personalized Name Plate Customization Platform**
Onewebmart · MERN build spec · v1.0

---

## 0. How to read this document

This expands the original NameCraft brief into a build-ready specification. The original document answered *"what features exist."* This one answers *"how the system holds together"* — the four things a configurator commerce platform lives or dies on:

1. **The canonical `designDocument`** — one JSON object that fully describes a customized plate. It is the single source of truth for preview, price, and manufacturing.
2. **Server-authoritative pricing** — the client never decides what anything costs. It displays; the server decides.
3. **Money as integer paise** — no floats anywhere in the money path.
4. **Append-only order history** — every state change is a record, never an overwrite.

Everything else (CRUD, storefront, admin) is standard MERN and is scheduled in the phase playbook (§11).

---

## 1. Architectural non-negotiables

These are invariants. Code review rejects anything that violates them.

| # | Invariant | Why |
|---|-----------|-----|
| 1 | **All money stored and computed as integer paise** (`Int32`/`Long`), never floats. Convert to rupees only at the display edge. | Float arithmetic silently corrupts totals and tax. |
| 2 | **Price is computed server-side from DB option prices.** Client-supplied prices are display hints only and are recomputed + rejected on mismatch beyond tolerance (0). | Prevents price tampering — the classic configurator exploit. |
| 3 | **One canonical `designDocument` per cart item / order item.** Preview, price, and production render all derive from it. | Removes drift between what the customer saw, paid, and receives. |
| 4 | **Order status history is append-only.** Status is derived as `history[last].status`. | Auditability; dispute resolution; manufacturing traceability. |
| 5 | **The `designDocument` is schema-versioned.** Every stored copy carries `schemaVersion`. | Lets you evolve the editor without breaking old orders/reorders. |
| 6 | **Razorpay order amount comes only from the server-computed total.** Signature verified server-side before fulfillment. | Payment integrity. |
| 7 | **Cloudinary writes are server-signed or server-proxied.** No unsigned client uploads to production folders. | Prevents asset-store abuse. |
| 8 | **Admin option changes never mutate historical orders.** Orders snapshot the option values (name, hex, price) at purchase time. | An order from last month must stay reproducible even if you delete a color today. |

---

## 2. Tech stack (confirmed + decisions)

Stack from the brief is accepted as-is:

```
Frontend : React 19 · Vite · Tailwind · React Router · Redux Toolkit ·
           React Hook Form · Framer Motion · Fabric.js (canvas editor)
Backend  : Node.js · Express · MongoDB · Mongoose · JWT · Multer ·
           Cloudinary · Sharp · Nodemailer
Payments : Razorpay (primary), Stripe (optional/later)
Deploy   : Frontend → Vercel · Backend → VPS/Render · DB → MongoDB Atlas
```

**Two decisions worth making explicitly before Phase 1:**

- **SEO on a Vite SPA.** A pure client-rendered SPA is weak for category/product page SEO, which matters for a store. Options, cheapest → most work: (a) accept it and lean on paid/social traffic; (b) add pre-rendering for public routes (`vite-plugin-ssr` / prerender at build for a fixed catalog is impractical with a dynamic catalog, so use SSG-on-demand or a small prerender service); (c) if organic search is a real channel, this is the one place Next.js would earn its keep. Recommendation: **ship Vite SPA now, add a prerender layer for `/products/:slug` and `/products` in Phase 6** rather than re-platforming.
- **Production render authority.** Fabric.js in the browser generates the *preview*. It must **not** be the manufacturing file. The print/CNC file is regenerated server-side from the `designDocument` (Sharp + `node-canvas`, or a headless render) at fixed physical DPI. Preview = fast + approximate; production render = deterministic + high-res + server-owned. (See §7.)

---

## 3. System architecture

Single React app (storefront + `/admin`), single Express API, single MongoDB. Admin is a route tree guarded by role, not a separate deployment — as in the brief.

```
                    ┌──────────────────────────────┐
                    │   React 19 SPA (Vite)         │
                    │   /            storefront     │
                    │   /admin/*     admin (guard)  │
                    │   Fabric.js editor → preview  │
                    └───────────────┬──────────────┘
                                    │ REST + JWT
                    ┌───────────────▼──────────────┐
                    │   Express API                 │
                    │   ├ auth / rbac middleware     │
                    │   ├ catalog (read)             │
                    │   ├ pricing engine  (§6)       │
                    │   ├ design validator (§5)      │
                    │   ├ cart / checkout            │
                    │   ├ payments (Razorpay verify) │
                    │   ├ orders + state machine (§9)│
                    │   ├ render service (§7)        │
                    │   └ admin CRUD                 │
                    └───┬───────────┬───────────┬────┘
                        │           │           │
                 ┌──────▼───┐ ┌─────▼─────┐ ┌───▼──────┐
                 │ MongoDB  │ │ Cloudinary│ │ Razorpay │
                 │  Atlas   │ │  assets   │ │  payments│
                 └──────────┘ └───────────┘ └──────────┘
```

---

## 4. The canonical `designDocument` (the linchpin)

Everything routes through this. It is produced by the editor, validated + priced by the server, stored on the cart item, and frozen onto the order item at purchase.

```jsonc
{
  "schemaVersion": 1,
  "productId": "665f...a12",

  // Selected options — each carries the id (to re-price) AND a snapshot
  // (so historical orders survive option deletion).
  "selections": {
    "material":   { "optionId": "mat_wood",  "snapshot": { "name": "Wood",    "priceDeltaPaise": 30000 } },
    "size":       { "optionId": "size_18x12","snapshot": { "label": "18x12",  "widthMm": 457, "heightMm": 305, "priceDeltaPaise": 50000 } },
    "font":       { "optionId": "font_playfair", "snapshot": { "family": "Playfair Display", "priceDeltaPaise": 0 } },
    "color":      { "optionId": "col_gold",  "snapshot": { "name": "Golden", "hex": "#C8A04D", "priceDeltaPaise": 25000 } },
    "background": { "optionId": "bg_walnut", "snapshot": { "name": "Walnut", "type": "texture", "priceDeltaPaise": 0 } },
    "border":     { "optionId": "brd_luxury","snapshot": { "name": "Luxury", "priceDeltaPaise": 15000 } },
    "mountType":  { "optionId": "mnt_wall",  "snapshot": { "name": "Wall",   "priceDeltaPaise": 0 } }
  },

  // Free-text fields the customer typed (validated against product config limits)
  "text": [
    { "field": "familyName", "value": "Parmar Family" },
    { "field": "subtitle",   "value": "Welcome" }
  ],

  // Icons are a repeatable, per-unit-priced element
  "icons": [
    { "optionId": "icn_ganesh", "snapshot": { "name": "Ganesh", "priceDeltaPaise": 15000 } }
  ],

  // Normalized layout — position/scale of elements on a unit canvas (0..1),
  // resolution-independent so the server can re-render at any DPI.
  "layout": {
    "canvas": { "aspect": "18:12" },
    "elements": [
      { "type": "text", "ref": "familyName", "x": 0.5, "y": 0.42, "scale": 1.0, "align": "center" },
      { "type": "text", "ref": "subtitle",   "x": 0.5, "y": 0.68, "scale": 0.6, "align": "center" },
      { "type": "icon", "ref": 0,            "x": 0.5, "y": 0.18, "scale": 0.9 }
    ]
  },

  // Render outputs (set by server render service, not the client)
  "render": {
    "previewImageUrl": null,        // low-res, fast, browser-generated then uploaded
    "productionRenderUrl": null,    // high-res, server-generated, for manufacturing
    "designHash": null              // sha256 of the normalized selections+text+layout
  },

  // Pricing block — client fills for display; SERVER overwrites as truth
  "pricing": {
    "currency": "INR",
    "authoritative": false,
    "basePricePaise": 149900,
    "breakdown": [],
    "subtotalPaise": 0,
    "computedAt": null
  }
}
```

**Rules for the `designDocument`:**

- The client may set `selections`, `text`, `icons`, `layout`, and a *proposed* `pricing`. It may **never** set `pricing.authoritative = true`.
- On every add-to-cart / update-cart / checkout, the server:
  1. Validates structure + limits against `product.customizationConfig`.
  2. Recomputes `pricing` from live DB option prices (§6), sets `authoritative: true`.
  3. Refreshes each `selections[*].snapshot` from the DB so snapshots stay honest at purchase time.
  4. Computes `render.designHash`.
- If the client's proposed subtotal differs from the server's, the server wins silently and returns the corrected document (surface a soft "price updated" toast, never block).

---

## 5. Data models (Mongoose)

Money fields are named `*Paise` and typed `Number` (integer). Add a schema-level guard rejecting non-integers on money fields.

### Product (drives the editor via `customizationConfig`)

```js
const ProductSchema = new Schema({
  name: String,
  slug: { type: String, unique: true, index: true },
  category: { type: ObjectId, ref: 'Category', index: true },
  subCategory: { type: ObjectId, ref: 'SubCategory' },
  description: String,
  images: [String],           // Cloudinary URLs
  basePricePaise: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['active','hidden'], default: 'active' },

  // The Product Builder config: which panels are on + constraints.
  customizationConfig: {
    material:   { enabled: Boolean, options: [{ type: ObjectId, ref: 'Material' }], required: Boolean },
    size:       { enabled: Boolean, options: [{ type: ObjectId, ref: 'Size' }],     required: Boolean },
    font:       { enabled: Boolean, options: [{ type: ObjectId, ref: 'Font' }] },
    color:      { enabled: Boolean, options: [{ type: ObjectId, ref: 'Color' }] },
    background: { enabled: Boolean, options: [{ type: ObjectId, ref: 'Background' }] },
    border:     { enabled: Boolean, options: [{ type: ObjectId, ref: 'Border' }] },
    mountType:  { enabled: Boolean, options: [{ type: ObjectId, ref: 'MountType' }] },
    icons:      { enabled: Boolean, options: [{ type: ObjectId, ref: 'Icon' }], max: { type: Number, default: 3 } },
    textFields: [{
      key: String,            // "familyName"
      label: String,          // "Family Name"
      required: Boolean,
      maxLength: Number
    }]
  }
}, { timestamps: true });
```

### Option collections (shared shape)

Materials, Sizes, Colors, Fonts, Borders, Backgrounds, MountTypes, Icons each look like:

```js
const OptionSchema = new Schema({
  name: String,
  slug: String,
  priceDeltaPaise: { type: Number, default: 0 },
  status: { type: String, enum: ['active','inactive'], default: 'active' },
  meta: Schema.Types.Mixed   // hex for Color; widthMm/heightMm for Size; fontFileUrl for Font; svgUrl for Icon...
}, { timestamps: true });
```

- **Size** `meta`: `{ widthMm, heightMm }` (drives canvas aspect + production DPI).
- **Color** `meta`: `{ hex }`.
- **Font** `meta`: `{ fileUrl, format }` (ttf/otf/woff) — used by both browser `@font-face` and server render.
- **Icon** `meta`: `{ svgUrl, group }` (Religious/Animals/Nature/Family/Professional).

### Cart

```js
const CartItemSchema = new Schema({
  product: { type: ObjectId, ref: 'Product' },
  designDocument: Schema.Types.Mixed,   // canonical, server-priced (§4)
  quantity: { type: Number, default: 1, min: 1 },
  unitPricePaise: Number                // = designDocument.pricing.subtotalPaise (server-set)
}, { _id: true, timestamps: true });

const CartSchema = new Schema({
  user: { type: ObjectId, ref: 'User', index: true },
  items: [CartItemSchema]
}, { timestamps: true });
```

### Order (frozen snapshot + append-only history)

```js
const OrderItemSchema = new Schema({
  product: { type: ObjectId, ref: 'Product' },
  productNameSnapshot: String,
  designDocument: Schema.Types.Mixed,   // frozen at purchase; pricing.authoritative = true
  previewImageUrl: String,
  productionRenderUrl: String,          // filled once render service completes
  quantity: Number,
  unitPricePaise: Number,
  lineTotalPaise: Number
}, { _id: true });

const OrderSchema = new Schema({
  orderNumber: { type: String, unique: true },   // gapless per §9
  user: { type: ObjectId, ref: 'User', index: true },
  items: [OrderItemSchema],

  subtotalPaise: Number,
  discountPaise: { type: Number, default: 0 },
  couponSnapshot: Schema.Types.Mixed,
  shippingPaise: { type: Number, default: 0 },
  taxPaise: { type: Number, default: 0 },
  totalPaise: Number,

  address: Schema.Types.Mixed,          // snapshot, not a ref
  giftWrap: Boolean,

  payment: {
    provider: { type: String, default: 'razorpay' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    verified: { type: Boolean, default: false }
  },

  // Append-only. Current status = statusHistory[last].status
  statusHistory: [{
    status: { type: String, enum: [
      'pending','confirmed','design_review','approved',
      'manufacturing','packed','shipped','delivered','cancelled'
    ]},
    note: String,
    by: { type: ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  }]
}, { timestamps: true });
```

Remaining collections (`Users`, `Categories`, `SubCategories`, `Coupons`, `Reviews`, `Wishlist`, `Banners`, `Settings`) are conventional and specced in the phase playbook.

---

## 6. Pricing engine (server-authoritative)

A pure, deterministic function. Same input → same output. Reads **live** DB prices, ignores whatever the client claimed.

```
computePrice(product, designDocument) -> { breakdown[], subtotalPaise }

  1. base = product.basePricePaise
  2. push {label:'Base', amountPaise: base}
  3. for each enabled selection (material,size,color,border,background,mountType,font):
        opt = DB.lookup(selection.optionId)      // authoritative
        assert opt.status == 'active' AND opt ∈ product.config[...].options
        push {label: opt.name, amountPaise: opt.priceDeltaPaise}
  4. for each icon in designDocument.icons:
        opt = DB.lookup(icon.optionId)
        push {label: 'Icon: '+opt.name, amountPaise: opt.priceDeltaPaise}
  5. subtotalPaise = Σ breakdown.amountPaise
  6. return { breakdown, subtotalPaise }
```

**Order-level totals** (cart → order), all integer paise, applied in this order:

```
subtotal   = Σ item.unitPricePaise * qty
discount    = applyCoupon(subtotal, coupon)         // % coupons: floor(subtotal*pct/100)
taxable     = subtotal - discount
tax          = round(taxable * gstRate)             // GST from Settings; document HSN separately
shipping    = shippingRule(address, subtotal)
total        = taxable + tax + shipping
```

Rounding rule: fix one policy and apply everywhere — **round-half-up on the final tax line only**, keep all intermediate values in paise. Never round mid-calculation.

**Validation gate on checkout:** recompute every line from scratch. If any line's server subtotal ≠ the frozen cart value, refresh and re-present the cart before creating the Razorpay order. The Razorpay `amount` is `total` from this recomputation — nothing else.

---

## 7. Customization + render pipeline

Two distinct artifacts, different owners:

| Artifact | Generated by | When | Resolution | Purpose |
|----------|--------------|------|-----------|---------|
| **Preview** | Browser (Fabric.js `canvas.toDataURL`) | Live, on each edit (debounced) | Screen-res | What the customer sees; uploaded to Cloudinary on add-to-cart |
| **Production render** | Server (`node-canvas`/Sharp from `designDocument.layout`) | On order confirmation | Physical DPI from `size.meta` (e.g. 300 DPI × mm) | The file that goes to manufacturing |

Why the split: the browser render depends on the user's device, fonts, and zoom. It's fine as a *preview* but must never be the print file. The server re-renders from the normalized `layout` (0..1 coordinates) at the exact physical size, using the same font files (`Font.meta.fileUrl`) and icon SVGs, so the output is reproducible from the `designDocument` alone — including on a reorder years later.

Editor flow:

```
edit → update Redux design state → debounce 250ms →
  → recompute preview (Fabric) →
  → POST /api/pricing/quote {designDocument} →
  → server returns authoritative pricing → update price bar
add to cart:
  → upload preview to Cloudinary (server-signed) →
  → POST /api/cart {designDocument (server re-validates + re-prices)}
```

---

## 8. Product Builder (admin)

Admin does not hardcode option panels. For each product, admin toggles which panels are enabled and picks the allowed options + limits — persisted to `product.customizationConfig` (§5). The storefront editor renders panels purely from that config, so a "Wooden Name Plate" and an "LED Name Plate" (LED color, remote, adapter, thickness) reuse the same engine with different configs. LED-specific attributes are just more option collections wired into the same config shape.

---

## 9. Order lifecycle (state machine)

Append-only `statusHistory`. Transitions are validated server-side; illegal jumps are rejected.

```
pending ──▶ confirmed ──▶ design_review ──▶ approved ──▶ manufacturing
                                │                            │
                                ▼ (rework)                   ▼
                            (back to editor/customer)      packed ──▶ shipped ──▶ delivered

any non-terminal ──▶ cancelled
```

- `design_review` is the human gate specific to custom goods: admin (or customer) approves the exact design before anything is manufactured. Rejection routes back with a note; a corrected `designDocument` produces a new item revision.
- `orderNumber` is **gapless** (e.g. `OWM-NC-000123`) via an atomic counter document (`findOneAndUpdate` `$inc`), not `count()+1`.
- Cancellation after `manufacturing` requires an explicit admin override flag.

---

## 10. API surface (grouped)

Public/customer (JWT where noted), admin routes are `role:admin` guarded.

```
Auth
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/profile            (jwt)

Catalog (public, read)
  GET    /api/categories
  GET    /api/products?category=&sort=&q=&page=
  GET    /api/products/:slug          (returns customizationConfig + populated options)

Configurator
  POST   /api/pricing/quote           {designDocument} → authoritative pricing   (public)
  POST   /api/render/preview-upload   signed Cloudinary upload for preview        (jwt)

Cart  (jwt) — server re-validates + re-prices every write
  GET    /api/cart
  POST   /api/cart                    {productId, designDocument, quantity}
  PATCH  /api/cart/:itemId
  DELETE /api/cart/:itemId

Checkout & payments  (jwt)
  POST   /api/checkout/quote          recompute totals, coupon, tax, shipping
  POST   /api/payments/razorpay/order create RZP order from server total
  POST   /api/payments/razorpay/verify verify signature → create Order → clear cart

Orders  (jwt)
  GET    /api/orders                  (own)
  GET    /api/orders/:id              (own)

Wishlist / Reviews / Coupons  (jwt)
  ...standard CRUD + POST /api/coupons/apply

Admin  (role:admin)  — all option collections share the CRUD shape
  CRUD   /api/admin/categories | subcategories | products
  CRUD   /api/admin/materials | sizes | colors | fonts | icons | borders | backgrounds | mounttypes
  CRUD   /api/admin/coupons | banners
  GET    /api/admin/orders
  PATCH  /api/admin/orders/:id/status  {status, note}   → pushes to statusHistory (validated)
  GET    /api/admin/orders/:id/production-render        → trigger/fetch render
  GET/PUT /api/admin/settings
  GET    /api/admin/dashboard          (sales, today, revenue, pending)
```

---

## 11. Build playbook (Claude Code, phase-by-phase)

Each numbered item is one focused task. This supersedes the brief's 6-line phase table.

### Phase 0 — Foundations
- `0.1` Monorepo scaffold (`client/` Vite React 19 + Tailwind; `server/` Express) per §13.
- `0.2` Mongo connection, config loader, `.env` schema, error-handling middleware, request logging.
- `0.3` Money guards: helper `paise ↔ rupees`, Mongoose validator rejecting non-integer `*Paise`.
- `0.4` Auth: register/login, bcrypt, JWT, `requireAuth` + `requireRole('admin')` middleware.
- `0.5` Route shell: storefront layout + `/admin` guarded layout; role-based redirect.

### Phase 1 — Catalog data layer
- `1.1` Schemas: Category, SubCategory, Product (with `customizationConfig`), all option collections (§5).
- `1.2` Cloudinary service (server-signed uploads) + Multer intake for images/fonts/SVGs.
- `1.3` Admin CRUD for categories/subcategories.
- `1.4` Admin CRUD for every option collection (generic controller factory to avoid duplication).
- `1.5` Admin Product CRUD + Product Builder UI writing `customizationConfig`.
- `1.6` Seed script: a couple of categories + one fully-configured demo product for end-to-end testing.

### Phase 2 — Storefront (read)
- `2.1` Home (hero, featured, trending, best-sellers) fed by real catalog.
- `2.2` Category + listing pages: filters, sort, pagination, search.
- `2.3` Product detail page shell (images, details, reviews slot, related).
- `2.4` Product card component (image, price, discount, rating, customize CTA, wishlist, quick view).

### Phase 3 — Configurator + pricing (the core)
- `3.1` `designDocument` type + Redux slice (selections, text, icons, layout).
- `3.2` `computePrice` pure function + `POST /api/pricing/quote` with validation against config.
- `3.3` Fabric.js editor: render canvas from `layout`, live text/font/color/icon/border/background.
- `3.4` Panel renderer driven by `product.customizationConfig` (enabled panels only).
- `3.5` Debounced quote calls → live price bar (server-authoritative, client shows corrections).
- `3.6` Preview generation + signed Cloudinary upload.
- `3.7` Server-side render service (Sharp/node-canvas) producing production file from `layout`.

### Phase 4 — Cart, checkout, payments
- `4.1` Cart API with re-validate + re-price on every write; cart UI with editable line designs.
- `4.2` Coupon model + `POST /api/coupons/apply` (server math, integer paise, expiry/usage limits).
- `4.3` Checkout quote (subtotal, discount, tax/GST from Settings, shipping rule, total).
- `4.4` Razorpay order from server total; verify signature; on success create Order snapshot + clear cart.
- `4.5` Order state machine + append-only `statusHistory` + gapless `orderNumber` counter.
- `4.6` Customer dashboard: orders, saved designs, addresses, invoices.

### Phase 5 — Admin operations
- `5.1` Dashboard metrics (sales, today's orders, revenue, pending).
- `5.2` Order management: status transitions (validated), design_review approve/reject with notes.
- `5.3` Production render fetch/download per order item for manufacturing.
- `5.4` Coupons, banners, settings (store, GST, shipping, invoice).

### Phase 6 — Production hardening
- `6.1` Reviews, wishlist polish, related products, Instagram gallery, FAQ.
- `6.2` Transactional email (Nodemailer): order confirm, status updates, design approval.
- `6.3` SEO layer: prerender/SSG for `/products/:slug` and `/products`; sitemap; meta/OG per product.
- `6.4` Invoices (PDF) with GST + HSN; analytics; rate limiting; input hardening.
- `6.5` Deployment + CI (§14), smoke tests, backup policy.

---

## 12. Security & correctness checklist

- [ ] No float touches a money value anywhere server-side.
- [ ] `/api/pricing/quote`, cart writes, and checkout all recompute price from DB — client price ignored.
- [ ] Razorpay `amount` derives only from the server checkout total; signature verified before Order creation.
- [ ] Cloudinary uploads server-signed; file type + size validated; fonts/SVGs sanitized.
- [ ] Order items snapshot option name/hex/price — deleting an option never alters past orders.
- [ ] `statusHistory` is append-only; no endpoint overwrites status in place; transitions validated.
- [ ] `orderNumber` uses an atomic counter, not a count.
- [ ] JWT expiry + refresh; admin routes double-checked with `requireRole`.
- [ ] Rate limiting on auth, quote, and coupon endpoints.

---

## 13. Folder structure (refined)

```
nameplate-platform/
├── client/
│   └── src/
│       ├── admin/            # /admin/* pages
│       ├── customer/         # storefront pages
│       ├── configurator/     # Fabric editor, panels, designDocument slice
│       ├── components/
│       ├── layouts/
│       ├── store/            # Redux Toolkit slices
│       ├── services/         # api clients
│       ├── hooks/
│       └── utils/            # money.ts (paise<->rupees), designDocument types
└── server/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/           # auth, rbac, error, moneyGuard
    ├── services/             # pricing/, render/, cloudinary/, razorpay/, mailer/
    ├── config/
    └── utils/                # money.js, orderNumber counter, validators
```

---

## 14. Deployment & CI

- **Frontend → Vercel:** connect repo, `client/` root, env for API base URL + Cloudinary cloud name + Razorpay key (public). SPA fallback rewrite to `index.html`.
- **Backend → VPS/Render:** Node service, PM2 (VPS) or managed (Render); env for Mongo URI, JWT secret, Cloudinary secret, Razorpay key+secret, SMTP.
- **DB → Atlas:** IP allowlist to the backend host; daily backups; separate dev/prod clusters.
- **CI:** on push → lint + typecheck + unit tests (pricing engine + state machine are the must-cover units) → build → deploy. The pricing function and money helpers deserve real unit tests before anything else — they're where silent revenue bugs live.

---

## 15. Open decisions to close before Phase 3

1. **SEO strategy** — SPA + prerender layer (recommended) vs. Next.js re-platform. Decide before storefront routing solidifies.
2. **Production render engine** — `node-canvas` vs. headless browser render. `node-canvas` is lighter and deterministic; confirm it handles your fonts + SVG icons at print DPI.
3. **GST modeling** — single rate from Settings vs. per-category HSN. Start single-rate, structure `taxPaise` as a breakdown so per-HSN is a later data change, not a refactor.
4. **Coupon rounding + stacking** — one coupon per order (recommended) and floor-based percentage discount; lock this before writing `applyCoupon`.
```