# Greenleaf CMS — Pocketbase

Single-binary CMS with admin UI, REST API, SQLite storage. Total runtime: ~40MB RAM.

## Dev

```bash
nvm use        # Node 24 (for tsx seed scripts)
./pocketbase serve --http 127.0.0.1:3052 --origins=http://localhost:3051,http://localhost:3052
```

- Admin UI: http://localhost:3052/_/
- REST API: http://localhost:3052/api/

### First-time setup

1. Create admin user:
   ```bash
   ./pocketbase superuser create admin@yourdomain.test <your-password>
   ```
   Then put those credentials in `cms/.env`:
   ```
   ADMIN_EMAIL=admin@yourdomain.test
   ADMIN_PASSWORD=<your-password>
   POCKETBASE_URL=http://localhost:3052
   ```
2. Create collections (categories, products, pages, settings):
   ```bash
   pnpm setup
   ```
3. Seed mock data (5 categories, 27 products, 4 pages, 1 settings):
   ```bash
   pnpm seed
   ```

`pnpm setup-and-seed` runs both in sequence.

## Production (Docker)

The Dockerfile downloads the Pocketbase binary at build time. ARM64 hosts pass `--build-arg PB_ARCH=arm64`. Data persists via the `payload-db` volume mounted at `/pb/pb_data`.

## Collections

- `categories` — name, slug, description, image, order
- `products` — name, slug, excerpt, description (rich text), price, compareAtPrice, stockStatus, category (relation), tags (multi-select), images (JSON), careNotes (JSON), origin
- `pages` — title, slug, content (rich text), showInNav, showInFooter, order
- `settings` — singleton (one record): siteName, tagline, description, contactEmail, whatsappNumber, whatsappDefaultMessage, currency, social (JSON), heroSlides (JSON)

## Why Pocketbase (vs Payload)

- 10× less RAM (40MB vs 400MB)
- No Next.js build step (single binary)
- Built-in admin UI at `/_/`
- Auto SQLite + auth + file uploads + realtime
