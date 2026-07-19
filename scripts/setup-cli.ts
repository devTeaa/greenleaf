import * as p from '@clack/prompts'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const ROOT = path.resolve(import.meta.dirname, '..')

type DeployMode = 'shared' | 'standalone'

type Config = {
  deployMode: DeployMode
  domain: string
  useWww: boolean
  cmsSubdomain: string
  // Shared mode: ports for Nuxt + CMS (host-bound)
  nuxtPort: number
  cmsPort: number
  nuxtBind: string
  cmsBind: string
  // Standalone mode: bundled Nginx ports
  nginxHttpPort: number
  nginxHttpsPort: number
  // Brand
  siteName: string
  tagline: string
  description: string
  whatsappNumber: string
  whatsappDefaultMessage: string
  contactEmail: string
  currency: 'USD' | 'THB' | 'EUR'
  social: { instagram?: string; facebook?: string; tiktok?: string; youtube?: string }
  adminEmail: string
  adminPassword: string
  encryptionKey: string
}

const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

function bail(message = 'Setup cancelled.') {
  p.cancel(message)
  process.exit(0)
}

function isValidDomain(d: string): boolean {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(d)
}
function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}
function isValidWhatsApp(v: string): boolean {
  const d = v.replace(/[^\d]/g, '')
  return d.length >= 8 && d.length <= 15
}
function normalizeWhatsApp(v: string): string {
  return v.replace(/[^\d]/g, '')
}
function generatePassword(length = 16): string {
  const bytes = crypto.randomBytes(length)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length]
  return out
}
function generateEncryptionKey(): string {
  return crypto.randomBytes(16).toString('hex')
}

function loadExistingConfig(): Partial<Config> | null {
  const envPath = path.join(ROOT, '.env.production')
  const configPath = path.join(ROOT, 'greenleaf.config.json')
  const out: Partial<Config> = {}
  if (fs.existsSync(configPath)) {
    try {
      Object.assign(out, JSON.parse(fs.readFileSync(configPath, 'utf8')))
    } catch {}
  }
  if (fs.existsSync(envPath)) {
    const text = fs.readFileSync(envPath, 'utf8')
    const m = text.match(/^NUXT_PUBLIC_SITE_URL=(.+)$/m)
    if (m) out.domain = m[1].replace(/^https?:\/\/(?:www\.)?/, '').replace(/\/$/, '')
  }
  return Object.keys(out).length ? out : null
}

