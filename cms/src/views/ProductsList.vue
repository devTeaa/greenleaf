<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { Loader2, Pencil, Trash2, Plus, PackageX } from 'lucide-vue-next'
import { list, remove, errMessage } from '../lib/pb'

type Product = Record<string, unknown> & {
  id: string; name: string; price: number; stockStatus: string
  images?: { url: string; alt?: string }[]
  expand?: { category?: { name: string } }
}

const loading = ref(true)
const products = ref<Product[]>([])
const total = ref(0)
const search = ref('')
const sort = ref('-id')
const deleting = ref<string | null>(null)
const errorMsg = ref('')

async function load() {
  loading.value = true
  errorMsg.value = ''
  try {
    const filter = search.value.trim() ? `name ~ "${search.value.trim()}"` : undefined
    const res = await list<Product>('products', { sort: sort.value, perPage: 100, filter, expand: 'category' })
    products.value = res.items
    total.value = res.totalItems
  } catch (e) {
    products.value = []
    errorMsg.value = errMessage(e)
  } finally {
    loading.value = false
  }
}

let timer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(load, 300)
})

onMounted(load)

const stockLabels: Record<string, string> = {
  'in-stock': 'In Stock', 'limited': 'Limited', 'pre-order': 'Pre-order', 'sold-out': 'Sold Out',
}
const stockColors: Record<string, string> = {
  'in-stock': 'bg-brand-100 text-brand-700', 'limited': 'bg-amber-100 text-amber-700',
  'pre-order': 'bg-blue-100 text-blue-700', 'sold-out': 'bg-stone-100 text-stone-500',
}

async function confirmDelete(id: string, name: string) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
  deleting.value = id
  try {
    await remove('products', id)
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
        <h1 class="font-display text-2xl font-semibold text-stone-900">Products</h1>
        <p class="text-sm text-stone-500">{{ total }} products</p>
      </div>
      <RouterLink to="/products/new" class="flex items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800">
        <Plus class="h-4 w-4" /> New product
      </RouterLink>
    </div>

    <div class="mb-4 flex gap-3">
      <input v-model="search" type="text" placeholder="Search products…" class="input flex-1" />
      <select v-model="sort" @change="load" class="rounded-lg border border-stone-300 px-3 py-2 text-sm">
        <option value="-id">Newest first</option>
        <option value="name">Name A–Z</option>
        <option value="price">Price low–high</option>
        <option value="-price">Price high–low</option>
      </select>
    </div>

    <div v-if="loading" class="py-20 text-center text-stone-400">
      <Loader2 class="mx-auto h-6 w-6 animate-spin" />
    </div>

    <div v-else-if="errorMsg" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMsg }}</div>

    <div v-else-if="products.length === 0" class="rounded-xl border border-dashed border-stone-300 py-16 text-center text-stone-500">
      <PackageX class="mx-auto h-8 w-8" />
      <p class="mt-2">No products found.</p>
    </div>

    <div v-else class="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <table class="w-full text-sm">
        <thead class="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-500">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Product</th>
            <th class="px-4 py-3 text-left font-medium">Price</th>
            <th class="px-4 py-3 text-left font-medium">Stock</th>
            <th class="px-4 py-3 text-left font-medium">Category</th>
            <th class="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-stone-100">
          <tr v-for="p in products" :key="p.id" class="hover:bg-stone-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="h-10 w-10 overflow-hidden rounded-lg bg-stone-100">
                  <img v-if="p.images?.[0]?.url" :src="p.images[0].url" :alt="p.name" class="h-full w-full object-cover" />
                </div>
                <RouterLink :to="`/products/${p.id}`" class="font-medium text-stone-900 hover:text-brand-700">{{ p.name }}</RouterLink>
              </div>
            </td>
            <td class="px-4 py-3 font-medium text-stone-700">${{ p.price }}</td>
            <td class="px-4 py-3">
              <span :class="['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', stockColors[p.stockStatus] || 'bg-stone-100 text-stone-500']">
                {{ stockLabels[p.stockStatus] || p.stockStatus }}
              </span>
            </td>
            <td class="px-4 py-3 text-stone-600">{{ p.expand?.category?.name || '—' }}</td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <RouterLink :to="`/products/${p.id}`" class="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-brand-700">
                  <Pencil class="h-4 w-4" />
                </RouterLink>
                <button @click="confirmDelete(p.id, p.name)" :disabled="deleting === p.id" class="rounded-lg p-1.5 text-stone-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50">
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
