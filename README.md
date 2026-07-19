# Greenleaf

Plant catalog storefront — Pocketbase backend + Nuxt 4 SSR storefront + Vue CSR admin.

## Stack

| Layer | Tech | Dev port | Prod host port |
|---|---|---|---|
| Backend | Pocketbase v0.39 (Go binary) | `3052` | `${BACKEND_PORT:-3052}` |
| Storefront | Nuxt 4 + TypeScript (SSR) | `3051` | `${NUXT_PORT:-3051}` |
| Admin | Vue 3 + Vite (CSR SPA) | `3053` | `${ADMIN_PORT:-3053}` |
| DB | SQLite (embedded in Pocketbase) | — | — |
| Ordering | WhatsApp deep links (no online payment) | — |
| SEO | `@nuxtjs/seo` (sitemap, robots, JSON-LD, OG meta) | — |

## Quick start (dev)

> **Requires Node 24+**. Run `nvm use` once on entry.

```bash
# Terminal 1 — Pocketbase backend
cd backend
./pocketbase serve --http 127.0.0.1:3052 --origins=http://localhost:3051,http://localhost:3052,http://localhost:3053

# Terminal 2 — storefront (SSR)
cd web && nvm use && pnpm install && pnpm dev

# Terminal 3 — admin SPA (optional)
cd admin && nvm use && pnpm install && pnpm dev
```

First-time setup (run once):
```bash
cd backend
./pocketbase superuser create admin@yourdomain.test <password>
pnpm install && pnpm setup    # create collections
pnpm seed                     # seed mock data (5 categories, 27 products)
```

## Project layout

```
greenleaf/
├── backend/                     # Pocketbase (API + data + raw admin at /_/)
│   ├── pocketbase               # Go binary (gitignored, downloaded at deploy)
│   ├── scripts/
│   │   ├── setup-schema.ts      # creates collections via REST API
│   │   └── seed.ts              # seeds 27 products, 5 categories, 4 pages, settings
│   ├── pb_data/                 # SQLite db + uploads (gitignored)
│   └── Dockerfile
├── web/                         # Nuxt storefront (SSR, public-facing)
│   ├── app/
│   │   ├── components/          # Header, Footer, ProductCard, WishlistDrawer, …
│   │   ├── composables/         # usePayloadApi, useSite, useNav, useWishlist
│   │   ├── pages/               # index, shop, shop/[slug], category/[slug], [slug]
│   │   └── assets/css/main.css  # Tailwind v4 + brand tokens
│   └── Dockerfile
├── cms/                         # Vue CSR admin SPA (internal tool)
│   ├── src/
│   │   ├── views/               # Login, Dashboard, Products, Categories, Settings
│   │   ├── layouts/             # AdminLayout (sidebar nav)
│   │   └── lib/                 # pb.ts (Pocketbase SDK), router.ts (auth guard)
│   └── Dockerfile
├── docker-compose.yml           # backend + nuxt + admin (+ optional nginx)
├── scripts/
│   ├── setup-cli.ts             # interactive production setup wizard
│   └── apply-brand.ts           # push brand config to Pocketbase
└── .env.production.example
```

## Architecture

- `backend/` exposes `/api/*` (REST) and `/_/` (raw Pocketbase admin). Talks to `web` via internal Docker network (`http://backend:3001`).
- `web/` is the **public** storefront. Server-side fetches use the internal Docker URL; client-side fetches use the public backend domain.
- `cms/` is the **custom admin UI** (Vue SPA). Authenticates via Pocketbase superuser, talks to the backend REST API directly from the browser.

## Deploy (production)

### 1. Provision a VPS

- Hetzner CX22 / DigitalOcean / similar (~$5/mo, 2GB RAM)
- Ubuntu 22.04+, ports 80 + 443 open
- DNS A records:
  - `greenleaf.example` → VPS IP
  - `greenleaf-backend.example` → VPS IP

### 2. Configure

```bash
pnpm setup    # interactive Q&A wizard
```

Writes `.env.production`, `greenleaf.config.json`, and `backend/.env`.

### 3. Start the stack

```bash
docker compose up -d --build
```

### 4. Nginx + SSL

See `docs/DEPLOY.md` for the full step-by-step guide including Nginx config and certbot.

See `docs/nginx-shared-vps-example.conf` for a generic Nginx template.

## License

MIT
