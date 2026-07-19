<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Leaf, Loader2 } from 'lucide-vue-next'
import { login, errMessage } from '../lib/pb'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = errMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-stone-50 px-4">
    <div class="w-full max-w-sm">
      <div class="mb-8 text-center">
        <span class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-700 text-white">
          <Leaf class="h-6 w-6" />
        </span>
        <h1 class="font-display text-xl font-semibold text-stone-900">Greenleaf Admin</h1>
        <p class="mt-1 text-sm text-stone-500">Sign in to manage your store</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" required autocomplete="email" class="input" placeholder="admin@greenleaf.example" />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="password" type="password" required autocomplete="current-password" class="input" placeholder="••••••••" />
        </div>
        <div v-if="error" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ error }}</div>
        <button type="submit" :disabled="loading" class="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-50">
          <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <p class="mt-4 text-center text-xs text-stone-400">Use your Pocketbase superuser credentials.</p>
    </div>
  </div>
</template>
