<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Store, MessageCircle, Share2, Image, Plus, Trash2, ChevronUp, ChevronDown, Loader2, Check } from 'lucide-vue-next'
import { list, update, errMessage } from '../lib/pb'

type SocialLink = { platform: string; url: string; icon: string }
type HeroSlide = { title: string; subtitle: string; imageUrl: string; ctaText: string; ctaLink: string }

const loading = ref(true)
const saving = ref(false)
const saved = ref(false)
const errorMsg = ref('')
const recordId = ref('')

const siteName = ref('')
const tagline = ref('')
const description = ref('')
const contactEmail = ref('')
const whatsappNumber = ref('')
const whatsappDefaultMessage = ref('')
const currency = ref('USD')
const social = ref<SocialLink[]>([])
const heroSlides = ref<HeroSlide[]>([])

onMounted(async () => {
  try {
    const res = await list('settings', { perPage: 1 })
    const s = (res.items[0] || null) as Record<string, unknown> | null
    if (!s) {
      errorMsg.value = 'Settings record not found. Run `pnpm seed` first.'
      loading.value = false
      return
    }
    recordId.value = s.id as string
    siteName.value = (s.siteName as string) || ''
    tagline.value = (s.tagline as string) || ''
    description.value = (s.description as string) || ''
    contactEmail.value = (s.contactEmail as string) || ''
    whatsappNumber.value = (s.whatsappNumber as string) || ''
    whatsappDefaultMessage.value = (s.whatsappDefaultMessage as string) || ''
    currency.value = (s.currency as string) || 'USD'
    social.value = Array.isArray(s.social) ? (s.social as SocialLink[]) : []
    heroSlides.value = Array.isArray(s.heroSlides) ? (s.heroSlides as HeroSlide[]) : []
  } catch (e) {
    errorMsg.value = errMessage(e)
  } finally {
    loading.value = false
  }
})

async function onSave() {
  saving.value = true
  saved.value = false
  errorMsg.value = ''
  try {
    await update('settings', recordId.value, {
      siteName: siteName.value,
      tagline: tagline.value,
      description: description.value,
      contactEmail: contactEmail.value,
      whatsappNumber: whatsappNumber.value,
      whatsappDefaultMessage: whatsappDefaultMessage.value,
      currency: currency.value,
      social: social.value,
      heroSlides: heroSlides.value,
    })
    saved.value = true
    setTimeout(() => { saved.value = false }, 3000)
  } catch (e) {
    errorMsg.value = errMessage(e)
  } finally {
    saving.value = false
  }
}

