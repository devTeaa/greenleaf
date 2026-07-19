<script setup lang="ts">
const props = defineProps<{
  status?: 'in-stock' | 'limited' | 'pre-order' | 'sold-out' | null
}>()

const config: Record<string, { label: string; class: string }> = {
  'in-stock': { label: 'In Stock', class: 'bg-brand-100 text-brand-800' },
  'limited': { label: 'Limited', class: 'bg-accent-100 text-accent-700' },
  'pre-order': { label: 'Pre-order', class: 'bg-blue-100 text-blue-800' },
  'sold-out': { label: 'Sold Out', class: 'bg-stone-200 text-stone-600' },
}

const current = computed(() => (props.status ? config[props.status] : null))
</script>

<template>
  <span v-if="current" :class="['chip', current.class]">{{ current.label }}</span>
</template>
