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
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`)
  return (await res.json()).token
}

async function create(token: string, collection: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${PB_URL}/api/collections/${collection}/records`, {
    method: 'POST',
    headers: { Authorization: token, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Create ${collection} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function find(token: string, collection: string, filter?: string): Promise<Record<string, unknown> | null> {
  const url = new URL(`${PB_URL}/api/collections/${collection}/records`)
  url.searchParams.set('perPage', '1')
  if (filter) {
    // Pocketbase filter syntax requires spaces around operators
    url.searchParams.set('filter', filter)
  }
  const res = await fetch(url, { headers: { Authorization: token } })
  if (!res.ok) throw new Error(`Find failed: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data.items?.[0] ?? data[0] ?? null
}

const slugify = (text: string) =>
  text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

const placeholder = (label: string, bg = '15803d', fg = 'ffffff') =>
  `https://placehold.co/800x800/${bg}/${fg}?text=${encodeURIComponent(label)}`

const textToHtml = (text: string) =>
  text.split(/\n\n+/).map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`).join('')

const bgForCategory = (cat: string) =>
  ({ Monstera: '15803d', Philodendron: '166534', Alocasia: '14532d', Anthurium: '047857', Others: '365314' })[cat] || '15803d'

// ---------- Seed data ----------
const categories = [
  { name: 'Monstera', description: 'Fenestrated tropicals loved for their iconic splits and holes.', order: 1 },
  { name: 'Philodendron', description: 'Climbing aroids with velvety and glossy foliage.', order: 2 },
  { name: 'Alocasia', description: 'Striking arrow-shaped leaves with dramatic veining.', order: 3 },
  { name: 'Anthurium', description: 'Heart-shaped leaves with bold texture and color.', order: 4 },
  { name: 'Others', description: 'Crotons, Aglaonema, Syngonium, and other rarities.', order: 5 },
]

type Product = {
  name: string; category: string; price: number; compareAtPrice?: number
  stockStatus: 'in-stock' | 'limited' | 'pre-order' | 'sold-out'
  tags?: string[]; excerpt: string; description: string
  care: { light: string; water: string; humidity: string; temperature: string }
}

const products: Product[] = [
  // Monstera
  { name: 'Monstera Albo Variegata', category: 'Monstera', price: 250, compareAtPrice: 320, stockStatus: 'limited', tags: ['best-seller', 'rare', 'featured'], excerpt: 'Classic white variegation on fenestrated mature leaves.', description: 'Monstera Albo Variegata is the iconic variegated monstera with stunning cream-and-white patches on deep green split leaves. Each leaf is unique — no two variegation patterns are alike.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Monstera Thai Constellation', category: 'Monstera', price: 180, stockStatus: 'in-stock', tags: ['best-seller'], excerpt: 'Stable yellow-cream variegation across the entire leaf.', description: 'Thai Constellation is a stable, lab-cultivated variegation that will not revert. Creamy-yellow speckles cover every leaf for a galaxy-like effect.', care: { light: 'Medium to bright indirect', water: 'Weekly', humidity: '50-70%', temperature: '18-27°C' } },
  { name: 'Monstera Adansonii Variegata', category: 'Monstera', price: 145, stockStatus: 'limited', tags: ['rare'], excerpt: 'The "swiss cheese" vine with white variegated patches.', description: 'Adansonii Variegata brings the iconic swiss-cheese perforations together with unpredictable white sectors. A trailing beauty for any collection.', care: { light: 'Bright indirect', water: 'When top 1" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Monstera Standleyana Albo', category: 'Monstera', price: 85, stockStatus: 'in-stock', tags: ['rare', 'new-arrival'], excerpt: 'Oval leaves streaked with creamy-white variegation.', description: 'Standleyana Albo is a climbing Monstera with elongated oval leaves covered in random white streaks and splashes. Easy to grow on a moss pole.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '50-70%', temperature: '18-27°C' } },
  { name: 'Monstera Dubia', category: 'Monstera', price: 65, stockStatus: 'in-stock', tags: ['featured'], excerpt: 'Shingling Monstera with silver-patterned juvenile leaves.', description: 'Dubia is the famous "shingling" Monstera — its juvenile leaves lie flat against a board, displaying stunning silver and green patterns.', care: { light: 'Bright indirect', water: 'Keep evenly moist', humidity: '70-90%', temperature: '18-27°C' } },
  { name: 'Monstera Siltepecana', category: 'Monstera', price: 45, stockStatus: 'in-stock', tags: [], excerpt: 'Silver-leafed climbing Monstera with delicate patterning.', description: 'Siltepecana features small elongated leaves with beautiful silver mottling. Trails gracefully from a hanging pot or climbs a moss pole.', care: { light: 'Bright indirect', water: 'When top 1" dry', humidity: '50-70%', temperature: '18-27°C' } },
  // Philodendron
  { name: 'Philodendron Melanochrysum', category: 'Philodendron', price: 95, stockStatus: 'in-stock', tags: ['new-arrival', 'featured'], excerpt: 'Velvet dark-green leaves with golden veining.', description: 'Melanochrysum showcases massive velvet-leaved climbers with golden-flecked veins. Mature leaves can reach over 2 feet long on a moss pole.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-26°C' } },
  { name: 'Philodendron Pink Princess', category: 'Philodendron', price: 130, compareAtPrice: 160, stockStatus: 'limited', tags: ['best-seller', 'rare'], excerpt: 'Variegated pink and dark-purple foliage.', description: 'Pink Princess is famous for its random pink variegation against deep purple-black leaves. Highly sought after and rare in stable variegation.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Philodendron Gloriosum', category: 'Philodendron', price: 110, stockStatus: 'in-stock', tags: ['featured'], excerpt: 'Crawling rhizome with massive velvet heart-shaped leaves.', description: 'Gloriosum is a terrestrial crawler with oversized velvet leaves and prominent pale veining. A statement centerpiece for any plant shelf.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-26°C' } },
  { name: 'Philodendron White Princess', category: 'Philodendron', price: 140, compareAtPrice: 175, stockStatus: 'limited', tags: ['rare', 'new-arrival'], excerpt: 'Compact philodendron with white and pink variegation.', description: 'White Princess is the rarest of the "princess" series, showing both pure white and occasional pink variegation on compact deep-green leaves.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Philodendron Verrucosum', category: 'Philodendron', price: 125, stockStatus: 'limited', tags: ['featured', 'rare'], excerpt: 'Velvet deep-green leaves with pink petioles.', description: 'Verrucosum is a stunning climbing philodendron with dark velvet leaves, prominent veining, and bumpy pink petioles. A true collector centerpiece.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-26°C' } },
  { name: 'Philodendron McDowell', category: 'Philodendron', price: 95, stockStatus: 'in-stock', tags: ['new-arrival'], excerpt: 'Crawling philodendron with massive heart-shaped leaves.', description: 'McDowell is a hybrid crawler (pastazanum × mamei) with huge heart-shaped leaves and silver variegation. Fast-growing and rewarding.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '60-80%', temperature: '18-27°C' } },
  // Alocasia
  { name: 'Alocasia Frydek Variegata', category: 'Alocasia', price: 175, stockStatus: 'limited', tags: ['rare', 'new-arrival'], excerpt: 'Velvet arrow leaves with creamy-white variegation.', description: 'Frydek Variegata features deep green velvet arrow leaves streaked with white. Each leaf is uniquely patterned.', care: { light: 'Bright indirect', water: 'Keep lightly moist', humidity: '70-90%', temperature: '18-27°C' } },
  { name: 'Alocasia Black Velvet', category: 'Alocasia', price: 65, stockStatus: 'in-stock', tags: ['best-seller'], excerpt: 'Compact jewel alocasia with near-black leaves.', description: 'Black Velvet is a compact jewel alocasia with striking silver veins over deep dark leaves. Perfect for terrariums and small spaces.', care: { light: 'Medium to bright indirect', water: 'When top 1" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Alocasia Polly', category: 'Alocasia', price: 35, stockStatus: 'in-stock', tags: ['best-seller'], excerpt: 'Compact Amazonica hybrid with dramatic white veining.', description: 'Polly is the most popular Alocasia — compact size, dramatic arrow-shaped dark leaves with bold silver-white veining. Perfect for beginners.', care: { light: 'Bright indirect', water: 'When top 1" dry', humidity: '50-70%', temperature: '18-27°C' } },
  { name: 'Alocasia Zebrina', category: 'Alocasia', price: 55, stockStatus: 'in-stock', tags: [], excerpt: 'Tall zebra-striped petioles with arrow leaves.', description: 'Zebrina is grown for its striking yellow-and-black striped petioles that hold arrow-shaped leaves high. An architectural statement plant.', care: { light: 'Bright indirect', water: 'When top 1" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Alocasia Regal Shield', category: 'Alocasia', price: 75, stockStatus: 'in-stock', tags: ['featured'], excerpt: 'Massive rounded leaves with dark velvety finish.', description: 'Regal Shield produces enormous rounded leaves with deep dark-green to black velvety surfaces and purple undersides. A dramatic focal point.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '60-80%', temperature: '18-27°C' } },
  // Anthurium
  { name: 'Anthurium Crystallinum', category: 'Anthurium', price: 120, stockStatus: 'in-stock', tags: ['featured'], excerpt: 'Huge velvet heart leaves with bright white veins.', description: 'Crystallinum is prized for massive dark-green velvet leaves with prominent crystal-white veining. A showstopper at maturity.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-27°C' } },
  { name: 'Anthurium Clarinervium', category: 'Anthurium', price: 105, stockStatus: 'pre-order', tags: ['rare'], excerpt: 'Heart-shaped leather leaves with intricate white veins.', description: 'Clarinervium features thick leather-like leaves with geometric white vein patterns. A botanical artwork in plant form.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-27°C' } },
  { name: 'Anthurium Veitchii', category: 'Anthurium', price: 180, stockStatus: 'limited', tags: ['rare'], excerpt: 'King Anthurium with massive pendant quilted leaves.', description: 'Veitchii is the "King Anthurium" — long pendant leaves with deeply quilted veining that can reach several feet at maturity. A statement plant.', care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-27°C' } },
  { name: 'Anthurium Magnificum', category: 'Anthurium', price: 145, stockStatus: 'limited', tags: ['rare', 'featured'], excerpt: 'Large velvet leaves with prominent white veins.', description: "Magnificum is a climber's dream — huge velvety heart-shaped leaves with striking white vein patterns that get more pronounced with maturity.", care: { light: 'Bright indirect', water: 'When top 2" dry', humidity: '70-90%', temperature: '18-27°C' } },
  { name: 'Anthurium Warocqueanum', category: 'Anthurium', price: 220, compareAtPrice: 260, stockStatus: 'pre-order', tags: ['rare'], excerpt: 'Queen Anthurium with long dark pendant velvet leaves.', description: 'Warocqueanum is the "Queen Anthurium" — long dark-green pendant velvet leaves with silver veining. Demanding but breathtaking at maturity.', care: { light: 'Bright indirect', water: 'Keep evenly moist', humidity: '80-95%', temperature: '18-26°C' } },
  // Others
  { name: 'Croton Fire Dragon', category: 'Others', price: 48, stockStatus: 'in-stock', tags: ['new-arrival'], excerpt: 'Long narrow leaves splashed in red, orange, and yellow.', description: 'Fire Dragon Croton brings fiery tropical color with red, orange, and yellow mottled leaves. Easy and rewarding.', care: { light: 'Direct sun for best color', water: 'Keep evenly moist', humidity: '50-70%', temperature: '20-30°C' } },
  { name: 'Syngonium Albo Variegatum', category: 'Others', price: 75, compareAtPrice: 90, stockStatus: 'limited', tags: ['best-seller', 'rare'], excerpt: 'Arrow-shaped leaves with pure white sectors.', description: 'Syngonium Albo is a fast-growing vine with random pure-white variegation. Easy to grow and propagates readily.', care: { light: 'Bright indirect', water: 'When top 1" dry', humidity: '50-70%', temperature: '18-27°C' } },
  { name: 'Aglaonema Pictum Tricolor', category: 'Others', price: 90, stockStatus: 'limited', tags: ['rare', 'featured'], excerpt: 'Camouflage-patterned leaves in three shades of green.', description: 'Pictum Tricolor looks like military camouflage — dark, medium, and light green patches on narrow leaves. Slow-growing but striking.', care: { light: 'Medium to bright indirect', water: 'When top 2" dry', humidity: '60-80%', temperature: '18-27°C' } },
  { name: 'Hoya Kerrii Variegata', category: 'Others', price: 35, stockStatus: 'in-stock', tags: ['best-seller'], excerpt: 'Heart-shaped succulent leaves with creamy-yellow borders.', description: 'Kerrii Variegata is the famous "valentine Hoya" — single heart-shaped leaves with yellow margins. Often sold as a gift plant.', care: { light: 'Bright indirect', water: 'When fully dry', humidity: '40-60%', temperature: '18-27°C' } },
  { name: 'Begonia Maculata', category: 'Others', price: 25, stockStatus: 'in-stock', tags: ['new-arrival'], excerpt: 'Polka-dot begonia with silver spots on olive leaves.', description: 'Maculata features olive-green wing-shaped leaves covered in silver polka dots with burgundy undersides. Produces cascading white flowers.', care: { light: 'Bright indirect', water: 'When top 1" dry', humidity: '50-70%', temperature: '18-26°C' } },
]

const pages = [
  { title: 'About Us', slug: 'about-us', content: 'Greenleaf started from a small backyard in Thailand during the pandemic. What began as a personal obsession with rare variegated aroids has grown into a curated nursery shipping worldwide.\n\nEvery plant is hand-selected, inspected, and packed with care. We handle all phytosanitary documentation so your plants arrive healthy and legal.', showInNav: true, showInFooter: true, order: 1 },
  { title: 'How to Order', slug: 'how-to-order', content: '1. Browse our catalog and add plants to your wishlist.\n2. Send your wishlist to us via WhatsApp — the green button does this automatically.\n3. We confirm availability, calculate shipping, and send payment instructions.\n4. Plants ship every Sunday from Thailand and arrive at your door within 4-5 days.', showInNav: true, showInFooter: true, order: 2 },
  { title: 'Shipping', slug: 'shipping', content: 'We ship weekly to the USA, EU, UK, Asia, and Australia. Flat-rate shipping includes export documentation, phytosanitary certificate, air freight, customs clearance, and express delivery to your door.\n\nOne box fits approximately 30-60 plants depending on size. Bulk orders are more cost-effective.', showInNav: false, showInFooter: true, order: 3 },
  { title: 'FAQ', slug: 'faq', content: 'Q: Do you ship to my country?\nA: We ship to most countries. Message us on WhatsApp to confirm.\n\nQ: Do I need an import permit?\nA: For the USA, no — we use our broker license. Other countries may require permits; check locally.\n\nQ: How do you pack the plants?\nA: Bare-root wrapped in sphagnum, sealed, and insulated. Heat packs added for cold destinations.', showInNav: false, showInFooter: true, order: 4 },
]

async function main() {
  console.log('=== Seeding Pocketbase ===')
  const token = await auth()
  console.log('  authenticated')

  // 1) Categories
  console.log('\n=== Categories ===')
  const categoryIds: Record<string, string> = {}
  for (const c of categories) {
    const existing = await find(token, 'categories', `name = "${c.name}"`)
    if (existing) {
      categoryIds[c.name] = existing.id as string
      console.log(`  = ${c.name} (exists)`)
      continue
    }
    const created = await create(token, 'categories', {
      name: c.name,
      slug: slugify(c.name),
      description: c.description,
      order: c.order,
    })
    categoryIds[c.name] = created.id as string
    console.log(`  + ${c.name}`)
  }

  // 2) Products
  console.log('\n=== Products ===')
  let added = 0
  for (const p of products) {
    const existing = await find(token, 'products', `slug = "${slugify(p.name)}"`)
    if (existing) {
      console.log(`  = ${p.name} (exists)`)
      continue
    }
    await create(token, 'products', {
      name: p.name,
      slug: slugify(p.name),
      excerpt: p.excerpt,
      description: textToHtml(p.description),
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      stockStatus: p.stockStatus,
      category: categoryIds[p.category],
      tags: p.tags || [],
      images: [{ url: placeholder(p.name, bgForCategory(p.category)), alt: p.name }],
      careNotes: p.care,
      origin: 'Thailand',
    })
    added++
    console.log(`  + ${p.name} ($${p.price})`)
  }
  console.log(`\n  added: ${added} products`)

  // 3) Pages
  console.log('\n=== Pages ===')
  for (const page of pages) {
    const existing = await find(token, 'pages', `slug="${page.slug}"`)
    if (existing) {
      console.log(`  = ${page.title} (exists)`)
      continue
    }
    await create(token, 'pages', {
      title: page.title,
      slug: page.slug,
      content: textToHtml(page.content),
      showInNav: page.showInNav,
      showInFooter: page.showInFooter,
      order: page.order,
    })
    console.log(`  + ${page.title}`)
  }

  // 4) Settings (singleton — only one record)
  console.log('\n=== Settings ===')
  const existingSettings = await find(token, 'settings')
  if (existingSettings) {
    console.log('  = settings (exists)')
  } else {
    await create(token, 'settings', {
      siteName: 'Greenleaf',
      tagline: 'Rare Variegated Plants from Thailand',
      description: 'Curated rare variegated aroids — Monstera, Philodendron, Alocasia, Anthurium. Shipped worldwide from Thailand with phytosanitary certification.',
      contactEmail: 'hello@greenleaf.example',
      whatsappNumber: '15551234567',
      whatsappDefaultMessage: "Hi Greenleaf! I'm interested in your plants.",
      currency: 'USD',
      social: [
        { platform: 'Instagram', url: 'https://instagram.com/', icon: 'instagram' },
        { platform: 'Facebook', url: 'https://facebook.com/', icon: 'facebook' },
        { platform: 'TikTok', url: 'https://tiktok.com/', icon: 'music-2' },
      ],
      heroSlides: [
        { title: 'Plant With Heart', subtitle: 'Rare variegated aroids, shipped worldwide from Thailand.', imageUrl: 'https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1600&q=80', ctaText: 'Shop Now', ctaLink: '/shop' },
        { title: 'New Arrivals Weekly', subtitle: 'Freshly imported variegated cuttings and rooted plants.', imageUrl: 'https://images.unsplash.com/photo-1604762524889-3e2fcc145df3?auto=format&fit=crop&w=1600&q=80', ctaText: 'See New Arrivals', ctaLink: '/shop?tag=new-arrival' },
      ],
    })
    console.log('  + settings')
  }

  console.log('\n=== Seed complete ===')
}

main().catch((err) => {
  console.error('FATAL:', err)
  process.exit(1)
})
