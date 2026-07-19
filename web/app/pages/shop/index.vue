<script setup lang="ts">
const api = usePayloadApi()
const route = useRoute()
const router = useRouter()

const { data: categories } = await useAsyncData('shop:categories', () => api.categories({ limit: 50 }))

const tags = [
  { value: 'new-arrival', label: 'New Arrivals' },
  { value: 'best-seller', label: 'Best Sellers' },
  { value: 'rare', label: 'Rare' },
  { value: 'featured', label: 'Featured' },
]
const sorts = [
  { value: '-createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: '-price', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
]

const activeCategory = computed(() => (route.query.category as string) || '')
const activeTag = computed(() => (route.query.tag as string) || '')
const activeSort = computed(() => (route.query.sort as string) || '-createdAt')

const setFilter = (key: string, value: string) => {
  const query = { ...route.query }
  if (query[key] === value || !value) {
    delete query[key]
  } else {
    query[key] = value
  }
  router.push({ query })
}

const where = computed(() => {
  const w: Record<string, Record<string, string>> = {}
  if (activeCategory.value) w['category.slug'] = { equals: activeCategory.value }
  if (activeTag.value) w['tags'] = { contains: activeTag.value }
  return Object.keys(w).length ? w : undefined
})

const { data: products, pending } = await useAsyncData(
  () => `shop:list:${activeCategory.value}:${activeTag.value}:${activeSort.value}`,
  () =>
    api.products({
      where: where.value,
      sort: activeSort.value,
      limit: 48,
    }),
  { watch: [activeCategory, activeTag, activeSort] },
)

useHead({ title: () => 'Shop' })
</script>

<template>
  <div class="container-page py-8 sm:py-12">
    <header class="mb-8">
      <nav class="text-xs text-stone-500">
        <NuxtLink to="/" class="hover:text-stone-900">Home</NuxtLink>
        <span class="mx-1">/</span>
        <span>Shop</span>
      </nav>
      <h1 class="mt-2 font-display text-3xl font-semibold sm:text-4xl">Shop All Plants</h1>
      <p class="mt-1 text-sm text-stone-500">
        {{ products?.totalDocs ?? 0 }} plants available · shipped worldwide from Thailand
      </p>
    </header>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-[220px_1fr]">
      <!-- Filters -->
      <aside class="space-y-6">
        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Category</h3>
          <div class="flex flex-wrap gap-2 lg:flex-col">
            <button
              :class="['chip', !activeCategory ? 'bg-brand-700 text-white' : '']"
              @click="setFilter('category', '')"
            >
              All
            </button>
            <button
              v-for="cat in categories?.docs"
              :key="cat.id"
              :class="['chip justify-start', activeCategory === cat.slug ? 'bg-brand-700 text-white' : '']"
              @click="setFilter('category', cat.slug)"
            >
              {{ cat.name }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Tags</h3>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in tags"
              :key="tag.value"
              :class="['chip', activeTag === tag.value ? 'bg-brand-700 text-white' : '']"
              @click="setFilter('tag', tag.value)"
            >
              {{ tag.label }}
            </button>
          </div>
        </div>

        <div>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Sort</h3>
          <select
            :value="activeSort"
            class="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
            @change="setFilter('sort', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="s in sorts" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </div>
      </aside>

      <!-- Grid -->
      <div>
        <div v-if="pending && !products" class="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div v-for="i in 6" :key="i" class="card aspect-[3/4] animate-pulse bg-stone-100" />
        </div>
        <div
          v-else-if="products?.docs.length"
          class="grid grid-cols-2 gap-4 sm:grid-cols-3"
        >
          <ProductCard v-for="p in products.docs" :key="p.id" :product="p" />
        </div>
        <div v-else class="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-500">
          <Icon name="lucide:search-x" class="mx-auto h-8 w-8" />
          <p class="mt-2">No plants match these filters.</p>
        </div>
      </div>
    </div>
  </div>
</template>
