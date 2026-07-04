# NameCraft — Claude Code Prompting Playbook

**End-to-end build sequence for the customer site + admin panel**
Monorepo: separate `server/` (backend) and `client/` (frontend) in one root folder.

---

## How to use this

1. Paste **one prompt at a time** into Claude Code, in order. Don't batch them — each depends on the previous.
2. After each prompt, check the **Done when** list. If something's missing, tell Claude Code exactly what failed rather than moving on.
3. **Commit after every prompt** (`git add -A && git commit -m "..."`). Small commits = easy rollback.
4. The very first prompt writes a **`CLAUDE.md`** at the repo root holding the project invariants. Claude Code reads that file automatically on every run, which is why later prompts can stay short — they just say "per CLAUDE.md."
5. Keep the two reference docs (`NameCraft-Implementation-Plan.md`, this file) in a `docs/` folder so the agent can consult them.

**Prompt tags:** 🔧 BACKEND · 🖥️ SITE (customer) · 🛠️ ADMIN · 🧩 SHARED

### Prerequisites (have these ready before Phase 0)
- Node 20+, a MongoDB Atlas connection string, a Cloudinary account (cloud name + key + secret), Razorpay test keys, and an SMTP sender for later.

---

## PHASE 0 — Foundation

### P0.1 🧩 Monorepo + project context
```
Create a monorepo for an e-commerce name plate customization platform called NameCraft.

Root folder layout — backend and frontend are SEPARATE apps in ONE repo:
  /server        Node + Express + Mongoose API (own package.json)
  /client        React 19 + Vite + Tailwind SPA (own package.json)
  /docs          reference docs
  package.json   root, with "concurrently" scripts to run both:
                 "dev": run server and client together
  .gitignore, .env.example (root + server + client), README

The client is ONE app with two sections:
  - Customer storefront at "/"
  - Admin panel at "/admin/*" (role-guarded)
Do NOT make a second frontend app. One client, two sections.

Also create /CLAUDE.md at the repo root containing these NON-NEGOTIABLE invariants,
so you follow them in every future task:

  1. ALL money is stored and computed as INTEGER PAISE (never floats). Rupees only at
     the display edge. Every money field is named *Paise.
  2. Price is ALWAYS computed server-side from live DB option prices. Client-supplied
     prices are display hints and are recomputed + overwritten by the server.
  3. There is ONE canonical JSON object per customized item called designDocument. The
     editor writes it, the server prices + validates it, the cart stores it, the order
     freezes it, and the production render is regenerated from it. It carries schemaVersion.
  4. Order status is append-only: an order has statusHistory[]; current status is the
     last entry. Never overwrite status in place.
  5. Orders SNAPSHOT option values (name, hex, priceDeltaPaise) at purchase time, so
     deleting a catalog option later never alters past orders.
  6. Razorpay order amount comes ONLY from the server-computed checkout total; the
     payment signature is verified server-side before an Order is created.
  7. Cloudinary uploads are server-signed/proxied. No unsigned client uploads.
  8. orderNumber is gapless via an atomic counter, not count()+1.

Set up Tailwind, React Router, Redux Toolkit, React Hook Form in the client.
Set up Express with a clean folder structure (controllers, models, routes, middleware,
services, config, utils) in the server. Add nodemon.

Don't build features yet — just the skeleton, CLAUDE.md, and a working `npm run dev`
that starts both apps.
```
**Done when:** `npm run dev` boots server + client together; `CLAUDE.md` exists at root; `/client` and `/server` each have their own `package.json`.

### P0.2 🔧 Backend core
```
Per CLAUDE.md, in /server build the core infrastructure:
- MongoDB connection with retry + clear startup log.
- Centralized config loader that validates required env vars on boot and fails loudly.
- Global error-handling middleware + async handler wrapper + request logging.
- A money utility: paiseToRupees / rupeesToPaise, and a Mongoose plugin/validator that
  REJECTS any *Paise field that isn't a non-negative integer.
- A standard API response shape { success, data, error }.
Add a /health route. No business models yet.
```
**Done when:** server refuses to start with a missing env var; hitting `/health` returns the standard shape; a non-integer paise value throws on save.

