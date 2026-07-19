<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Loader2, FolderOpen, FolderX, Plus, Pencil, Trash2 } from 'lucide-vue-next'
import { list, remove, errMessage } from '../lib/pb'

type Category = Record<string, unknown> & { id: string; name: string; description?: string; order?: number }

const loading = ref(true)
const categories = ref<Category[]>([])
const deleting = ref<string | null>(null)
const errorMsg = ref('')

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await list<Category>('categories', { sort: 'order', perPage: 100 })
    categories.value = res.items
  } catch (e) {
    categories.value = []
    errorMsg.value = errMessage(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function confirmDelete(id: string, name: string) {
  if (!confirm(`Delete category "${name}"? Products in this category will remain but be uncategorized.`)) return
  deleting.value = id
  try {
    await remove('categories', id)
    await load()
  } catch (e) {
    alert(errMessage(e))
  } finally {
    deleting.value = null
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-semibold text-stone-900">Categories</h1>
        <p class="text-sm text-stone-500">{{ categories.length }} categories</p>
      </div>
      <RouterLink to="/categories/new" class="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
        <Plus class="h-4 w-4" /> New category
      </RouterLink>
    </div>

    <div v-if="loading" class="py-20 text-center text-stone-400">
      <Loader2 class="mx-auto h-6 w-6 animate-spin" />
    </div>

    <div v-else-if="errorMsg" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMsg }}</div>

    <div v-else-if="categories.length === 0" class="rounded-xl border border-dashed border-stone-300 py-16 text-center text-stone-500">
      <FolderX class="mx-auto h-8 w-8" />
      <p class="mt-2">No categories yet.</p>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="cat in categories" :key="cat.id" class="group rounded-xl border border-stone-200 bg-white p-4 transition-shadow hover:shadow-md">
        <div class="mb-2 flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <FolderOpen class="h-4 w-4" />
            </span>
            <RouterLink :to="`/categories/${cat.id}`" class="font-medium text-stone-900 hover:text-brand-700">{{ cat.name }}</RouterLink>
          </div>
          <span class="text-xs text-stone-400">#{{ cat.order ?? 0 }}</span>
        </div>
        <p class="mb-3 line-clamp-2 text-sm text-stone-500">{{ cat.description || 'No description' }}</p>
        <div class="flex gap-2">
          <RouterLink :to="`/categories/${cat.id}`" class="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100">
            <Pencil class="h-3 w-3" /> Edit
          </RouterLink>
          <button @click="confirmDelete(cat.id, cat.name)" :disabled="deleting === cat.id" class="flex items-center gap-1 rounded-lg border border-stone-300 px-3 py-1 text-xs font-medium text-stone-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
            <Trash2 class="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
