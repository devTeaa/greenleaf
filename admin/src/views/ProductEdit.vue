<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2, Plus, X, Check } from 'lucide-vue-next'
import { get, create, update, list, errMessage, slugify } from '../lib/pb'

const router = useRouter()
const route = useRoute()
const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const errorMsg = ref('')

const categories = ref<{ id: string; name: string }[]>([])

const name = ref('')
const slug = ref('')
const excerpt = ref('')
const description = ref('')
const price = ref<number | null>(null)
const compareAtPrice = ref<number | null>(null)
const stockStatus = ref('in-stock')
const category = ref('')
const tags = ref<string[]>([])
const images = ref<{ url: string; alt: string }[]>([])
const careLight = ref('')
const careWater = ref('')
const careHumidity = ref('')
const careTemp = ref('')
const origin = ref('Thailand')

const tagOptions = [
  { value: 'new-arrival', label: 'New Arrival' },
  { value: 'best-seller', label: 'Best Seller' },
  { value: 'rare', label: 'Rare' },
  { value: 'featured', label: 'Featured' },
]
const stockOptions = [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'limited', label: 'Limited' },
  { value: 'pre-order', label: 'Pre-order' },
  { value: 'sold-out', label: 'Sold Out' },
]

onMounted(async () => {
  try {
    const catRes = await list<{ id: string; name: string }>('categories', { sort: 'order', perPage: 100 })
    categories.value = catRes.items

    if (!isNew.value) {
      const p = await get<Record<string, unknown>>('products', id.value)
      name.value = (p.name as string) || ''
      slug.value = (p.slug as string) || ''
      excerpt.value = (p.excerpt as string) || ''
      description.value = (p.description as string) || ''
      price.value = p.price as number
      compareAtPrice.value = (p.compareAtPrice as number) || null
      stockStatus.value = (p.stockStatus as string) || 'in-stock'
      category.value = (p.category as string) || ''
      tags.value = (p.tags as string[]) || []
      images.value = (p.images as { url: string; alt: string }[]) || []
      const care = p.careNotes as Record<string, string> | undefined
      careLight.value = care?.light || ''
      careWater.value = care?.water || ''
      careHumidity.value = care?.humidity || ''
      careTemp.value = care?.temperature || ''
      origin.value = (p.origin as string) || 'Thailand'
    }
  } catch (e) {
    errorMsg.value = errMessage(e)
  } finally {
    loading.value = false
  }
})

watch(name, (v) => {
  if (isNew.value || !slug.value) slug.value = slugify(v)
})

function addImage() { images.value.push({ url: '', alt: '' }) }
function removeImage(i: number) { images.value.splice(i, 1) }
function moveImage(i: number, dir: number) {
  const j = i + dir
  if (j < 0 || j >= images.value.length) return
  const arr = images.value
  const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
}