### P0.3 🔧 Auth
```
Per CLAUDE.md, add authentication in /server:
- User model (name, email unique, passwordHash, role enum ['customer','admin']).
- register, login (bcrypt), profile endpoints under /api/auth.
- JWT issue + verify; requireAuth middleware; requireRole('admin') middleware.
Seed one admin user via a script. Return the JWT + safe user object on login.
```
**Done when:** register/login work; a protected route rejects no-token and wrong-role; admin seed script creates an admin.

### P0.4 🧩 Frontend shell + auth + route guards
```
In /client, per CLAUDE.md, build the app shell:
- Redux store + auth slice (token, user, login/logout, persisted to memory only — no localStorage in artifacts, but in a real Vite app use localStorage for the token).
- React Router with TWO layouts:
    StorefrontLayout at "/"  (customer header/footer, placeholder home)
    AdminLayout at "/admin"  (sidebar nav, placeholder dashboard)
- Login + Register pages (React Hook Form) hitting /api/auth.
- Route guards: /admin/* requires role 'admin' (redirect to /admin/login otherwise);
  customer account routes require auth.
- An api service (axios) that attaches the JWT and handles 401 by logging out.
Style with Tailwind, clean and minimal. No catalog features yet.
```
**Done when:** logging in as admin lands on `/admin/dashboard`; a customer can't reach `/admin`; logout clears state.

---

## PHASE 1 — Catalog data + Admin CRUD

### P1.1 🔧 Catalog + option models
```
Per CLAUDE.md, add these Mongoose models in /server:
- Category, SubCategory (name, slug, banner, sortOrder, status).
- Shared "option" collections, each with { name, slug, priceDeltaPaise (int), status,
  meta (Mixed) }: Material, Size, Color, Font, Border, Background, MountType, Icon.
    Size.meta = { widthMm, heightMm }
    Color.meta = { hex }
    Font.meta  = { fileUrl, format }
    Icon.meta  = { svgUrl, group }
- Product model with basePricePaise (int) and a customizationConfig object describing
  which panels are enabled, which option ids are allowed per panel, icon max, and
  textFields [{ key, label, required, maxLength }] — exactly as in docs/NameCraft-Implementation-Plan.md §5.
All priceDeltaPaise / basePricePaise use the integer-paise validator.
```
**Done when:** models compile; a product can reference options; paise validator fires on bad data.

### P1.2 🔧 Cloudinary + upload service
```
Per CLAUDE.md (invariant 7), add a server-signed Cloudinary upload service in /server:
- Multer intake for images, font files (ttf/otf/woff), and SVG icons with type+size validation.
- Endpoints for admin to upload each asset type; return the secure URL.
- SVG sanitization before storing icons.
Never expose the Cloudinary secret to the client.
```
**Done when:** admin can upload an image/font/svg and get back a Cloudinary URL; wrong file types are rejected.

### P1.3 🔧 Admin CRUD API (catalog + options)
```
Per CLAUDE.md, build admin CRUD in /server under /api/admin, all guarded by requireRole('admin'):
- Categories + SubCategories.
- A GENERIC controller factory reused for all option collections (Material, Size, Color,
  Font, Border, Background, MountType, Icon) to avoid duplication — list, create, update,
  delete, toggle status.
Validate priceDeltaPaise as integer paise on write.
```
**Done when:** each collection has working CRUD via Postman/curl; non-admin is rejected.

### P1.4 🛠️ Admin UI — categories + subcategories
```
In /client admin section (/admin/categories, /admin/subcategories), per CLAUDE.md:
- Data tables with create/edit modals (React Hook Form), banner upload, sort order,
  enable/disable, delete with confirm.
- Wire to the /api/admin category endpoints.
Clean Tailwind admin styling consistent with AdminLayout.
```
**Done when:** admin can fully manage categories + subcategories from the UI, including banner upload.

### P1.5 🛠️ Admin UI — option collections
```
In /client admin section, per CLAUDE.md, build management pages for every option collection:
/admin/materials, /admin/sizes, /admin/colors, /admin/fonts, /admin/icons,
/admin/borders, /admin/backgrounds, /admin/mounts.
Each: table + create/edit form with the collection's specific meta fields
  (Color → hex picker; Size → widthMm/heightMm; Font → file upload; Icon → svg upload + group),
  priceDeltaPaise input (entered in rupees, converted to paise before sending), status toggle.
Reuse a shared CRUD page component parameterized per collection.
```
**Done when:** every option collection is manageable; prices entered in rupees persist as integer paise.

