<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft, Loader2, Check } from 'lucide-vue-next'
import { get, create, update, errMessage, slugify } from '../lib/pb'

const router = useRouter()
const route = useRoute()
const id = computed(() => route.params.id as string)
const isNew = computed(() => id.value === 'new')

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const errorMsg = ref('')

const name = ref('')
const slug = ref('')
const description = ref('')
const order = ref(0)

onMounted(async () => {
  if (!isNew.value) {
    try {
      const c = await get<Record<string, unknown>>('categories', id.value)
      name.value = (c.name as string) || ''
      slug.value = (c.slug as string) || ''
      description.value = (c.description as string) || ''
      order.value = (c.order as number) || 0
    } catch (e) {
      errorMsg.value = errMessage(e)
    }
  }
  loading.value = false
})

watch(name, (v) => {
  if (isNew.value || !slug.value) slug.value = slugify(v)
})

async function onSave() {
  saving.value = true
  saved.value = false
  errorMsg.value = ''
  try {
    const data = {
      name: name.value,
      slug: slug.value || slugify(name.value),
      description: description.value,
      order: typeof order.value === 'number' && !isNaN(order.value) ? order.value : 0,
    }
    if (isNew.value) {
      const created = await create('categories', data) as { id: string }
      router.push(`/categories/${created.id}`)
    } else {
      await update('categories', id.value, data)
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

  <div v-else class="mx-auto max-w-lg space-y-6">
    <div class="flex items-center gap-3">
      <RouterLink to="/categories" custom v-slot="{ navigate }">
        <button @click="navigate" class="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100">
          <ArrowLeft class="h-5 w-5" />
        </button>
      </RouterLink>
      <h1 class="font-display text-xl font-semibold text-stone-900">{{ isNew ? 'New category' : name || 'Edit category' }}</h1>
    </div>

    <section class="rounded-xl border border-stone-200 bg-white p-6">
      <div class="space-y-4">
        <div><label class="label">Name *</label><input v-model="name" type="text" class="input" /></div>
        <div><label class="label">Slug</label><input v-model="slug" type="text" class="input" /></div>
        <div><label class="label">Description</label><textarea v-model="description" rows="3" class="input"></textarea></div>
        <div>
          <label class="label">Order</label>
          <input v-model.number="order" type="number" min="0" class="input w-24" />
          <p class="mt-1 text-xs text-stone-400">Lower numbers appear first.</p>
        </div>
      </div>
    </section>

    <div class="flex items-center justify-end gap-3">
      <span v-if="saved" class="flex items-center gap-1 text-sm font-medium text-brand-700"><Check class="h-4 w-4" /> Saved</span>
      <span v-if="errorMsg" class="text-sm font-medium text-red-600">{{ errorMsg }}</span>
      <button @click="onSave" :disabled="saving" class="rounded-lg bg-brand-700 px-6 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  </div>
</template>
