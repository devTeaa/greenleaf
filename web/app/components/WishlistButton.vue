<script setup lang="ts">
import type { Product } from '~/types/payload'

const props = defineProps<{
  product: Product
  variant?: 'icon' | 'full'
}>()

const { has, toggle, open } = useWishlist()
const inList = computed(() => has(props.product.id))

const onClick = () => {
  toggle(props.product)
  if (inList.value) open()
}
</script>

<template>
  <button
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-full text-sm font-medium transition-colors',
      variant === 'full' ? 'px-5 py-2.5' : 'p-2',
      inList
        ? 'bg-brand-700 text-white hover:bg-brand-800'
        : 'border border-stone-300 bg-white text-stone-700 hover:bg-stone-100',
    ]"
    :aria-label="inList ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`"
    :title="inList ? 'In wishlist' : 'Add to wishlist'"
    @click="onClick"
  >
    <Icon :name="inList ? 'lucide:check' : 'lucide:heart'" class="h-4 w-4" />
    <span v-if="variant === 'full'">{{ inList ? 'In wishlist' : 'Add to wishlist' }}</span>
  </button>
</template>