### P1.6 🛠️ Product model + Product Builder
```
In /client admin (/admin/products), per CLAUDE.md and docs plan §8:
- Product list + create/edit.
- A Product Builder form that writes customizationConfig: toggle each panel on/off,
  multi-select which options are allowed per panel, set icon max, and define textFields.
- Base price (rupees → paise), images upload, status.
Backend: ensure /api/admin/products validates that referenced option ids exist.
```
**Done when:** admin can create a product and choose exactly which customization panels + options it exposes.

### P1.7 🔧 Seed script
```
Add /server/scripts/seed.js that creates: 2 categories, a set of options across every
collection (with real prices in paise), and ONE fully-configured demo product
("Premium Wooden Name Plate") whose customizationConfig enables material, size, font,
color, border, background, mount, icons(max 2), and textFields [familyName, subtitle].
This demo product drives all downstream testing.
```
**Done when:** `node scripts/seed.js` populates a testable catalog with one complete product.

---

## PHASE 2 — Customer storefront (read)

### P2.1 🔧 Public catalog read API
```
Per CLAUDE.md, add public read endpoints in /server:
- GET /api/categories
- GET /api/products with filters (category, subcategory), search q, sort, pagination.
- GET /api/products/:slug returning the product WITH its customizationConfig fully
  populated (each allowed option's data), so the editor can render panels directly.
Read-only, no auth required.
```
**Done when:** listing supports filter/sort/search/pagination; product-by-slug returns populated config.

### P2.2 🖥️ Home page
```
In /client storefront, build the Home page per docs plan: hero banner, featured categories,
trending, best sellers, recently added, "How It Works", reviews strip, Instagram gallery,
FAQ, footer. Feed sections from real catalog endpoints (static placeholders only where no
data source exists yet). Responsive Tailwind.
```
**Done when:** home renders from live catalog data and is responsive.

### P2.3 🖥️ Listing + product card + filters
```
In /client storefront, build category + product listing pages (/products, /products by
category) with: filter sidebar, sort dropdown, search, pagination, and a reusable
ProductCard (image, name, price from paise, discount, rating, Customize CTA → /products/:slug,
wishlist toggle, quick view). Wire to /api/products.
```
**Done when:** browsing, filtering, searching, and paginating all work against the API.

### P2.4 🖥️ Product detail shell
```
In /client storefront, build the product detail page (/products/:slug): image gallery,
product info, a placeholder slot for the LIVE CUSTOMIZATION panel (built in Phase 3),
reviews section, related products. Fetch the populated product-by-slug.
```
**Done when:** product page loads with a clearly marked empty customization slot.

---

## PHASE 3 — Configurator + pricing (the core)

### P3.1 🔧 Pricing engine + quote + validator
```
Per CLAUDE.md invariants 1–3, in /server:
- Define the designDocument shape from docs plan §4 (schemaVersion, selections with
  optionId+snapshot, text[], icons[], layout, render, pricing).
- Build a PURE computePrice(product, designDocument) that reads LIVE DB option prices,
  asserts each selected option is active and allowed by the product's config, and returns
  { breakdown[], subtotalPaise } — all integer paise.
- Build a validator that checks the designDocument against the product's customizationConfig
  (required panels present, text within maxLength, icon count <= max).
- POST /api/pricing/quote { productId, designDocument } → validates, recomputes pricing,
  refreshes selection snapshots, sets pricing.authoritative=true, returns corrected document.
Write unit tests for computePrice (this is the highest-value test in the codebase).
```
**Done when:** `/api/pricing/quote` returns server-authoritative pricing and ignores client-sent prices; unit tests pass.

### P3.2 🔧 Production render service
```
Per CLAUDE.md invariant 3 and docs plan §7, in /server build a render service that
regenerates the plate image from designDocument.layout (normalized 0..1 coordinates)
using node-canvas/Sharp, at the physical DPI implied by size.meta (mm → px), loading the
selected Font.meta.fileUrl and Icon svgs. This is the MANUFACTURING file, separate from the
browser preview. Expose it for order fulfillment (not called live during editing).
```
**Done when:** given a designDocument, the service outputs a high-res, correctly-sized render deterministically.

