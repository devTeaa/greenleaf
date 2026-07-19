<script setup lang="ts">
import type { Setting } from '~/types/payload'

const props = defineProps<{ slides?: Setting['heroSlides'] }>()

const current = ref(0)
const len = computed(() => props.slides?.length ?? 0)

const go = (i: number) => {
  if (len.value) current.value = (i + len.value) % len.value
}
const next = () => go(current.value + 1)
const prev = () => go(current.value - 1)

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  if (len.value > 1) {
    timer = setInterval(next, 6000)
  }
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <section
    v-if="slides && len"
    class="relative overflow-hidden rounded-2xl bg-stone-900"
  >
    <div class="relative aspect-[16/10] sm:aspect-[16/7]">
      <div
        v-for="(slide, i) in slides"
        :key="i"
        :class="[
          'absolute inset-0 transition-opacity duration-700',
          i === current ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ]"
      >
        <img
          v-if="slide.imageUrl"
          :src="slide.imageUrl"
          :alt="slide.title"
          class="absolute inset-0 h-full w-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div class="container-page absolute inset-0 flex items-center">
          <div class="max-w-xl text-white">
            <h2 class="font-display text-3xl font-semibold leading-tight sm:text-5xl">
              {{ slide.title }}
            </h2>
            <p v-if="slide.subtitle" class="mt-3 max-w-md text-sm text-white/85 sm:text-base">
              {{ slide.subtitle }}
            </p>
            <NuxtLink
              v-if="slide.ctaLink"
              :to="slide.ctaLink"
              class="btn-primary mt-6 inline-flex"
            >
              {{ slide.ctaText || 'Shop Now' }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <template v-if="len > 1">
      <button
        @click="prev"
        class="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40 sm:block"
        aria-label="Previous slide"
      >
        <Icon name="lucide:chevron-left" class="h-5 w-5" />
      </button>
      <button
        @click="next"
        class="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 p-2 text-white backdrop-blur transition hover:bg-white/40 sm:block"
        aria-label="Next slide"
      >
        <Icon name="lucide:chevron-right" class="h-5 w-5" />
      </button>

      <div class="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        <button
          v-for="(_, i) in slides"
          :key="i"
          @click="go(i)"
          :class="[
            'h-2 rounded-full transition-all',
            i === current ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80',
          ]"
          :aria-label="`Go to slide ${i + 1}`"
        />
      </div>
    </template>
  </section>
</template>
