<script setup lang="ts">
const api = usePayloadApi()
const route = useRoute()
const { formatPrice, waLink, settings } = useSite()

const { data: product } = await useAsyncData(
  () => `product:${route.params.slug}`,
  () => api.product(route.params.slug as string),
)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found', fatal: true })
}

const activeImage = ref(0)
const images = computed(() => product.value?.images ?? [])
const hasDiscount = computed(
  () =>
    product.value?.compareAtPrice != null &&
    (product.value?.compareAtPrice ?? 0) > (product.value?.price ?? 0),
)

const orderMessage = computed(() => {
  const p = product.value
  if (!p) return ''
  return `Hi! I'd like to order ${p.name} (${formatPrice(p.price)}). Product page: https://${typeof window !== 'undefined' ? window.location.host : ''}/shop/${p.slug}`
})
const waHref = computed(() => waLink(orderMessage.value))

// Related products (same category)
const { data: related } = await useAsyncData(
  () => `product:${route.params.slug}:related`,
  async () => {
    const p = product.value
    if (!p?.category || typeof p.category !== 'object') return []
    const catId = (p.category as { id?: number }).id
    if (!catId) return []
    const res = await api.products({
      where: { category: { equals: catId } },
      limit: 4,
    })
    return res.docs.filter((r) => r.id !== p.id).slice(0, 4)
  },
)

// SEO — meta + OG + Product structured data
const ogImage = computed(() => images.value[0]?.url)
const availabilityMap: Record<string, string> = {
  'in-stock': 'https://schema.org/InStock',
  'limited': 'https://schema.org/LimitedAvailability',
  'pre-order': 'https://schema.org/PreOrder',
  'sold-out': 'https://schema.org/OutOfStock',
}

useHead({ title: () => product.value?.name })
useSeoMeta({
  description: () => product.value?.excerpt ?? '',
  ogTitle: () => product.value?.name,
  ogDescription: () => product.value?.excerpt ?? '',
  ogImage: () => ogImage.value,
  ogType: 'website',
  twitterTitle: () => product.value?.name,
  twitterDescription: () => product.value?.excerpt ?? '',
  twitterImage: () => ogImage.value,
})

useSchemaOrg([
  defineProduct({
    name: () => product.value?.name ?? '',
    description: () => product.value?.excerpt ?? '',
    image: () => images.value.map((i) => i.url).filter(Boolean) as string[],
    offers: () =>
      product.value?.price != null
        ? [
            {
              price: product.value.price,
              priceCurrency: settings.value?.currency ?? 'USD',
              availability:
                availabilityMap[product.value.stockStatus ?? 'in-stock'] ??
                'https://schema.org/InStock',
              url: typeof window !== 'undefined' ? window.location.href : undefined,
            },
          ]
        : [],
  }),
])
</script>

<template>
  <div v-if="product" class="container-page py-8 sm:py-12">
    <nav class="mb-6 text-xs text-stone-500">
      <NuxtLink to="/" class="hover:text-stone-900">Home</NuxtLink>
      <span class="mx-1">/</span>
      <NuxtLink to="/shop" class="hover:text-stone-900">Shop</NuxtLink>
      <template v-if="typeof product.category === 'object' && product.category?.slug">
        <span class="mx-1">/</span>
        <NuxtLink :to="`/category/${product.category.slug}`" class="hover:text-stone-900">
          {{ product.category.name }}
        </NuxtLink>
      </template>
    </nav>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
      <!-- Gallery -->
      <div>
        <div class="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
          <img
            v-if="images[activeImage]?.url"
            :src="images[activeImage].url"
            :alt="images[activeImage].alt || product.name"
            class="h-full w-full object-cover"
          />
          <div class="absolute left-4 top-4 flex flex-col gap-2">
            <StockBadge :status="product.stockStatus ?? null" />
            <span v-if="hasDiscount" class="chip bg-accent-600 text-white">Sale</span>
          </div>
        </div>
        <div v-if="images.length > 1" class="mt-3 grid grid-cols-5 gap-2">
          <button
            v-for="(img, i) in images"
            :key="i"
            :class="[
              'aspect-square overflow-hidden rounded-lg border-2 transition',
              i === activeImage ? 'border-brand-700' : 'border-transparent opacity-70 hover:opacity-100',
            ]"
            @click="activeImage = i"
          >
            <img :src="img.url" :alt="img.alt || product.name" class="h-full w-full object-cover" />
          </button>
        </div>
      </div>

      <!-- Info -->
      <div>
        <h1 class="font-display text-3xl font-semibold sm:text-4xl">{{ product.name }}</h1>

        <div class="mt-4 flex items-center gap-3">
          <span class="text-2xl font-semibold">{{ formatPrice(product.price) }}</span>
          <span v-if="hasDiscount" class="text-lg text-stone-400 line-through">
            {{ formatPrice(product.compareAtPrice) }}
          </span>
        </div>

        <p v-if="product.excerpt" class="mt-4 text-stone-700">
          {{ product.excerpt }}
        </p>

        <div class="mt-6 space-y-3">
          <a :href="waHref" target="_blank" rel="noopener" class="btn-whatsapp w-full !py-3">
            <Icon name="lucide:message-circle" class="h-5 w-5" />
            Order on WhatsApp
          </a>
          <WishlistButton v-if="product" :product="product" variant="full" class="w-full !py-3" />
          <p class="text-center text-xs text-stone-500">
            No online payment — confirm availability and shipping with us first.
          </p>
        </div>

        <dl class="mt-8 divide-y divide-stone-200 border-t border-stone-200">
          <div class="flex justify-between py-3 text-sm">
            <dt class="text-stone-500">Origin</dt>
            <dd class="font-medium">{{ product.origin ?? 'Thailand' }}</dd>
          </div>
          <div v-if="product.careNotes" class="py-3">
            <dt class="mb-2 text-sm text-stone-500">Care notes</dt>
            <dd class="grid grid-cols-2 gap-2 text-sm">
              <div v-if="product.careNotes.light" class="flex items-center gap-2">
                <Icon name="lucide:sun" class="h-4 w-4 text-stone-400" />
                {{ product.careNotes.light }}
              </div>
              <div v-if="product.careNotes.water" class="flex items-center gap-2">
                <Icon name="lucide:droplets" class="h-4 w-4 text-stone-400" />
                {{ product.careNotes.water }}
              </div>
              <div v-if="product.careNotes.humidity" class="flex items-center gap-2">
                <Icon name="lucide:wind" class="h-4 w-4 text-stone-400" />
                {{ product.careNotes.humidity }}
              </div>
              <div v-if="product.careNotes.temperature" class="flex items-center gap-2">
                <Icon name="lucide:thermometer" class="h-4 w-4 text-stone-400" />
                {{ product.careNotes.temperature }}
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>

    <!-- Description -->
    <section v-if="product.description" class="mt-12">
      <h2 class="mb-4 font-display text-xl font-semibold">About this plant</h2>
      <div class="max-w-3xl">
        <RichTextRenderer :content="product.description" />
      </div>
    </section>

    <!-- Related -->
    <section v-if="related && related.length" class="mt-16">
      <SectionHeading title="You may also like" />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in related" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
