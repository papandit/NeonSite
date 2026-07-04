# NameCraft — Name-Plate Customization E-Commerce (MERN)

Personalized name-plate customization platform. Customers design a plate in a **live Fabric.js
editor** with **server-authoritative pricing**; admins manage the catalog, orders, and
manufacturing renders. Money is handled as **integer paise** end-to-end.

## Architecture

A monorepo with **separate frontends and one shared backend**:

| App | Path | Stack | URL (dev) |
|-----|------|-------|-----------|
| Backend API | `server/` | Node · Express · Mongoose · JWT | http://localhost:5000 |
| Customer storefront | `client-customer/` | React 19 · Vite · Tailwind · Redux · Fabric.js | http://localhost:5173 |
| Admin panel | `client-admin/` | React 19 · Vite · Tailwind · Redux | http://localhost:5174 |

Both frontends hit the **same API and MongoDB**, so data is always in sync. Project rules live
in [`CLAUDE.md`](./CLAUDE.md); specs in [`docs/`](./docs).

## Features (Phases 0–6)

- **Auth & RBAC** — JWT, `requireAuth` / `requireRole('admin')`.
- **Catalog** — categories, 8 option collections, products with a `customizationConfig`; admin CRUD + Product Builder.
- **Storefront** — home, listing (filter/sort/search/paginate), product detail.
- **Configurator** — Fabric.js live editor, config-driven panels, **server-authoritative `/pricing/quote`**, node-canvas production render, signed preview upload.
- **Commerce** — cart (re-priced every write), coupons, checkout (GST + shipping), **Razorpay** (real + mock), frozen orders with **gapless order numbers** and an **append-only status machine**.
- **Admin ops** — dashboard metrics, order management (validated transitions, design review, production-render download), coupons/banners/settings, reviews moderation, analytics.
- **Hardening** — reviews + per-user wishlist, transactional email, SEO (sitemap/robots/meta), PDF invoices (GST + HSN), rate limiting, security headers.

## Prerequisites

- Node 20+ (tested on 22)
- MongoDB (local `mongodb://127.0.0.1:27017/namecraft` or Atlas)
- Optional (features degrade gracefully without them): Cloudinary, Razorpay test keys, an SMTP sender

## Setup

```bash
npm run install:all                      # root + server + both clients

cp server/.env.example          server/.env
cp client-customer/.env.example client-customer/.env
cp client-admin/.env.example    client-admin/.env

npm run seed:admin   # create the admin user
npm run seed         # load the demo catalog + coupons
npm run dev          # run all three apps together
```

Default admin: **admin@namecraft.local / Admin@12345**. Health: `GET /health`.

## Environment variables

### `server/.env`

| Var | Required | Notes |
|-----|----------|-------|
| `MONGODB_URI` | ✅ | Mongo connection string |
| `JWT_SECRET` | ✅ | Long random string |
| `PORT` | | Default 5000 |
| `CLIENT_CUSTOMER_ORIGIN` / `CLIENT_ADMIN_ORIGIN` | | CORS origins |
| `SITE_URL` | | Public storefront URL (sitemap/canonical) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Phase 1+ | Server-signed uploads; without them the admin pastes URLs |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | Phase 4+ | Without them payments run in **mock mode** |
| `SMTP_HOST` / `_PORT` / `_USER` / `_PASS` / `MAIL_FROM` | Phase 6 | Without them emails are **logged**, not sent |

### `client-customer/.env` & `client-admin/.env` (public only)

| Var | Notes |
|-----|-------|
| `VITE_API_BASE_URL` | Backend API base, e.g. `http://localhost:5000/api` |
| `VITE_RAZORPAY_KEY_ID` | (customer) public Razorpay key for the live widget |
| `VITE_CLOUDINARY_CLOUD_NAME` | (customer) optional |

## Scripts (root)

| Script | Does |
|--------|------|
| `npm run dev` | Run server + both clients (concurrently) |
| `npm run install:all` | Install all deps |
| `npm run build` | Production-build both clients |
| `npm run seed` / `npm run seed:admin` | Seed catalog / admin user |
| `npm test` (in `server/`) | Pricing + state-machine unit tests |
| `npm run lint` | Lint both clients |

## Testing

```bash
cd server && npm test    # pricing engine + order state machine (the must-cover units)
```

## Deployment

- **Frontends → Vercel:** set the project root to `client-customer/` (and a second project for
  `client-admin/`). `vercel.json` in each provides the SPA rewrite. Env: `VITE_API_BASE_URL`
  (+ `VITE_RAZORPAY_KEY_ID`, `VITE_CLOUDINARY_CLOUD_NAME`).
- **Backend → Render / VPS:** run `node src/index.js` (or `pm2 start ecosystem.config.cjs
  --env production`). Env: `MONGODB_URI`, `JWT_SECRET`, Cloudinary, Razorpay, SMTP, origins.
- **DB → Atlas:** IP-allowlist the backend host; daily backups; separate dev/prod clusters.
- **SEO:** `/sitemap.xml` + `/robots.txt` are served by the API; per-page meta via react-helmet.
  For full bot-prerendering of `/products/*`, add a prerender step at the Vercel layer.

## CI

`.github/workflows/ci.yml` runs on every push: installs deps, runs the server unit tests
(pricing + state machine), and lints + builds both clients.
