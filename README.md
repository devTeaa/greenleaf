# Greenleaf

Plant catalog storefront MVP — headless architecture with Payload CMS backend and Nuxt 4 storefront.

## Stack

| Layer | Tech | Dev port | Prod host port |
|---|---|---|---|
| Backend / Admin | Pocketbase v0.39 (Go binary) | `3052` | `${CMS_PORT:-3052}` |
| Storefront | Nuxt 4 + TypeScript | `3051` | `${NUXT_PORT:-3051}` |
| DB | SQLite (`file:.data/payload.db`) — upgrade to Postgres later | — |
| Ordering | WhatsApp deep links (no online payment) | — |
| SEO | `@nuxtjs/seo` (sitemap, robots, JSON-LD, OG meta) | — |

## Quick start (dev)

> **Requires Node 24+**. This project pins Node via `.nvmrc` — run `nvm use` once on entry.

```bash
# Terminal 1 — Pocketbase CMS
cd cms
./pocketbase serve --http 127.0.0.1:3052 --origins=http://localhost:3051,http://localhost:3052
# Admin UI:    http://localhost:3052/_/  (create admin on first visit)
# REST API:    http://localhost:3052/api/

# Terminal 2 — storefront
cd web && nvm use && pnpm install && pnpm dev
# Storefront:  http://localhost:3051
```

First-time setup scripts (run once each):
```bash
cd cms
./pocketbase superuser create admin@yourdomain.test <your-password>   # create admin
pnpm setup       # create collections (categories, products, pages, settings)
pnpm seed        # seed mock data (5 categories, 27 products, 4 pages)
```

## Project layout

```
greenleaf/
├── cms/                        # Payload CMS (backend + admin UI)
│   ├── src/
│   │   ├── collections/        # Users, Media, Products, Categories, Pages
│   │   ├── globals/Settings.ts # Site config: WhatsApp #, social, hero slides
│   │   ├── seed.ts             # Idempotent seed script
│   │   └── payload.config.ts
│   └── .data/                  # SQLite db file (gitignored)
├── web/                        # Nuxt storefront
│   ├── app/
│   │   ├── components/         # Header, Footer, ProductCard, WishlistDrawer, …
│   │   ├── composables/        # usePayloadApi, useSite, useNav, useWishlist
│   │   ├── pages/              # index, shop, shop/[slug], category/[slug], [slug]
│   │   └── assets/css/main.css # Tailwind v4 + brand tokens
│   ├── server/                 # Nitro routes (sitemap source)
│   └── Dockerfile
├── nginx/
│   ├── Dockerfile              # nginx:alpine minus welcome page
│   └── nginx.conf              # Subdomain routing
├── docker-compose.yml          # payload + nuxt + nginx
└── .env.production.example
```

## Architecture

- `cms/` is **internal** — customers never see it. Exposes `/admin/*` (Payload dashboard) and `/api/*` (REST + GraphQL).
- `web/` is the **public** storefront. Talks to Payload over HTTP.
- Communication: `web → cms:3001/api/*` via internal Docker network in production. (Host port defaults to 3052 to avoid conflicts on shared VPS.)

## Deploy (production)

### 1. Provision a VPS

- Hetzner CX22 / DigitalOcean droplet / similar (~$5/mo, 2GB RAM)
- Ubuntu 22.04+, ports 80 + 443 open
- Point DNS:
  - `greenleaf.example` → VPS IP
  - `cms.greenleaf.example` → VPS IP
- Cloudflare in front (Full Strict SSL mode) recommended

### 2. Install Docker on the VPS

```bash
ssh root@your-vps
apt update && apt install -y docker.io docker-compose-plugin git
systemctl enable --now docker
```

### 3. Configure

Run the interactive setup CLI from the project root:

```bash
pnpm setup
```

The CLI walks you through:

1. **Domain** — `greenleaf.example` + optional `www` redirect + CMS subdomain
2. **Brand** — site name, tagline, description, WhatsApp number, contact email, currency
3. **Social** — Instagram / Facebook / TikTok / YouTube URLs (all optional)
4. **Admin credentials** — email + generated or custom password
5. Writes `.env.production`, `greenleaf.config.json`, and `cms/.env`
6. Optionally applies brand values to Pocketbase if the stack is running

Files written (all gitignored — local secrets):
- `.env.production` — consumed by `docker compose`
- `greenleaf.config.json` — your brand config, used by `pnpm apply-brand`
- `cms/.env` — admin credentials for the schema/seed scripts

#### Re-run any time

```bash
pnpm setup          # full interactive Q&A
pnpm apply-brand    # re-apply just the brand to Pocketbase (after editing greenleaf.config.json)
```

To change only the WhatsApp number later: edit `greenleaf.config.json` → run `pnpm apply-brand` → done.

### 4. Build locally + push (or build on VPS)

The Next.js production build needs ~4GB RAM. If your VPS is small, build locally first:

```bash
# On your dev machine
cd cms && nvm use && pnpm install && pnpm build    # produces cms/.next/
cd ../web && nvm use && pnpm install && pnpm build # produces web/.output/
cd ..
rsync -avz --exclude node_modules --exclude .git . root@your-vps:/root/greenleaf
```

### 5. Start the stack

```bash
ssh root@your-vps
cd greenleaf
docker compose up -d
docker compose logs -f  # verify all 3 containers come up cleanly
```

### 6. Create admin user

Open `https://cms.greenleaf.example/admin` — you'll be prompted to create the first admin user.

### Verification

| URL | Expected |
|---|---|
| `https://greenleaf.example/` | Storefront home with hero + products |
| `https://greenleaf.example/sitemap.xml` | 23+ URLs from Payload |
| `https://greenleaf.example/shop/monstera-albo-variegata` | Product detail |
| `https://cms.greenleaf.example/admin` | Payload login |

### Operations

```bash
docker compose logs -f nuxt      # storefront logs
docker compose logs -f payload   # CMS logs
docker compose restart nuxt      # restart after env change
docker compose pull && docker compose up -d  # update images
docker compose down              # stop everything
```

## Roadmap

- [x] Phase 1 — Scaffold both apps
- [x] Phase 1.5 — Lock Node 24 (after VM error fix)
- [x] Phase 2 — Payload schema (Products, Categories, Pages, Settings) + seed
- [x] Phase 3 — Nuxt data layer (API client + types + composables)
- [x] Phase 4 — Storefront UI (home, shop, product detail, category, static pages)
- [x] Phase 5 — WhatsApp flows (per-product + wishlist drawer)
- [x] Phase 6 — SEO (`@nuxtjs/seo`: sitemap, robots, JSON-LD, OG)
- [x] Phase 7 — Deploy (Docker Compose + Nginx + Cloudflare)

### Future enhancements
- [ ] Switch SQLite → Postgres (proper migrations, scaling)
- [ ] Real plant photos via Media collection (replace placeholder URLs)
- [ ] @nuxt/image for responsive srcset + AVIF
- [ ] Online checkout (Stripe/PayPal) — Phase 8 if needed
- [ ] Multi-currency switcher
- [ ] Admin auth via email magic link
