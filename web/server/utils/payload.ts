// Server-side Pocketbase client (Nitro routes can't use app composables).
// Used by the sitemap source route.

type Paginated<T> = { items: T[]; totalItems: number }

export const pbFind = async <T>(
  collection: string,
  params: { filter?: string; perPage?: number; sort?: string; fields?: string } = {},
): Promise<Paginated<T>> => {
  const config = useRuntimeConfig()
  const url = new URL(`${config.public.payloadUrl}/api/collections/${collection}/records`)
  url.searchParams.set('perPage', String(params.perPage ?? 100))
  if (params.filter) url.searchParams.set('filter', params.filter)
  if (params.sort) url.searchParams.set('sort', params.sort)
  if (params.fields) url.searchParams.set('fields', params.fields)
  return await $fetch<Paginated<T>>(url.toString())
}

export const pbFirst = async <T>(collection: string): Promise<T | null> => {
  const config = useRuntimeConfig()
  const url = new URL(`${config.public.payloadUrl}/api/collections/${collection}/records`)
  url.searchParams.set('perPage', '1')
  const res = await $fetch<{ items: T[] }>(url.toString())
  return res.items[0] ?? null
}
