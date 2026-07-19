import Pocketbase from 'pocketbase'

const url = import.meta.env.VITE_PB_URL || '/'

export const pb = new Pocketbase(url)

export const isLoggedIn = () => pb.authStore.isValid

export async function login(email: string, password: string) {
  await pb.collection('_superusers').authWithPassword(email, password)
}

export function logout() {
  pb.authStore.clear()
}

export async function list<T = Record<string, unknown>>(collection: string, opts: { page?: number; perPage?: number; sort?: string; filter?: string; expand?: string } = {}) {
  const res = await pb.collection(collection).getList(opts.page ?? 1, opts.perPage ?? 50, {
    sort: opts.sort,
    filter: opts.filter,
    expand: opts.expand,
  })
  return {
    ...res,
    items: res.items as unknown as T[],
  }
}

export async function get<T = Record<string, unknown>>(collection: string, id: string) {
  return (await pb.collection(collection).getOne(id)) as unknown as T
}

export async function create(collection: string, data: Record<string, unknown>) {
  return pb.collection(collection).create(data)
}

export async function update(collection: string, id: string, data: Record<string, unknown>) {
  return pb.collection(collection).update(id, data)
}

export async function remove(collection: string, id: string) {
  return pb.collection(collection).delete(id)
}

export function errMessage(e: unknown): string {
  const err = e as { response?: { data?: Record<string, { message?: string }> }; message?: string }
  if (err?.response?.data) {
    const fields = Object.entries(err.response.data)
      .map(([k, v]) => v?.message ? `${k}: ${v.message}` : null)
      .filter(Boolean)
    if (fields.length) return fields.join('; ')
  }
  return err?.message || 'Something went wrong.'
}

export function slugify(text: string): string {
  return text.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
}