### P3.3 🖥️ Config-driven panels + design state
```
In /client storefront, per CLAUDE.md:
- Add a designDocument Redux slice (selections, text, icons, layout, pricing).
- Build a Customization Panel renderer that reads the product's customizationConfig and
  renders ONLY the enabled panels (material, size, font, color, border, background, mount,
  icons up to max, text fields). Selecting an option updates the slice.
Client pricing is display-only and always overwritten by the server quote (next prompt).
```
**Done when:** panels appear exactly as the product config dictates; selections update state.

### P3.4 🖥️ Fabric.js live editor + preview + price bar
```
In /client storefront, per CLAUDE.md:
- Render a Fabric.js canvas from designDocument.layout: live text, font, color, icon,
  border, background updates.
- On every change (debounced ~250ms) call POST /api/pricing/quote and show the
  server-authoritative price + breakdown in a sticky price bar. If the server corrects the
  price, update silently with a soft "price updated" toast — never block.
- Generate a preview via canvas.toDataURL for the next step.
Remember: this is the PREVIEW only, not the manufacturing file.
```
**Done when:** editing updates the canvas live and the price bar always reflects the server total.

### P3.5 🧩 Preview upload (signed)
```
Per CLAUDE.md invariant 7, add a server-signed preview upload flow: client requests a
signed upload (or posts the dataURL to a server endpoint that uploads to Cloudinary), and
the returned preview URL is stored on the designDocument.render.previewImageUrl. Wire the
"Add to Cart" button to produce the preview, upload it, then proceed to cart (Phase 4).
```
**Done when:** adding to cart yields a stored Cloudinary preview URL on the designDocument.

---

## PHASE 4 — Cart, checkout, payments, orders

### P4.1 🔧 Cart (re-validate + re-price)
```
Per CLAUDE.md, build cart in /server (/api/cart, auth required). On EVERY write
(add/update), re-run the validator and computePrice from live DB prices and store the
server unitPricePaise — never trust the client. Cart holds items[{ product, designDocument,
quantity, unitPricePaise }].
```
**Done when:** cart writes always re-price server-side; a tampered client price is overwritten.

### P4.2 🔧 Coupons
```
Per CLAUDE.md, add Coupon model (code, type flat|percentage, valuePaise or percent,
expiry, usageLimit, used) and POST /api/coupons/apply that computes discount server-side
in integer paise (percentage → floor(subtotal*pct/100)), enforcing expiry + usage limit.
One coupon per order.
```
**Done when:** valid coupons discount correctly in paise; expired/over-limit coupons are rejected.

### P4.3 🔧 Checkout quote (totals)
```
Per CLAUDE.md, add POST /api/checkout/quote that recomputes the whole order server-side:
subtotal (from re-validated cart), discount (coupon), tax/GST (rate from Settings),
shipping (rule by address/subtotal), total — all integer paise, rounding only on the final
tax line. Returns the full breakdown.
```
**Done when:** checkout quote returns a correct, fully server-computed total breakdown.

### P4.4 🔧 Razorpay + Order creation + state machine
```
Per CLAUDE.md invariants 4,5,6,8, in /server:
- POST /api/payments/razorpay/order: create a Razorpay order using ONLY the server
  checkout total.
- POST /api/payments/razorpay/verify: verify the signature server-side; on success create
  an Order that FREEZES each item's designDocument + option snapshots + previewImageUrl +
  line totals, sets payment.verified=true, seeds statusHistory with 'pending'→'confirmed',
  assigns a gapless orderNumber via an atomic counter, and clears the cart.
- Order status machine with validated transitions:
  pending→confirmed→design_review→approved→manufacturing→packed→shipped→delivered,
  plus cancelled from any non-terminal state, and a rework path from design_review.
  Reject illegal transitions.
```
**Done when:** a verified payment produces a frozen Order with a gapless number and an append-only history; bad signatures are rejected.

### P4.5 🖥️ Cart + checkout + payment UI
```
In /client storefront, build cart page (editable line items each showing their preview +
breakdown), coupon field, and a checkout flow (address form, gift wrap, order summary from
/api/checkout/quote, Razorpay payment). On success show an order confirmation.
```
**Done when:** a customer can go from customized item → cart → checkout → Razorpay test payment → confirmation.

### P4.6 🖥️ Customer dashboard
```
In /client storefront, build the customer account section: orders list + order detail
(with previews and current status), saved designs, addresses, profile, and invoice download
placeholder. Auth-guarded.
```
**Done when:** a logged-in customer sees their real orders and statuses.

---

## PHASE 5 — Admin operations

