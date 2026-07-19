<script setup lang="ts">
const { settings } = useSite()
const { categories, footerPages } = useNav()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-20 border-t border-stone-200 bg-stone-900 text-stone-300">
    <div class="container-page grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
      <div class="col-span-2 sm:col-span-1">
        <div class="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <span class="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
            <Icon name="lucide:leaf" class="h-5 w-5" />
          </span>
          {{ settings?.siteName ?? 'Greenleaf' }}
        </div>
        <p class="mt-3 max-w-xs text-sm text-stone-400">
          {{ settings?.description }}
        </p>
      </div>

      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Shop</h4>
        <ul class="mt-3 space-y-2 text-sm">
          <li>
            <NuxtLink to="/shop" class="hover:text-white">All Plants</NuxtLink>
          </li>
          <li v-for="cat in categories?.docs" :key="cat.id">
            <NuxtLink :to="`/category/${cat.slug}`" class="hover:text-white">
              {{ cat.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Company</h4>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="page in footerPages" :key="page.id">
            <NuxtLink :to="`/${page.slug}`" class="hover:text-white">
              {{ page.title }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-stone-400">Connect</h4>
        <ul class="mt-3 space-y-2 text-sm">
          <li v-for="social in settings?.social" :key="social.platform">
            <a
              :href="social.url"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 hover:text-white"
            >
              <Icon :name="`lucide:${social.icon || 'globe'}`" class="h-4 w-4" />
              {{ social.platform }}
            </a>
          </li>
        </ul>
        <a
          v-if="settings?.contactEmail"
          :href="`mailto:${settings.contactEmail}`"
          class="mt-3 inline-block text-sm text-stone-400 hover:text-white"
        >
          {{ settings.contactEmail }}
        </a>
      </div>
    </div>

    <div class="border-t border-stone-800">
      <div class="container-page py-4 text-center text-xs text-stone-500">
        © {{ year }} {{ settings?.siteName ?? 'Greenleaf' }}. All rights reserved.
      </div>
    </div>
  </footer>
</template>
