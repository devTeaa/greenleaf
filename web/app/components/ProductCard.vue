<script setup lang="ts">
import type { Product } from '~/types/payload'

const props = defineProps<{ product: Product }>()

const { formatPrice, waLink } = useSite()

const primaryImage = computed(() => props.product.images?.[0])
const href = computed(() => `/shop/${props.product.slug}`)

const hasDiscount = computed(
  () =>
    props.product.compareAtPrice != null &&
    props.product.compareAtPrice > (props.product.price ?? 0),
)
const discountPct = computed(() => {
  if (!hasDiscount.value || !props.product.compareAtPrice || !props.product.price) return 0
  return Math.round((1 - props.product.price / props.product.compareAtPrice) * 100)
})

const orderMessage = computed(() => {
  const p = props.product
  return `Hi! I'm interested in ${p.name} (${formatPrice(p.price)}). Is it available?`
})
const waHref = computed(() => waLink(orderMessage.value))
</script>

<template>
  <article class="card group overflow-hidden transition-shadow hover:shadow-md">
    <NuxtLink :to="href" class="block">
      <div class="relative aspect-square overflow-hidden bg-stone-100">
        <img
          v-if="primaryImage?.url"
          :src="primaryImage.url"
          :alt="primaryImage.alt || product.name"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div v-else class="flex h-full w-full items-center justify-center text-stone-400">
          <Icon name="lucide:image-off" class="h-10 w-10" />
        </div>

        <div class="absolute left-3 top-3 flex flex-col gap-2">
          <StockBadge :status="product.stockStatus ?? null" />
          <span v-if="hasDiscount" class="chip bg-accent-600 text-white">
            -{{ discountPct }}%
          </span>
        </div>
      </div>
    </NuxtLink>

    <div class="flex flex-col gap-3 p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="truncate font-medium text-stone-900">
            <NuxtLink :to="href" class="hover:text-brand-700">{{ product.name }}</NuxtLink>
          </h3>
          <p v-if="product.excerpt" class="mt-0.5 line-clamp-2 text-sm text-stone-500">
            {{ product.excerpt }}
          </p>
        </div>
      </div>

      <div class="flex items-end justify-between gap-2">
        <div class="flex flex-col">
          <span class="text-lg font-semibold text-stone-900">{{ formatPrice(product.price) }}</span>
          <span v-if="hasDiscount" class="text-xs text-stone-400 line-through">
            {{ formatPrice(product.compareAtPrice) }}
          </span>
        </div>
        <div class="flex items-center gap-2">
          <WishlistButton :product="product" />
          <a
            :href="waHref"
            target="_blank"
            rel="noopener"
            class="btn-whatsapp !px-3 !py-2"
            :aria-label="`Order ${product.name} on WhatsApp`"
          >
            <Icon name="lucide:message-circle" class="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  </article>
</template>