### P5.1 🔧 Admin ops API
```
Per CLAUDE.md, in /server add admin endpoints (requireRole admin):
- GET /api/admin/dashboard: total sales, today's orders, revenue, customer count, pending
  orders (all money in paise, formatted at edge).
- GET /api/admin/orders (list + filters) and GET /api/admin/orders/:id.
- PATCH /api/admin/orders/:id/status { status, note }: validates the transition and APPENDS
  to statusHistory (never overwrites).
- GET /api/admin/orders/:id/production-render: trigger/fetch the Phase 3 render service
  output per item.
```
**Done when:** admin can read metrics, list orders, transition status (validated + appended), and fetch renders.

### P5.2 🛠️ Admin dashboard UI
```
In /client admin (/admin/dashboard), build the metrics dashboard: sales, today's orders,
revenue, customers, pending, recent orders — from /api/admin/dashboard. Clean cards + a
recent-orders table.
```
**Done when:** the dashboard shows live metrics.

### P5.3 🛠️ Admin order management
```
In /client admin (/admin/orders), build order list + order detail. Detail shows each item's
preview, the frozen designDocument summary, and a status stepper. Admin can advance status
(only legal transitions offered), add a note, run the DESIGN REVIEW approve/reject with a
note, and download the production render per item.
```
**Done when:** admin can manage an order end to end, including design review and render download.

### P5.4 🛠️ Coupons, banners, settings
```
In /client admin, build CRUD pages for /admin/coupons, /admin/banners, and /admin/settings
(store name, logo, contact, socials, shipping rule, GST rate, invoice settings). Wire to
their APIs (add any missing settings/banner endpoints in /server).
```
**Done when:** coupons/banners/settings are fully editable and the GST rate flows into checkout tax.

---

## PHASE 6 — Production hardening

### P6.1 🧩 Reviews, wishlist, extras
```
Per CLAUDE.md, add Reviews (customer create + admin moderate, product rating recompute),
Wishlist, related products, Instagram gallery, and FAQ — backend + storefront UI.
```
**Done when:** reviews affect product ratings; wishlist persists per user.

### P6.2 🔧 Transactional email
```
Add Nodemailer service + templates for: order confirmation, each status change, and design
approval requests. Trigger from the order state machine transitions.
```
**Done when:** status changes send the right emails.

### P6.3 🖥️ SEO layer
```
Per docs plan §2, add a prerender/SSG layer for the public routes /products and
/products/:slug (so category + product pages are crawlable despite the SPA), plus a sitemap
and per-product meta/OG tags. Leave admin routes noindex.
```
**Done when:** product/category pages serve crawlable HTML with correct meta.

### P6.4 🧩 Invoices, analytics, hardening
```
Add: PDF invoice generation with GST + HSN, basic sales analytics, rate limiting on auth/
quote/coupon endpoints, input validation hardening, and security headers.
```
**Done when:** invoices generate correctly; abusive request rates are throttled.

### P6.5 🧩 Deploy + CI
```
Per docs plan §14: configure client → Vercel (SPA rewrite, env for API base + Razorpay
public key + Cloudinary cloud name) and server → VPS/Render (PM2 or managed, env for Mongo,
JWT, Cloudinary secret, Razorpay secret, SMTP). Add a CI pipeline: lint + typecheck +
run the pricing/state-machine unit tests + build + deploy. Document env setup in README.
```
**Done when:** both apps deploy from git; CI runs the pricing + state-machine tests on every push.

---

## Quick reference — build order at a glance

```
0  Foundation ........ monorepo, CLAUDE.md, backend core, auth, frontend shell
1  Catalog+Admin ..... models, uploads, admin CRUD (categories, options), Product Builder, seed
2  Storefront read ... catalog API, home, listing+cards, product detail shell
3  Configurator ...... pricing engine, render service, config-driven panels, Fabric editor
4  Commerce .......... cart, coupons, checkout quote, Razorpay+orders+state machine, UI, dashboard
5  Admin ops ......... metrics API, dashboard UI, order management, coupons/banners/settings
6  Hardening ......... reviews, email, SEO, invoices, deploy+CI
```

**The three prompts that carry the most weight — get these right and review the output closely:**
`P0.1` (writes CLAUDE.md — sets the rules for everything after),
`P3.1` (the pricing engine — where silent revenue bugs live),
`P4.4` (Razorpay + order freeze + state machine — the money + audit boundary).