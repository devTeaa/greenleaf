# VPS deploy — step by step

Assumes: fresh Ubuntu/Debian VPS, you have root/sudo, DNS A records for
`greenleaf.example` + `cms.greenleaf.example` already point to the VPS IP.
Replace `greenleaf.example` with your actual domain throughout.

## 1. Install prerequisites (one-time)

```bash
# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker  # pick up the new group without re-logging-in

# Node 24 (needed for setup scripts and the Nuxt build)
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc  # or: exec $SHELL
fnm install 24
fnm default 24

# pnpm
corepack enable
```

## 2. Clone the repo

```bash
cd ~
git clone <your-repo-url> greenleaf
cd greenleaf
```

## 3. Configure (interactive Q&A)

```bash
fnm use
pnpm install
pnpm setup
```

Pick **shared mode**, ports `3051` (Nuxt) + `3052` (Pocketbase),
domain `greenleaf.example`, CMS subdomain `cms.greenleaf.example`. The CLI
writes `.env.production` + `greenleaf.config.json` + `cms/.env` automatically.

> Tip: if you already configured these locally, you can `scp` your local
> `.env.production` + `greenleaf.config.json` to the VPS instead of re-running
> the wizard:
> ```bash
> # from your Mac
> scp .env.production greenleaf.config.json root@VPS_IP:~/greenleaf/
> scp cms/.env root@VPS_IP:~/greenleaf/cms/
> ```

## 4. Build the storefront (Nuxt SSR bundle)

```bash
cd web && pnpm install && pnpm build && cd ..
```

Skip this only if you pre-built `.output/` locally and rsynced it up.

## 5. Start the stack

```bash
docker compose up -d --build
```

Verify:
```bash
docker compose ps                          # both cms + nuxt should be "Up"
curl http://127.0.0.1:3052/api/health      # → {"message":"API is healthy."}
curl -I http://127.0.0.1:3051/             # → HTTP/1.1 200
```

## 6. First-time Pocketbase setup

```bash
# Create admin user (uses creds from .env.production)
docker exec greenleaf-cms /pb/pocketbase superuser create \
  "$(grep POCKETBASE_ADMIN_EMAIL .env.production | cut -d= -f2)" \
  "$(grep POCKETBASE_ADMIN_PASSWORD .env.production | cut -d= -f2)"

# Create collections + seed mock data
cd cms && pnpm install && pnpm setup && pnpm seed && cd ..

# Push brand values (site name, WhatsApp #, social, etc.) into Pocketbase
pnpm apply-brand
```

## 7. Configure the VPS Nginx reverse proxy

The site config lives in `nginx-sites/` locally (gitignored). Easiest: scp it up.

```bash
# from your Mac
scp nginx-sites/<your-config>.conf root@VPS_IP:/etc/nginx/conf.d/
```

Or, on the VPS, copy from the generic template and edit:
```bash
sudo cp docs/nginx-shared-vps-example.conf /etc/nginx/conf.d/greenleaf.conf
sudo nano /etc/nginx/conf.d/greenleaf.conf   # set server_name + ports
sudo nginx -t && sudo systemctl reload nginx
```

## 8. SSL via certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx --expand \
  -d greenleaf.example \
  -d cms.greenleaf.example
```

Certbot will rewrite the Nginx config to add the SSL lines + HTTP→HTTPS redirect.
Reload once more just in case:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 9. Verify

Visit:
- **https://greenleaf.example** → storefront with hero, products, etc.
- **https://cms.greenleaf.example** → 301 redirect to `/_/` (admin login)
- Log in with `POCKETBASE_ADMIN_EMAIL` + `POCKETBASE_ADMIN_PASSWORD` from `.env.production`

## Common operations after deploy

```bash
docker compose logs -f nuxt         # tail storefront logs
docker compose logs -f cms          # tail Pocketbase logs
docker compose restart nuxt         # restart after env change
docker compose pull && docker compose up -d  # update after git pull
docker compose down                 # stop everything
```

## Updating Greenleaf

```bash
cd ~/greenleaf
git pull
cd web && pnpm install && pnpm build && cd ..
docker compose up -d --build
```

Pocketbase data (SQLite + uploads) persists in the `cms-db` Docker volume —
safe across restarts, redeploys, and `docker compose down`.
