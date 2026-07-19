<script setup lang="ts">
const { count, open } = useWishlist()
</script>

<template>
  <button
    @click="open"
    class="relative rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
    aria-label="Open wishlist"
  >
    <Icon name="lucide:heart" class="h-5 w-5" />
    <ClientOnly>
      <span
        v-if="count > 0"
        class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-600 px-1 text-[10px] font-bold text-white"
      >
        {{ count > 9 ? '9+' : count }}
      </span>
    </ClientOnly>
  </button>
</template>
