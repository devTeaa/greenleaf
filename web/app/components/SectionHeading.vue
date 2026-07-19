<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; to?: string }>()
</script>

<template>
  <div class="mb-6 flex items-end justify-between gap-4">
    <div>
      <h2 class="font-display text-2xl font-semibold sm:text-3xl">{{ title }}</h2>
      <p v-if="subtitle" class="mt-1 text-sm text-stone-500">{{ subtitle }}</p>
    </div>
    <NuxtLink
      v-if="to"
      :to="to"
      class="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"
    >
      View all
      <Icon name="lucide:arrow-right" class="h-4 w-4" />
    </NuxtLink>
  </div>
</template>