function addSocial() { social.value.push({ platform: '', url: '', icon: 'globe' }) }
function removeSocial(i: number) { social.value.splice(i, 1) }
function addSlide() { heroSlides.value.push({ title: '', subtitle: '', imageUrl: '', ctaText: 'Shop Now', ctaLink: '/shop' }) }
function removeSlide(i: number) { heroSlides.value.splice(i, 1) }
function moveSlide(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= heroSlides.value.length) return
  const arr = heroSlides.value
  const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-20 text-stone-400">
    <Loader2 class="mr-2 h-5 w-5 animate-spin" /> Loading settings…
  </div>

  <div v-else-if="errorMsg && !recordId" class="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
    <p class="text-sm text-red-700">{{ errorMsg }}</p>
  </div>

  <div v-else class="space-y-8">
    <div class="flex items-end justify-between">
      <div>
        <h1 class="font-display text-2xl font-semibold text-stone-900">Settings</h1>
        <p class="mt-1 text-sm text-stone-500">Manage your store's brand, WhatsApp, and hero content.</p>
      </div>
      <div class="flex items-center gap-3">
        <span v-if="saved" class="flex items-center gap-1 text-sm font-medium text-brand-700"><Check class="h-4 w-4" /> Saved</span>
        <span v-if="errorMsg" class="text-sm font-medium text-red-600">{{ errorMsg }}</span>
        <button @click="onSave" :disabled="saving" class="rounded-lg bg-brand-700 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
          {{ saving ? 'Saving…' : 'Save changes' }}
        </button>
      </div>
    </div>

    <section class="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500"><Store class="h-4 w-4" /> Brand</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label class="label">Site name</label><input v-model="siteName" type="text" class="input" /></div>
        <div><label class="label">Contact email</label><input v-model="contactEmail" type="email" class="input" /></div>
        <div class="sm:col-span-2"><label class="label">Tagline</label><input v-model="tagline" type="text" class="input" /><p class="mt-1 text-xs text-stone-400">Shows in browser tab title and SEO meta.</p></div>
        <div class="sm:col-span-2"><label class="label">Description (SEO)</label><textarea v-model="description" rows="3" class="input"></textarea><p class="mt-1 text-xs text-stone-400">Long description for search engines and social sharing.</p></div>
      </div>
    </section>

    <section class="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 class="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500"><MessageCircle class="h-4 w-4" /> WhatsApp</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label class="label">WhatsApp number</label><input v-model="whatsappNumber" type="text" placeholder="15551234567" class="input" /><p class="mt-1 text-xs text-stone-400">International format, digits only.</p></div>
        <div><label class="label">Currency</label><select v-model="currency" class="input"><option value="USD">USD $ (US Dollar)</option><option value="THB">THB ฿ (Thai Baht)</option><option value="EUR">EUR € (Euro)</option></select></div>
        <div class="sm:col-span-2"><label class="label">Default WhatsApp message</label><textarea v-model="whatsappDefaultMessage" rows="2" class="input"></textarea></div>
      </div>
    </section>

    <section class="rounded-2xl border border-stone-200 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500"><Share2 class="h-4 w-4" /> Social Links</h2>
        <button @click="addSocial" class="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"><Plus class="h-3 w-3" /> Add link</button>
      </div>
      <div v-if="social.length === 0" class="py-4 text-center text-sm text-stone-400">No social links yet.</div>
      <div v-else class="space-y-2">
        <div v-for="(s, i) in social" :key="i" class="flex items-center gap-2">
          <input v-model="s.platform" placeholder="Instagram" class="input w-32" />
          <input v-model="s.icon" placeholder="instagram" class="input w-28" />
          <input v-model="s.url" placeholder="https://instagram.com/yourhandle" class="input flex-1" />
          <button @click="removeSocial(i)" class="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 class="h-4 w-4" /></button>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-stone-200 bg-white p-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500"><Image class="h-4 w-4" /> Hero Slides</h2>
        <button @click="addSlide" class="flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800"><Plus class="h-3 w-3" /> Add slide</button>
      </div>
      <div v-if="heroSlides.length === 0" class="py-4 text-center text-sm text-stone-400">No hero slides.</div>
      <div v-else class="space-y-4">
        <div v-for="(slide, i) in heroSlides" :key="i" class="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs font-semibold uppercase text-stone-400">Slide {{ i + 1 }}</span>
            <div class="flex items-center gap-1">
              <button @click="moveSlide(i, -1)" :disabled="i === 0" class="rounded p-1 text-stone-400 hover:bg-stone-200 disabled:opacity-30"><ChevronUp class="h-4 w-4" /></button>
              <button @click="moveSlide(i, 1)" :disabled="i === heroSlides.length - 1" class="rounded p-1 text-stone-400 hover:bg-stone-200 disabled:opacity-30"><ChevronDown class="h-4 w-4" /></button>
              <button @click="removeSlide(i)" class="rounded p-1 text-stone-400 hover:bg-red-50 hover:text-red-600"><Trash2 class="h-4 w-4" /></button>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label class="mb-1 block text-xs font-medium text-stone-600">Title</label><input v-model="slide.title" type="text" class="input" /></div>
            <div><label class="mb-1 block text-xs font-medium text-stone-600">CTA text</label><input v-model="slide.ctaText" type="text" class="input" /></div>
            <div class="sm:col-span-2"><label class="mb-1 block text-xs font-medium text-stone-600">Subtitle</label><input v-model="slide.subtitle" type="text" class="input" /></div>
            <div class="sm:col-span-2"><label class="mb-1 block text-xs font-medium text-stone-600">Image URL</label><input v-model="slide.imageUrl" type="url" placeholder="https://…" class="input" /></div>
            <div><label class="mb-1 block text-xs font-medium text-stone-600">CTA link</label><input v-model="slide.ctaLink" type="text" placeholder="/shop" class="input" /></div>
          </div>
        </div>
      </div>
    </section>

    <div class="sticky bottom-0 flex items-center justify-end gap-3 border-t border-stone-200 bg-white/90 px-6 py-3 backdrop-blur">
      <span v-if="saved" class="text-sm font-medium text-brand-700">✓ Saved</span>
      <span v-if="errorMsg" class="text-sm font-medium text-red-600">{{ errorMsg }}</span>
      <button @click="onSave" :disabled="saving" class="rounded-lg bg-brand-700 px-6 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
        {{ saving ? 'Saving…' : 'Save changes' }}
      </button>
    </div>
  </div>
</template>
