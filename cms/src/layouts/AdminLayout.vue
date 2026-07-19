<script setup lang="ts">
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { Leaf, LayoutDashboard, Package, FolderOpen, Settings, ExternalLink, LogOut } from 'lucide-vue-next'
import { pb, logout } from '../lib/pb'

const router = useRouter()
const email = pb.authStore.record?.email || 'admin'

const nav = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, exact: true },
  { label: 'Products', to: '/products', icon: Package },
  { label: 'Categories', to: '/categories', icon: FolderOpen },
  { label: 'Settings', to: '/settings', icon: Settings },
]

function doLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen bg-stone-50">
    <aside class="fixed inset-y-0 left-0 z-30 w-56 border-r border-stone-200 bg-white">
      <div class="flex h-14 items-center gap-2 border-b border-stone-200 px-5">
        <span class="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-white">
          <Leaf class="h-4 w-4" />
        </span>
        <span class="font-display text-sm font-semibold">Greenleaf</span>
      </div>
      <nav class="space-y-1 p-3">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            $route.path === item.to || (!item.exact && $route.path.startsWith(item.to))
              ? 'bg-brand-50 text-brand-700'
              : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900',
          ]"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </RouterLink>
      </nav>
      <div class="absolute inset-x-0 bottom-0 border-t border-stone-200 p-3">
        <a href="/" target="_blank" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-stone-100">
          <ExternalLink class="h-4 w-4" />
          View store
        </a>
      </div>
    </aside>

    <div class="ml-56 flex-1">
      <header class="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-stone-200 bg-white/90 px-6 backdrop-blur">
        <div></div>
        <div class="flex items-center gap-3">
          <span class="text-xs text-stone-500">{{ email }}</span>
          <button @click="doLogout" class="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100">
            <LogOut class="h-3 w-3" /> Log out
          </button>
        </div>
      </header>
      <main class="p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
