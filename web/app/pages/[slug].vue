<script setup lang="ts">
const api = usePayloadApi()
const route = useRoute()

const slug = computed(() => route.params.slug as string)
const { data: page, error } = await useAsyncData(
  () => `page:${slug.value}`,
  () => api.page(slug.value),
)

if (error.value || !page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useHead({
  title: () => page.value?.title,
  meta: [{ name: 'description', content: () => page.value?.title ?? '' }],
})
</script>

<template>
  <div v-if="page" class="container-page py-10 sm:py-16">
    <article class="mx-auto max-w-3xl">
      <nav class="mb-6 text-xs text-stone-500">
        <NuxtLink to="/" class="hover:text-stone-900">Home</NuxtLink>
        <span class="mx-1">/</span>
        <span>{{ page.title }}</span>
      </nav>
      <h1 class="font-display text-3xl font-semibold sm:text-4xl">{{ page.title }}</h1>
      <div class="mt-6">
        <RichTextRenderer :content="page.content" />
      </div>
    </article>
  </div>
</template>