async function onSave() {
  saving.value = true
  saved.value = false
  errorMsg.value = ''
  try {
    const data = {
      name: name.value,
      slug: slug.value || slugify(name.value),
      excerpt: excerpt.value,
      description: description.value,
      price: price.value,
      compareAtPrice: compareAtPrice.value || null,
      stockStatus: stockStatus.value,
      category: category.value || null,
      tags: tags.value,
      images: images.value.filter((i) => i.url),
      careNotes: { light: careLight.value, water: careWater.value, humidity: careHumidity.value, temperature: careTemp.value },
      origin: origin.value,
    }
    if (isNew.value) {
      const created = await create('products', data) as { id: string }
      router.push(`/products/${created.id}`)
    } else {
      await update('products', id.value, data)
    }
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e) {
    errorMsg.value = errMessage(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-20 text-center text-stone-400">
    <Loader2 class="mx-auto h-6 w-6 animate-spin" />
  </div>

  <div v-else class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <RouterLink to="/products" custom v-slot="{ navigate }">
          <button @click="navigate" class="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
            <ArrowLeft class="h-5 w-5" />
          </button>
        </RouterLink>
        <h1 class="font-display text-xl font-semibold text-stone-900">{{ isNew ? 'New product' : name || 'Edit product' }}</h1>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="saved" class="flex items-center gap-1 text-sm font-medium text-brand-700"><Check class="h-4 w-4" /> Saved</span>
        <span v-if="errorMsg" class="text-sm font-medium text-red-600">{{ errorMsg }}</span>
        <button @click="onSave" :disabled="saving" class="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="space-y-6 lg:col-span-2">
        <section class="rounded-xl border border-stone-200 bg-white p-5">
          <h2 class="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Basic info</h2>
          <div class="space-y-3">
            <div><label class="label">Name *</label><input v-model="name" type="text" required class="input" /></div>
            <div><label class="label">Slug</label><input v-model="slug" type="text" class="input" /></div>
            <div><label class="label">Excerpt</label><textarea v-model="excerpt" rows="2" class="input"></textarea></div>
            <div><label class="label">Description (HTML)</label><textarea v-model="description" rows="5" class="input"></textarea></div>
          </div>
        </section>

        <section class="rounded-xl border border-stone-200 bg-white p-5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-xs font-semibold uppercase tracking-wide text-stone-500">Images</h2>
            <button @click="addImage" class="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"><Plus class="h-3 w-3" /> Add</button>
          </div>
          <div v-if="images.length === 0" class="py-3 text-center text-sm text-stone-400">No images yet.</div>
          <div v-else class="space-y-2">
            <div v-for="(img, i) in images" :key="i" class="flex items-center gap-2">
              <div class="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                <img v-if="img.url" :src="img.url" class="h-full w-full object-cover" />
              </div>
              <input v-model="img.url" placeholder="https://…" class="input flex-1" />
              <input v-model="img.alt" placeholder="alt text" class="input w-28" />
              <button @click="moveImage(i, -1)" :disabled="i === 0" class="p-1 text-stone-400 hover:bg-stone-100 disabled:opacity-30">↑</button>
              <button @click="moveImage(i, 1)" :disabled="i === images.length - 1" class="p-1 text-stone-400 hover:bg-stone-100 disabled:opacity-30">↓</button>
              <button @click="removeImage(i)" class="p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"><X class="h-4 w-4" /></button>
            </div>
          </div>
        </section>

        <section class="rounded-xl border border-stone-200 bg-white p-5">
          <h2 class="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Care notes</h2>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="mb-1 block text-xs text-stone-600">Light</label><input v-model="careLight" class="input" /></div>
            <div><label class="mb-1 block text-xs text-stone-600">Water</label><input v-model="careWater" class="input" /></div>
            <div><label class="mb-1 block text-xs text-stone-600">Humidity</label><input v-model="careHumidity" class="input" /></div>
            <div><label class="mb-1 block text-xs text-stone-600">Temperature</label><input v-model="careTemp" class="input" /></div>
          </div>
        </section>
      </div>

      <div class="space-y-6">
        <section class="rounded-xl border border-stone-200 bg-white p-5">
          <h2 class="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Pricing</h2>
          <div class="space-y-3">
            <div><label class="label">Price ($) *</label><input v-model.number="price" type="number" min="0" step="1" class="input" /></div>
            <div><label class="label">Compare at ($)</label><input v-model.number="compareAtPrice" type="number" min="0" step="1" class="input" /><p class="mt-1 text-xs text-stone-400">Original price for showing discount.</p></div>
            <div><label class="label">Stock status</label><select v-model="stockStatus" class="input"><option v-for="s in stockOptions" :key="s.value" :value="s.value">{{ s.label }}</option></select></div>
          </div>
        </section>

        <section class="rounded-xl border border-stone-200 bg-white p-5">
          <h2 class="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Organization</h2>
          <div class="space-y-3">
            <div>
              <label class="label">Category</label>
              <select v-model="category" class="input">
                <option value="">— None —</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-2 block text-sm font-medium text-stone-700">Tags</label>
              <div class="flex flex-wrap gap-2">
                <label v-for="t in tagOptions" :key="t.value" :class="['cursor-pointer rounded-full px-3 py-1 text-xs font-medium border transition-colors', tags.includes(t.value) ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-stone-300 text-stone-600 hover:bg-stone-100']">
                  <input type="checkbox" :value="t.value" v-model="tags" class="hidden" />
                  {{ t.label }}
                </label>
              </div>
            </div>
            <div><label class="label">Origin</label><input v-model="origin" class="input" /></div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
