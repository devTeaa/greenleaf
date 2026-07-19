import type { SitemapUrlInput } from '#sitemap/types'

// Returns all dynamic URLs (products, categories, CMS pages) for /sitemap.xml.
// Auto-discovered static routes (/) are merged in by @nuxtjs/sitemap.

type PbRecord = { slug?: string; created?: string; updated?: string; name?: string; title?: string }

export default defineSitemapEventHandler(async () => {
  const [products, categories, pages] = await Promise.all([
    pbFind<PbRecord>('products', { perPage: 500, fields: 'slug,created' }),
    pbFind<PbRecord>('categories', { perPage: 100, sort: 'order', fields: 'slug,created' }),
    pbFind<PbRecord>('pages', { perPage: 100, sort: 'order', fields: 'slug,created' }),
  ])

  const urls: SitemapUrlInput[] = []

  for (const p of products.items) {
    if (p.slug) {
      urls.push({
        loc: `/shop/${p.slug}`,
        lastmod: p.created,
        changefreq: 'weekly',
        priority: 0.8,
      })
    }
  }

  for (const c of categories.items) {
    if (c.slug) {
      urls.push({
        loc: `/category/${c.slug}`,
        lastmod: c.created,
        changefreq: 'weekly',
        priority: 0.6,
      })
    }
  }

  for (const pg of pages.items) {
    if (pg.slug && !['shop', 'category'].includes(pg.slug)) {
      urls.push({
        loc: `/${pg.slug}`,
        lastmod: pg.created,
        changefreq: 'monthly',
        priority: 0.4,
      })
    }
  }

  return urls
})
