// Pocketbase API client with the same interface the previous Payload client exposed.
// Pages and components don't need to change — this adapter translates the calls.

type Operator = 'equals' | 'contains'
type Where = Record<string, Record<Operator, string | number>>

type FindParams = {
  where?: Where
  limit?: number
  page?: number
  sort?: string | string[]
}

type Paginated<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  limit: number
  prevPage: number | null
  nextPage: number | null
}

export const usePayloadApi = () => {
  const config = useRuntimeConfig()
  // Server-side renders use the private internal URL (e.g. http://backend:3001).
  // Client-side fetches use the public URL exposed via runtimeConfig.public.
  // This avoids leaking the internal Docker hostname to the browser.
  const base = import.meta.server
    ? (config.payloadUrl as string)
    : (config.public.payloadUrl as string)

  const request = async <T>(
    path: string,
    params: Record<string, string | undefined> = {},
  ): Promise<T> => {
    const url = new URL(`${base}/api/${path}`)
    for (const [k, v] of Object.entries(params)) {
      if (v != null && v !== '') url.searchParams.set(k, v)
    }
    return await $fetch<T>(url.toString(), {
      onRequestError({ error }) {
        console.error(`[pocketbase] request error: ${error.message}`)
      },
    })
  }

  // Translate the Payload-style `where` clause to a Pocketbase filter string.
  // Supports the operators our pages use: equals, contains, plus the special
  // `category.slug` (join) case which we resolve to a category id first.
  const buildFilter = async (where?: Where): Promise<string | undefined> => {
    if (!where) return undefined
    const parts: string[] = []
    for (const [field, ops] of Object.entries(where)) {
      for (const [op, val] of Object.entries(ops)) {
        const v = String(val).replace(/"/g, '\\"')
        if (field === 'category.slug') {
          const cat = await request<{ items: { id: string }[] }>('collections/categories/records', {
            filter: `slug = "${v}"`,
            perPage: '1',
            fields: 'id',
          })
          const catId = cat.items?.[0]?.id
          if (catId) parts.push(`category = "${catId}"`)
        } else if (op === 'equals') {
          parts.push(`${field} = "${v}"`)
        } else if (op === 'contains') {
          // PB's ?= operator only works on relations, not select-multiple.
          // Use LIKE (~) — safe because our tag values are distinct enough.
          parts.push(`${field} ~ "${v}"`)
        }
      }
    }
    return parts.length ? parts.join(' && ') : undefined
  }

  // Payload used `createdAt`/`updatedAt`; Pocketbase exposes `created`/`updated`
  // but those system fields aren't directly sortable without an explicit index.
  // The auto-generated record `id` is time-ordered and indexed, so we map
  // createdAt → id for "newest first" sorting.
  const translateSort = (sort?: string | string[]): string | undefined => {
    if (!sort) return undefined
    const arr = Array.isArray(sort) ? sort : [sort]
    return arr
      .map((s) =>
        s
          .replace('createdAt', 'id')
          .replace('updatedAt', 'id'),
      )
      .join(',')
  }

  const find = async <T = unknown>(collection: string, params: FindParams = {}): Promise<Paginated<T>> => {
    const filter = await buildFilter(params.where)
    const sort = translateSort(params.sort)
    const res = await request<{
      items: T[]
      page: number
      perPage: number
      totalItems: number
      totalPages: number
    }>(`collections/${collection}/records`, {
      filter,
      page: String(params.page ?? 1),
      perPage: String(params.limit ?? 24),
      sort,
      expand: collection === 'products' ? 'category' : undefined,
    })
    // Reshape to Paginated<T> so existing pages keep working unchanged.
    return {
      docs: res.items,
      totalDocs: res.totalItems,
      totalPages: res.totalPages,
      page: res.page,
      pagingCounter: (res.page - 1) * res.perPage + 1,
      hasPrevPage: res.page > 1,
      hasNextPage: res.page < res.totalPages,
      limit: res.perPage,
      prevPage: res.page > 1 ? res.page - 1 : null,
      nextPage: res.page < res.totalPages ? res.page + 1 : null,
    }
  }

  const findBySlug = async <T = unknown>(collection: string, slug: string): Promise<T | null> => {
    const res = await find<T>(collection, {
      where: { slug: { equals: slug } },
      limit: 1,
    })
    return res.docs[0] ?? null
  }

  const get = async <T = unknown>(collection: string, id: string): Promise<T> => {
    return await request<T>(`collections/${collection}/records/${id}`)
  }

  const getGlobal = async <T = unknown>(slug: string): Promise<T> => {
    // Pocketbase has no globals — settings is a singleton collection with one record.
    if (slug !== 'settings') throw new Error(`Unknown global: ${slug}`)
    const res = await request<{ items: T[] }>('collections/settings/records', { perPage: '1' })
    return res.items[0]
  }

  // Normalize product records so `product.category.name` works the way pages expect.
  // PB returns expanded relations under `<record>.expand.<relation>`.
  const normalizeProduct = <T extends Record<string, unknown>>(raw: T): T => {
    const expand = raw.expand as Record<string, unknown> | undefined
    if (expand?.category) {
      ;(raw as Record<string, unknown>).category = expand.category
    }
    return raw
  }

  return {
    find,
    findBySlug,
    get,
    getGlobal,

    // Typed convenience wrappers
    async products(params: FindParams = {}) {
      const res = await find<Record<string, unknown>>('products', params)
      return {
        ...res,
        docs: res.docs.map(normalizeProduct) as unknown as typeof res.docs,
      }
    },
    product(slug: string) {
      return findBySlug('products', slug)
    },
    categories(params: FindParams = {}) {
      return find('categories', { sort: 'order', ...params })
    },
    pages(params: FindParams = {}) {
      return find('pages', { sort: 'order', ...params })
    },
    page(slug: string) {
      return findBySlug('pages', slug)
    },
    settings() {
      return getGlobal('settings')
    },
  }
}
