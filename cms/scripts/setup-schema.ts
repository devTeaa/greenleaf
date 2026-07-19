import 'dotenv/config'

const PB_URL = process.env.POCKETBASE_URL || 'http://localhost:3052'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('✗ ADMIN_EMAIL and ADMIN_PASSWORD env vars required.')
  console.error('  Create them via: ./pocketbase superuser create EMAIL PASS')
  console.error('  Then put them in cms/.env (or export before running).')
  process.exit(1)
}

async function auth(): Promise<string> {
  const res = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${res.status} ${await res.text()}`)
  return (await res.json()).token
}

async function deleteCollection(token: string, name: string): Promise<void> {
  const res = await fetch(`${PB_URL}/api/collections/${name}`, {
    method: 'DELETE',
    headers: { Authorization: token },
  })
  if (res.ok) console.log(`  deleted existing: ${name}`)
}

async function createCollection(token: string, body: Record<string, unknown>): Promise<{ id: string; name: string }> {
  const res = await fetch(`${PB_URL}/api/collections`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Create ${body.name} failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  console.log(`  created: ${body.name} (id: ${data.id}, fields: ${data.fields?.length ?? 0})`)
  return data
}

// Generate a unique field id like Pocketbase does: <type><10 digits>
let fieldCounter = 1000000000
const fieldId = (type: string) => `${type}${fieldCounter++}`

// PB 0.39 field builders — options are flattened to top level
const f = {
  text: (name: string, opts: { required?: boolean; min?: number; max?: number } = {}): unknown => ({
    name,
    type: 'text',
    id: fieldId('text'),
    required: opts.required ?? false,
    system: false,
    hidden: false,
    presentable: false,
    min: opts.min ?? 0,
    max: opts.max ?? 2000,
    pattern: '',
    autogeneratePattern: '',
  }),
  number: (name: string, opts: { required?: boolean; min?: number; max?: number } = {}): unknown => ({
    name,
    type: 'number',
    id: fieldId('number'),
    required: opts.required ?? false,
    system: false,
    hidden: false,
    presentable: false,
    min: opts.min,
    max: opts.max,
    noDecimals: false,
  }),
  bool: (name: string, required = false): unknown => ({
    name,
    type: 'bool',
    id: fieldId('bool'),
    required,
    system: false,
    hidden: false,
    presentable: false,
  }),
  email: (name: string, required = false): unknown => ({
    name,
    type: 'email',
    id: fieldId('email'),
    required,
    system: false,
    hidden: false,
    presentable: false,
    exceptDomains: null,
    onlyDomains: null,
  }),
  select: (name: string, values: string[], opts: { multiple?: boolean; required?: boolean } = {}): unknown => ({
    name,
    type: 'select',
    id: fieldId('select'),
    required: opts.required ?? false,
    system: false,
    hidden: false,
    presentable: false,
    values,
    maxSelect: opts.multiple ? values.length : 1,
  }),
  editor: (name: string, required = false): unknown => ({
    name,
    type: 'editor',
    id: fieldId('editor'),
    required,
    system: false,
    hidden: false,
    presentable: false,
    convertUrls: true,
  }),
  json: (name: string, required = false): unknown => ({
    name,
    type: 'json',
    id: fieldId('json'),
    required,
    system: false,
    hidden: false,
    presentable: false,
    maxSize: 5242880,
  }),
  relation: (
    name: string,
    collectionId: string,
    opts: { maxSelect?: number; required?: boolean; cascadeDelete?: boolean } = {},
  ): unknown => ({
    name,
    type: 'relation',
    id: fieldId('relation'),
    required: opts.required ?? false,
    system: false,
    hidden: false,
    presentable: false,
    collectionId,
    cascadeDelete: opts.cascadeDelete ?? false,
    minSelect: 0,
    maxSelect: opts.maxSelect ?? 1,
    displayFields: ['name'],
  }),
  file: (name: string, opts: { maxSelect?: number; maxSize?: number; required?: boolean } = {}): unknown => ({
    name,
    type: 'file',
    id: fieldId('file'),
    required: opts.required ?? false,
    system: false,
    hidden: false,
    presentable: false,
    maxSelect: opts.maxSelect ?? 1,
    maxSize: opts.maxSize ?? 5242880,
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    thumbs: null,
    protected: false,
  }),
}

const PUBLIC_READ = ''
const ADMIN_ONLY: string | null = null

async function main() {
  console.log('=== Setting up Pocketbase schema ===')
  const token = await auth()
  console.log('  authenticated')

  console.log('\n=== Cleaning up existing collections ===')
  for (const name of ['products', 'categories', 'pages', 'settings']) {
    await deleteCollection(token, name)
  }

  // 1) Categories
  console.log('\n=== Creating categories ===')
  const categories = await createCollection(token, {
    name: 'categories',
    type: 'base',
    fields: [
      f.text('name', { required: true, max: 100 }),
      f.text('slug', { required: true, max: 100 }),
      f.text('description', { max: 1000 }),
      f.file('image'),
      f.number('order', { min: 0 }),
    ],
    listRule: PUBLIC_READ,
    viewRule: PUBLIC_READ,
    createRule: ADMIN_ONLY,
    updateRule: ADMIN_ONLY,
    deleteRule: ADMIN_ONLY,
  })

  // 2) Products
  console.log('\n=== Creating products ===')
  await createCollection(token, {
    name: 'products',
    type: 'base',
    fields: [
      f.text('name', { required: true, max: 200 }),
      f.text('slug', { required: true, max: 200 }),
      f.text('excerpt', { max: 500 }),
      f.editor('description'),
      f.number('price', { required: true, min: 0 }),
      f.number('compareAtPrice', { min: 0 }),
      f.select('stockStatus', ['in-stock', 'limited', 'pre-order', 'sold-out'], { required: true }),
      f.relation('category', categories.id, { maxSelect: 1 }),
      f.select('tags', ['new-arrival', 'best-seller', 'rare', 'featured'], { multiple: true }),
      f.json('images'),
      f.json('careNotes'),
      f.text('origin', { max: 100 }),
    ],
    listRule: PUBLIC_READ,
    viewRule: PUBLIC_READ,
    createRule: ADMIN_ONLY,
    updateRule: ADMIN_ONLY,
    deleteRule: ADMIN_ONLY,
  })

  // 3) Pages
  console.log('\n=== Creating pages ===')
  await createCollection(token, {
    name: 'pages',
    type: 'base',
    fields: [
      f.text('title', { required: true, max: 200 }),
      f.text('slug', { required: true, max: 200 }),
      f.editor('content'),
      f.bool('showInNav'),
      f.bool('showInFooter'),
      f.number('order', { min: 0 }),
    ],
    listRule: PUBLIC_READ,
    viewRule: PUBLIC_READ,
    createRule: ADMIN_ONLY,
    updateRule: ADMIN_ONLY,
    deleteRule: ADMIN_ONLY,
  })

  // 4) Settings (singleton)
  console.log('\n=== Creating settings ===')
  await createCollection(token, {
    name: 'settings',
    type: 'base',
    fields: [
      f.text('siteName', { required: true, max: 100 }),
      f.text('tagline', { max: 200 }),
      f.text('description', { max: 1000 }),
      f.email('contactEmail'),
      f.text('whatsappNumber', { max: 50 }),
      f.text('whatsappDefaultMessage', { max: 1000 }),
      f.select('currency', ['USD', 'THB', 'EUR'], { required: true }),
      f.json('social'),
      f.json('heroSlides'),
    ],
    listRule: PUBLIC_READ,
    viewRule: PUBLIC_READ,
    createRule: ADMIN_ONLY,
    updateRule: ADMIN_ONLY,
    deleteRule: ADMIN_ONLY,
  })

  console.log('\n=== Schema setup complete ===')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
