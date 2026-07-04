# NameCraft — Name-Plate Customization E-Commerce (MERN)

Personalized name-plate customization platform. Customers design a plate in a live editor;
the server prices and validates every design authoritatively; admins manage the catalog,
orders, and manufacturing renders.

## Architecture

A monorepo with **separate frontends and one shared backend**:

| App | Path | Stack | Purpose |
|-----|------|-------|---------|
| Backend API | `server/` | Node · Express · Mongoose · JWT | Single source of truth. Auth, catalog, pricing, cart, orders, admin. |
| Customer storefront | `client-customer/` | React 19 · Vite · Tailwind · Redux Toolkit · React Router · React Hook Form | Browse, customize, buy. |
| Admin panel | `client-admin/` | React 19 · Vite · Tailwind · Redux Toolkit · React Router · React Hook Form | Catalog CRUD, orders, operations. Role-guarded. |

Both frontends hit the **same API and the same MongoDB**, so their data is always in sync.
There is exactly one backend and one database.

Project rules and the build plan live in [`CLAUDE.md`](./CLAUDE.md) and [`docs/`](./docs).

## Prerequisites

- Node 20+ (tested on 22)
- A MongoDB connection string (local `mongodb://127.0.0.1:27017/namecraft` or Atlas)
- Later phases: Cloudinary account, Razorpay test keys, an SMTP sender

## Setup

```bash
# 1. Install everything (root + server + both clients)
npm run install:all

# 2. Configure env (copy the examples and fill them in)
cp server/.env.example          server/.env
cp client-customer/.env.example client-customer/.env
cp client-admin/.env.example    client-admin/.env

# 3. Seed an admin user (needs server/.env with a Mongo URI)
npm run seed:admin

# 4. Run all three apps together
npm run dev
```

`npm run dev` starts:

| Service | URL (default) |
|---------|---------------|
| Backend API | http://localhost:5000 |
| Customer storefront | http://localhost:5173 |
| Admin panel | http://localhost:5174 |

Health check: `GET http://localhost:5000/health`.

## Scripts (root)

| Script | Does |
|--------|------|
| `npm run dev` | Run server + both clients together (via `concurrently`) |
| `npm run install:all` | Install deps in root, server, and both clients |
| `npm run build` | Production build both clients |
| `npm run start` | Start the server only (production) |
| `npm run seed:admin` | Create/seed the initial admin user |
| `npm run lint` | Lint both clients |

## Build phases

See [`docs/NameCraft-Prompting-Playbook.md`](./docs/NameCraft-Prompting-Playbook.md).
Currently implemented: **Phase 0 — Foundation** (scaffold, auth, frontend shells).
