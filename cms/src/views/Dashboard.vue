<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Package, FolderOpen, FileText, Plus, Settings as SettingsIcon } from 'lucide-vue-next'
import { list } from '../lib/pb'

const productCount = ref(0)
const categoryCount = ref(0)
const pageCount = ref(0)

onMounted(async () => {
  try {
    const [p, c, pg] = await Promise.all([
      list('products', { perPage: 1 }),
      list('categories', { perPage: 1 }),
      list('pages', { perPage: 1 }),
    ])
    productCount.value = p.totalItems
    categoryCount.value = c.totalItems
    pageCount.value = pg.totalItems
  } catch {}
})

const stats = [
  { label: 'Products', count: () => productCount.value, icon: Package, to: '/products', color: 'bg-brand-50 text-brand-700' },
  { label: 'Categories', count: () => categoryCount.value, icon: FolderOpen, to: '/categories', color: 'bg-blue-50 text-blue-700' },
  { label: 'Pages', count: () => pageCount.value, icon: FileText, to: '/settings', color: 'bg-amber-50 text-amber-700' },
]
</script>

<template>
  <div>
    <h1 class="mb-6 font-display text-2xl font-semibold text-stone-900">Dashboard</h1>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <RouterLink v-for="s in stats" :key="s.label" :to="s.to" class="group rounded-2xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-md">
        <div :class="['mb-3 flex h-10 w-10 items-center justify-center rounded-xl', s.color]">
          <component :is="s.icon" class="h-5 w-5" />
        </div>
        <p class="text-2xl font-semibold text-stone-900">{{ s.count() }}</p>
        <p class="text-sm text-stone-500">{{ s.label }}</p>
      </RouterLink>
    </div>

    <div class="mt-8 rounded-2xl border border-stone-200 bg-white p-6">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">Quick actions</h2>
      <div class="flex flex-wrap gap-3">
        <RouterLink to="/products/new" class="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
          <Plus class="h-4 w-4" /> New product
        </RouterLink>
        <RouterLink to="/categories/new" class="flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
          <Plus class="h-4 w-4" /> New category
        </RouterLink>
        <RouterLink to="/settings" class="flex items-center gap-1.5 rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
          <SettingsIcon class="h-4 w-4" /> Edit settings
        </RouterLink>
      </div>
    </div>
  </div>
</template>
