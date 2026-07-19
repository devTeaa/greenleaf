# Deployment docs

## Files

- **[`nginx-shared-vps-example.conf`](./nginx-shared-vps-example.conf)** — Generic Nginx
  reverse-proxy config for running Greenleaf on a VPS that already hosts other apps.
  Copy this file to `/etc/nginx/conf.d/greenleaf.conf` on your VPS, edit the
  `server_name` + cert paths, then `nginx -t && systemctl reload nginx`.

## Two deploy modes

### Shared VPS (default) — recommended when other apps already run on the VPS

- The stack exposes Nuxt and Pocketbase on `127.0.0.1:3051` and `127.0.0.1:3052`
- Your existing Nginx (or Caddy / Traefik) routes:
  - `greenleaf.example` → `127.0.0.1:3051`
  - `cms.greenleaf.example` → `127.0.0.1:3052`
- Ports are configurable via `.env.production` (`NUXT_PORT`, `CMS_PORT`)

```bash
docker compose up -d          # starts only cms + nuxt (no bundled nginx)
```

### Standalone — Greenleaf owns the whole VPS

- The stack includes a bundled Nginx that listens on 80/443 and routes between
  Nuxt and Pocketbase internally.
- Use this only when nothing else on the VPS needs ports 80/443.

```bash
docker compose --profile full up -d
```

## First-time setup

After `docker compose up -d`, run on the VPS:

```bash
# Create admin user (use the email/password from .env.production)
docker exec greenleaf-cms /pb/pocketbase superuser create \
  $(grep POCKETBASE_ADMIN_EMAIL .env.production | cut -d= -f2) \
  $(grep POCKETBASE_ADMIN_PASSWORD .env.production | cut -d= -f2)

# Create Pocketbase schema (collections) + seed mock data
cd cms
pnpm install
pnpm setup
pnpm seed
cd ..

# Apply brand values (site name, WhatsApp number, social, etc.) from greenleaf.config.json
pnpm apply-brand
```

## Issuing SSL certs

Use certbot (Let's Encrypt) on the VPS:

```bash
sudo certbot --nginx --expand \
  -d greenleaf.example \
  -d cms.greenleaf.example
```

Or terminate TLS at Cloudflare (Full Strict mode) and skip certbot entirely — the
example Nginx config works with either approach (just comment out the
`ssl_certificate` lines if you're using Cloudflare's "Flexible" mode).
