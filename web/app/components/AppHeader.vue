<script setup lang="ts">
const { settings } = useSite()
const { categories, navPages } = useNav()

const mobileOpen = ref(false)
const shopOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
    <div class="container-page flex h-16 items-center justify-between gap-4">
      <Logo :site-name="settings?.siteName" />

      <nav class="hidden items-center gap-1 md:flex">
        <div class="relative group">
          <NuxtLink
            to="/shop"
            class="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
          >
            Shop
            <Icon name="lucide:chevron-down" class="h-4 w-4" />
          </NuxtLink>
          <div
            class="invisible absolute left-0 top-full w-56 translate-y-1 rounded-2xl border border-stone-200 bg-white p-2 opacity-0 shadow-lg transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100"
          >
            <NuxtLink
              v-for="cat in categories?.docs"
              :key="cat.id"
              :to="`/category/${cat.slug}`"
              class="block rounded-lg px-3 py-2 text-sm text-stone-700 hover:bg-stone-100 hover:text-stone-900"
            >
              {{ cat.name }}
            </NuxtLink>
            <div class="my-1 border-t border-stone-200" />
            <NuxtLink
              to="/shop"
              class="block rounded-lg px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              View all plants →
            </NuxtLink>
          </div>
        </div>

        <NuxtLink
          v-for="page in navPages"
          :key="page.id"
          :to="`/${page.slug}`"
          class="rounded-full px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 hover:text-stone-900"
        >
          {{ page.title }}
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-2">
        <WishlistIndicator />
        <WhatsAppButton variant="icon" label="Chat on WhatsApp" class="hidden sm:inline-flex" />
        <button
          @click="mobileOpen = !mobileOpen"
          class="rounded-full p-2 text-stone-700 hover:bg-stone-100 md:hidden"
          aria-label="Toggle menu"
        >
          <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="mobileOpen" class="border-t border-stone-200 bg-white md:hidden">
        <div class="container-page space-y-1 py-4">
          <NuxtLink to="/shop" class="block rounded-lg px-3 py-2 font-medium text-stone-900 hover:bg-stone-100" @click="mobileOpen = false">
            Shop All
          </NuxtLink>
          <NuxtLink
            v-for="cat in categories?.docs"
            :key="cat.id"
            :to="`/category/${cat.slug}`"
            class="block rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-100"
            @click="mobileOpen = false"
          >
            {{ cat.name }}
          </NuxtLink>
          <div class="my-2 border-t border-stone-200" />
          <NuxtLink
            v-for="page in navPages"
            :key="page.id"
            :to="`/${page.slug}`"
            class="block rounded-lg px-3 py-2 text-stone-700 hover:bg-stone-100"
            @click="mobileOpen = false"
          >
            {{ page.title }}
          </NuxtLink>
          <div class="pt-2">
            <WhatsAppButton block />
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>
