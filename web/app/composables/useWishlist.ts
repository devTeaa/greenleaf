import type { Product } from '~/types/payload'

export type WishlistItem = {
  id: number
  slug: string
  name: string
  price: number | null
  image?: string | null
  addedAt: number
}

const STORAGE_KEY = 'greenleaf:wishlist:v1'

export const useWishlist = () => {
  const items = useState<WishlistItem[]>('wishlist:items', () => [])
  const isOpen = useState<boolean>('wishlist:open', () => false)

  const loadFromStorage = () => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) items.value = JSON.parse(raw) as WishlistItem[]
    } catch {
      // ignore malformed storage
    }
  }

  const persist = () => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
    } catch {
      // storage full / disabled — fail silently
    }
  }

  const has = (id: number) => items.value.some((i) => i.id === id)

  const add = (product: Product) => {
    if (has(product.id)) return
    items.value = [
      ...items.value,
      {
        id: product.id,
        slug: product.slug ?? String(product.id),
        name: product.name,
        price: product.price ?? null,
        image: product.images?.[0]?.url ?? null,
        addedAt: Date.now(),
      },
    ]
    persist()
  }

  const remove = (id: number) => {
    items.value = items.value.filter((i) => i.id !== id)
    persist()
  }

  const toggle = (product: Product) => {
    has(product.id) ? remove(product.id) : add(product)
  }

  const clear = () => {
    items.value = []
    persist()
  }

  const open = () => {
    isOpen.value = true
  }
  const close = () => {
    isOpen.value = false
  }

  const count = computed(() => items.value.length)
  const total = computed(() =>
    items.value.reduce((sum, i) => sum + (i.price ?? 0), 0),
  )

  const message = computed(() => {
    if (!items.value.length) return ''
    const lines = items.value
      .slice()
      .sort((a, b) => a.addedAt - b.addedAt)
      .map((i, idx) => `${idx + 1}. ${i.name} — $${i.price ?? 0}`)
    return [
      "Hi! I'd like to order the following plants:",
      '',
      ...lines,
      '',
      `Total: $${total.value}`,
      '',
      'Are these available?',
    ].join('\n')
  })

  return {
    items,
    isOpen,
    count,
    total,
    message,
    has,
    add,
    remove,
    toggle,
    clear,
    open,
    close,
    loadFromStorage,
  }
}
