<script setup lang="ts">
const { items, isOpen, close, total, message, clear, remove } = useWishlist()
const { waLink, formatPrice } = useSite()

const waHref = computed(() => waLink(message.value))

const sendAndClear = () => {
  // Waits for the WhatsApp tab to open, then clears the wishlist.
  // Small delay so users can verify the message before we wipe state.
  setTimeout(() => {
    clear()
    close()
  }, 500)
}
</script>

<template>
  <ClientOnly>
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-150"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          @click="close"
        />
      </Transition>

      <Transition
        enter-active-class="transition-transform duration-300 ease-out"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition-transform duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <aside
          v-if="isOpen"
          class="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          aria-label="Wishlist"
        >
          <header class="flex items-center justify-between border-b border-stone-200 px-5 py-4">
            <div>
              <h2 class="font-display text-lg font-semibold">Your Wishlist</h2>
              <p class="text-xs text-stone-500">{{ items.length }} item{{ items.length === 1 ? '' : 's' }}</p>
            </div>
            <button
              @click="close"
              class="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              aria-label="Close wishlist"
            >
              <Icon name="lucide:x" class="h-5 w-5" />
            </button>
          </header>

          <div v-if="items.length === 0" class="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <Icon name="lucide:heart" class="h-8 w-8 text-stone-400" />
            </div>
            <div>
              <p class="font-medium text-stone-900">Your wishlist is empty</p>
              <p class="mt-1 text-sm text-stone-500">Browse the catalog and tap the heart on any plant to save it here.</p>
            </div>
            <NuxtLink to="/shop" class="btn-primary mt-2" @click="close">Browse plants</NuxtLink>
          </div>

          <ul v-else class="flex-1 divide-y divide-stone-200 overflow-y-auto">
            <li v-for="item in items" :key="item.id" class="flex gap-3 p-4">
              <NuxtLink :to="`/shop/${item.slug}`" class="shrink-0" @click="close">
                <div class="h-16 w-16 overflow-hidden rounded-lg bg-stone-100">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.name"
                    class="h-full w-full object-cover"
                  />
                </div>
              </NuxtLink>
              <div class="flex min-w-0 flex-1 flex-col">
                <NuxtLink
                  :to="`/shop/${item.slug}`"
                  class="truncate text-sm font-medium text-stone-900 hover:text-brand-700"
                  @click="close"
                >
                  {{ item.name }}
                </NuxtLink>
                <span class="text-sm text-stone-600">{{ formatPrice(item.price) }}</span>
              </div>
              <button
                @click="remove(item.id)"
                class="self-start rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                :aria-label="`Remove ${item.name} from wishlist`"
              >
                <Icon name="lucide:trash-2" class="h-4 w-4" />
              </button>
            </li>
          </ul>

          <footer v-if="items.length > 0" class="border-t border-stone-200 bg-stone-50 p-5">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm text-stone-600">Estimated total</span>
              <span class="text-xl font-semibold text-stone-900">{{ formatPrice(total) }}</span>
            </div>
            <a
              :href="waHref"
              target="_blank"
              rel="noopener"
              class="btn-whatsapp w-full !py-3"
              @click="sendAndClear"
            >
              <Icon name="lucide:message-circle" class="h-5 w-5" />
              Send wishlist on WhatsApp
            </a>
            <p class="mt-2 text-center text-xs text-stone-500">
              Opens WhatsApp with your list pre-filled. We'll confirm availability & shipping.
            </p>
            <button
              @click="clear"
              class="mt-3 w-full text-center text-xs text-stone-500 underline hover:text-stone-700"
            >
              Clear all items
            </button>
          </footer>
        </aside>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>
