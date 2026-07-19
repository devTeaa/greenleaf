<script setup lang="ts">
import type { Category } from '~/types/payload'

defineProps<{ category: Category; count?: number }>()
</script>

<template>
  <NuxtLink
    :to="`/category/${category.slug}`"
    class="card group relative block aspect-[4/5] overflow-hidden"
  >
    <img
      v-if="category.image && typeof category.image === 'object' && 'url' in category.image"
      :src="(category.image as { url?: string }).url"
      :alt="category.name"
      loading="lazy"
      class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-700 to-brand-900 text-white"
    >
      <Icon name="lucide:leaf" class="h-12 w-12 opacity-60" />
    </div>

    <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
    <div class="absolute inset-x-0 bottom-0 p-4 text-white">
      <h3 class="font-display text-lg font-semibold">{{ category.name }}</h3>
      <p v-if="count != null" class="text-xs text-white/70">{{ count }} plants</p>
      <p v-else-if="category.description" class="mt-0.5 line-clamp-2 text-xs text-white/80">
        {{ category.description }}
      </p>
    </div>
  </NuxtLink>
</template>