async function main() {
  p.intro(`${GREEN}🌿 Greenleaf production setup${RESET}`)

  const existing = loadExistingConfig()

  // ----- 1. Deployment mode -----
  const deployMode = (await p.select({
    message: 'Deployment mode',
    initialValue: existing?.deployMode ?? 'shared',
    options: [
      {
        value: 'shared',
        label: 'Shared VPS — Greenleaf runs alongside other apps',
        hint: 'you provide the reverse proxy; we expose Nuxt + CMS on localhost ports',
      },
      {
        value: 'standalone',
        label: 'Standalone — Greenleaf owns the whole VPS',
        hint: 'bundled Nginx listens on 80/443',
      },
    ],
  })) as DeployMode | symbol
  if (p.isCancel(deployMode)) return bail()
  const mode = deployMode as DeployMode

  // ----- 2. Ports -----
  let nuxtPort = 3051
  let cmsPort = 3052
  let nuxtBind = '127.0.0.1'
  let cmsBind = '127.0.0.1'
  let nginxHttpPort = 80
  let nginxHttpsPort = 443

  if (mode === 'shared') {
    p.note(
      'Greenleaf will bind to localhost only — your VPS Nginx (or Caddy/Traefik)\nroutes external traffic to these ports.',
      'Shared VPS ports',
    )

    const np = await p.text({
      message: 'Nuxt (storefront) port on host',
      initialValue: String(existing?.nuxtPort ?? 3051),
      validate: (v) => (!/^\d+$/.test(v ?? '') ? 'Must be a number' : undefined),
    })
    if (p.isCancel(np)) return bail()
    nuxtPort = Number(np)

    const cp = await p.text({
      message: 'Pocketbase (CMS) port on host',
      initialValue: String(existing?.cmsPort ?? 3052),
      validate: (v) => (!/^\d+$/.test(v ?? '') ? 'Must be a number' : undefined),
    })
    if (p.isCancel(cp)) return bail()
    cmsPort = Number(cp)

    const bindToAll = await p.confirm({
      message: `Bind to all interfaces (0.0.0.0) instead of localhost?`,
      initialValue: false,
    })
    if (p.isCancel(bindToAll)) return bail()
    if (bindToAll) {
      nuxtBind = '0.0.0.0'
      cmsBind = '0.0.0.0'
      p.log.warn(DIM + 'Ports will be public — make sure your firewall blocks direct access.' + RESET)
    }
  } else {
    p.note('Bundled Nginx will listen on 80/443 and route between Nuxt and Pocketbase.', 'Standalone')

    const hp = await p.text({
      message: 'HTTP port',
      initialValue: String(existing?.nginxHttpPort ?? 80),
      validate: (v) => (!/^\d+$/.test(v ?? '') ? 'Must be a number' : undefined),
    })
    if (p.isCancel(hp)) return bail()
    nginxHttpPort = Number(hp)

    const hsp = await p.text({
      message: 'HTTPS port',
      initialValue: String(existing?.nginxHttpsPort ?? 443),
      validate: (v) => (!/^\d+$/.test(v ?? '') ? 'Must be a number' : undefined),
    })
    if (p.isCancel(hsp)) return bail()
    nginxHttpsPort = Number(hsp)
  }

  // ----- 3. Domain -----
  const domain = await p.text({
    message: 'Production domain',
    placeholder: 'greenleaf.example',
    initialValue: existing?.domain,
    validate: (v) => {
      if (!v?.trim()) return 'Domain is required'
      if (!isValidDomain(v.trim())) return 'Looks invalid — use format like greenleaf.example'
    },
  })
  if (p.isCancel(domain)) return bail()
  const domainValue = (domain as string).trim()

  const useWww = await p.confirm({
    message: `Redirect www.${domainValue} → ${domainValue}?`,
    initialValue: true,
  })
  if (p.isCancel(useWww)) return bail()

  const cmsSubdomain = await p.text({
    message: 'CMS / admin subdomain',
    initialValue: existing?.cmsSubdomain ?? `cms.${domainValue}`,
    validate: (v) => (!v?.trim() ? 'Required' : !isValidDomain(v.trim()) ? 'Invalid' : undefined),
  })
  if (p.isCancel(cmsSubdomain)) return bail()

  // ----- 4. Brand -----
  p.note('Brand identity — shown across the storefront, footer, and SEO meta.', 'Brand')

  const siteName = await p.text({
    message: 'Site name',
    initialValue: existing?.siteName ?? 'Greenleaf',
    validate: (v) => (!v?.trim() ? 'Required' : undefined),
  })
  if (p.isCancel(siteName)) return bail()

  const tagline = await p.text({
    message: 'Tagline (hero subtitle / meta description)',
    initialValue: existing?.tagline ?? 'Rare Variegated Plants from Thailand',
  })
  if (p.isCancel(tagline)) return bail()

  const description = await p.text({
    message: 'Long description (used for SEO meta)',
    initialValue:
      existing?.description ??
      'Curated rare variegated aroids — Monstera, Philodendron, Alocasia, Anthurium. Shipped worldwide from Thailand.',
  })
  if (p.isCancel(description)) return bail()

  const whatsappRaw = await p.text({
    message: 'WhatsApp number (international, digits only — e.g. 15551234567)',
    placeholder: '15551234567',
    initialValue: existing?.whatsappNumber,
    validate: (v) => (!isValidWhatsApp(v ?? '') ? 'Enter 8–15 digits' : undefined),
  })
  if (p.isCancel(whatsappRaw)) return bail()

  const whatsappDefaultMessage = await p.text({
    message: 'Default WhatsApp message (when customer clicks chat button)',
    initialValue: existing?.whatsappDefaultMessage ?? `Hi ${siteName}! I'm interested in your plants.`,
  })
  if (p.isCancel(whatsappDefaultMessage)) return bail()

  const contactEmail = await p.text({
    message: 'Contact email (shown in footer)',
    placeholder: `hello@${domainValue}`,
    initialValue: existing?.contactEmail,
    validate: (v) => (v && !isValidEmail(v) ? 'Invalid email' : undefined),
  })
  if (p.isCancel(contactEmail)) return bail()

  const currency = (await p.select({
    message: 'Display currency',
    initialValue: existing?.currency ?? 'USD',
    options: [
      { value: 'USD', label: 'USD $ (US Dollar)' },
      { value: 'THB', label: 'THB ฿ (Thai Baht)' },
      { value: 'EUR', label: 'EUR € (Euro)' },
    ],
  })) as Config['currency']
  if (p.isCancel(currency)) return bail()

  // ----- 5. Social (optional) -----
  p.note('Optional — press Enter to skip any.', 'Social links')

  const instagram = await p.text({
    message: 'Instagram URL',
    placeholder: 'https://instagram.com/yourhandle',
    initialValue: existing?.social?.instagram,
  })
  if (p.isCancel(instagram)) return bail()

  const facebook = await p.text({
    message: 'Facebook URL',
    placeholder: 'https://facebook.com/yourpage',
    initialValue: existing?.social?.facebook,
  })
  if (p.isCancel(facebook)) return bail()

  const tiktok = await p.text({
    message: 'TikTok URL',
    placeholder: 'https://tiktok.com/@yourhandle',
    initialValue: existing?.social?.tiktok,
  })
  if (p.isCancel(tiktok)) return bail()

  const youtube = await p.text({
    message: 'YouTube URL',
    placeholder: 'https://youtube.com/@yourchannel',
    initialValue: existing?.social?.youtube,
  })
  if (p.isCancel(youtube)) return bail()

  // ----- 6. Admin credentials -----
  p.note(
    mode === 'shared'
      ? `Credentials for the Pocketbase admin dashboard at https://${(cmsSubdomain as string).trim()}/_/`
      : 'Credentials for the Pocketbase admin dashboard at /_/',
    'Admin account',
  )

  const adminEmail = await p.text({
    message: 'Admin email',
    initialValue: existing?.adminEmail ?? `admin@${domainValue}`,
    validate: (v) => (!isValidEmail(v ?? '') ? 'Invalid email' : undefined),
  })
  if (p.isCancel(adminEmail)) return bail()

  const useGeneratedPassword = await p.confirm({
    message: 'Generate a strong admin password?',
    initialValue: !existing?.adminPassword,
  })
  if (p.isCancel(useGeneratedPassword)) return bail()

  let adminPassword: string
  if (useGeneratedPassword) {
    adminPassword = generatePassword(16)
    p.log.success(`Generated password: ${GREEN}${adminPassword}${RESET}`)
    p.log.warn(DIM + 'Save this — you will need it to log in to the CMS.' + RESET)
  } else {
    const pw = await p.password({
      message: 'Admin password (min 10 chars)',
      validate: (v) => (!v || v.length < 10 ? 'At least 10 characters' : undefined),
    })
    if (p.isCancel(pw)) return bail()
    adminPassword = String(pw)
  }

  // ----- 7. Build config -----
  const config: Config = {
    deployMode: mode,
    domain: domainValue,
    useWww: useWww as boolean,
    cmsSubdomain: (cmsSubdomain as string).trim(),
    nuxtPort,
    cmsPort,
    nuxtBind,
    cmsBind,
    nginxHttpPort,
    nginxHttpsPort,
    siteName: (siteName as string).trim(),
    tagline: (tagline as string).trim() || 'Rare Variegated Plants from Thailand',
    description: (description as string).trim(),
    whatsappNumber: normalizeWhatsApp(whatsappRaw as string),
    whatsappDefaultMessage: (whatsappDefaultMessage as string).trim(),
    contactEmail: (contactEmail as string).trim() || `hello@${domainValue}`,
    currency,
    social: {
      instagram: (instagram as string).trim() || undefined,
      facebook: (facebook as string).trim() || undefined,
      tiktok: (tiktok as string).trim() || undefined,
      youtube: (youtube as string).trim() || undefined,
    },
    adminEmail: (adminEmail as string).trim(),
    adminPassword,
    encryptionKey: existing?.encryptionKey ?? generateEncryptionKey(),
  }

  const confirmed = await p.confirm({
    message: 'Write configuration files?',
    initialValue: true,
  })
  if (!confirmed || p.isCancel(confirmed)) return bail('No files written.')

  // ----- 8. Write files -----
  const envLines = [
    '# Greenleaf production environment',
    '# Generated by `pnpm setup` — edit manually if needed.',
    '',
    '# ----- Deployment mode -----',
    `# shared   = Nuxt + CMS exposed on localhost ports (you provide reverse proxy)`,
    `# standalone = bundled Nginx on 80/443`,
    `# COMPOSE_PROFILES is set automatically based on deployMode below.`,
    `DEPLOY_MODE=${mode}`,
    '',
    '# ----- Storefront (Nuxt) -----',
    `NUXT_PUBLIC_SITE_URL=https://${domainValue}`,
    '# Public CMS URL — the browser uses this for client-side navigation.',
    `NUXT_PUBLIC_PAYLOAD_URL=https://${(cmsSubdomain as string).trim()}`,
    '',
    '# ----- CMS (Pocketbase) -----',
    `POCKETBASE_ADMIN_EMAIL=${config.adminEmail}`,
    `POCKETBASE_ADMIN_PASSWORD=${config.adminPassword}`,
    `PB_ENCRYPTION_KEY=${config.encryptionKey}`,
    '',
    '# ----- Port bindings (shared mode) -----',
    `CMS_BIND=${cmsBind}`,
    `CMS_PORT=${cmsPort}`,
    `NUXT_BIND=${nuxtBind}`,
    `NUXT_PORT=${nuxtPort}`,
    '',
    '# ----- Port bindings (standalone mode) -----',
    `NGINX_HTTP_PORT=${nginxHttpPort}`,
    `NGINX_HTTPS_PORT=${nginxHttpsPort}`,
    '',
    '# ----- Pocketbase build arch -----',
    '# Most VPS = amd64, Apple Silicon local dev / ARM VPS = arm64',
    `PB_ARCH=${process.arch === 'arm64' ? 'arm64' : 'amd64'}`,
    '',
    '# ----- Internal (set automatically in docker-compose) -----',
    '# NUXT_PUBLIC_PAYLOAD_URL=http://cms:3001',
  ]

  if (mode === 'standalone') {
    // COMPOSE_PROFILES controls which services start
    envLines.splice(envLines.length - 3, 0, 'COMPOSE_PROFILES=full')
  }

  fs.writeFileSync(path.join(ROOT, '.env.production'), envLines.join('\n') + '\n')
  fs.writeFileSync(path.join(ROOT, 'greenleaf.config.json'), JSON.stringify(config, null, 2))
  fs.writeFileSync(
    path.join(ROOT, 'cms', '.env'),
    [
      `ADMIN_EMAIL=${config.adminEmail}`,
      `ADMIN_PASSWORD=${config.adminPassword}`,
      `POCKETBASE_URL=http://localhost:3052`,
    ].join('\n') + '\n',
  )

  p.log.success(`.env.production written`)
  p.log.success(`greenleaf.config.json written`)
  p.log.success(`cms/.env written (for setup + seed scripts)`)

  // ----- 9. Summary -----
  if (mode === 'shared') {
    p.note(
      [
        `Storefront → ${nuxtBind}:${nuxtPort}`,
        `CMS admin  → ${cmsBind}:${cmsPort}/_/`,
        ``,
        `Add to your VPS Nginx config (example at nginx/vps-shared-example.conf):`,
        `  server_name ${domainValue};          → proxy_pass http://127.0.0.1:${nuxtPort};`,
        `  server_name ${config.cmsSubdomain};  → proxy_pass http://127.0.0.1:${cmsPort};`,
      ].join('\n'),
      'Reverse-proxy reference',
    )
  } else {
    p.note(
      `Bundled Nginx will listen on :${nginxHttpPort} (HTTP) and :${nginxHttpsPort} (HTTPS).\nUse Cloudflare in front or upload certs to nginx/certs/.`,
      'Standalone',
    )
  }

  // ----- 10. Optional next steps -----
  const applyBrand = await p.confirm({
    message: 'Apply brand to Pocketbase now? (requires stack running)',
    initialValue: false,
  })
  if (p.isCancel(applyBrand)) return finish()
  if (applyBrand) {
    try {
      await run('pnpm', ['apply-brand'], ROOT)
      p.log.success('Brand applied to Pocketbase.')
    } catch (err) {
      p.log.warn(`Brand apply failed — run \`docker compose up -d\` first.`)
      p.log.warn(DIM + `Error: ${(err as Error).message}` + RESET)
    }
  }

  finish()
}

function finish() {
  p.outro(`${GREEN}✓ Setup complete${RESET}
${DIM}Next: ${RESET}docker compose up -d${DIM}  →  ${RESET}`)
  process.exit(0)
}

function run(cmd: string, args: string[], cwd: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { spawn } = require('node:child_process') as typeof import('node:child_process')
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: true })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`))))
    child.on('error', reject)
  })
}

main().catch((err) => {
  p.log.error(`Unexpected error: ${err?.message ?? err}`)
  process.exit(1)
})
