// Apply brand values from greenleaf.config.json to the Pocketbase settings collection.
// Idempotent — safe to run multiple times. Requires the stack to be up.

import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')

type Config = {
  siteName: string
  tagline: string
  description: string
  whatsappNumber: string
  whatsappDefaultMessage: string
  contactEmail: string
  currency: string
  social: Record<string, string | undefined>
  adminEmail: string
  adminPassword: string
}

type SocialEntry = { platform: string; url: string; icon: string }

const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'instagram',
  facebook: 'facebook',
  tiktok: 'music-2',
  youtube: 'youtube',
}

async function auth(base: string, email: string, password: string): Promise<string> {
  const res = await fetch(`${base}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password }),
  })
  if (!res.ok) throw new Error(`Admin auth failed: ${res.status} ${await res.text()}`)
  return (await res.json()).token
}

async function getSettingsRecordId(base: string, token: string): Promise<string | null> {
  const url = new URL(`${base}/api/collections/settings/records`)
  url.searchParams.set('perPage', '1')
  const res = await fetch(url, { headers: { Authorization: token } })
  if (!res.ok) return null
  const data = await res.json()
  return data.items?.[0]?.id ?? null
}

async function upsertSettings(
  base: string,
  token: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const existingId = await getSettingsRecordId(base, token)
  const url = existingId
    ? `${base}/api/collections/settings/records/${existingId}`
    : `${base}/api/collections/settings/records`
  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Settings upsert failed: ${res.status} ${await res.text()}`)
}

async function main() {
  const configPath = path.join(ROOT, 'greenleaf.config.json')
  if (!fs.existsSync(configPath)) {
    console.error('✗ greenleaf.config.json not found. Run `pnpm setup` first.')
    process.exit(1)
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Config

  // Prefer env vars (set by docker-compose on the host), fall back to localhost.
  const base = process.env.POCKETBASE_URL ?? 'http://localhost:3052'
  console.log(`🔗 Connecting to Pocketbase at ${base}`)

  const token = await auth(base, config.adminEmail, config.adminPassword)
  console.log('✓ Authenticated as admin')

  const social: SocialEntry[] = Object.entries(config.social ?? {})
    .filter(([, url]) => url && url.trim())
    .map(([platform, url]) => ({
      platform: platform.charAt(0).toUpperCase() + platform.slice(1),
      url: url as string,
      icon: SOCIAL_ICONS[platform] ?? 'globe',
    }))

  await upsertSettings(base, token, {
    siteName: config.siteName,
    tagline: config.tagline,
    description: config.description,
    contactEmail: config.contactEmail,
    whatsappNumber: config.whatsappNumber,
    whatsappDefaultMessage: config.whatsappDefaultMessage,
    currency: config.currency,
    social,
    // Leave heroSlides untouched if they exist; otherwise leave empty
  })

  console.log(`✓ Brand applied:`)
  console.log(`    siteName: ${config.siteName}`)
  console.log(`    whatsapp: ${config.whatsappNumber}`)
  console.log(`    currency: ${config.currency}`)
  console.log(`    social:   ${social.length} link(s)`)
}

main().catch((err) => {
  console.error('✗', err?.message ?? err)
  process.exit(1)
})
