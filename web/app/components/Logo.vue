<script setup lang="ts">
defineProps<{ siteName?: string | null }>()
</script>

<template>
  <NuxtLink to="/" class="flex items-center gap-2 font-semibold">
    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-white">
      <Icon name="lucide:leaf" class="h-5 w-5" />
    </span>
    <span class="font-display text-lg tracking-tight text-stone-900">{{ siteName ?? 'Greenleaf' }}</span>
  </NuxtLink>
</template>
