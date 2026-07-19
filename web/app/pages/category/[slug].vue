<script setup lang="ts">
const api = usePayloadApi()
const route = useRoute()

const { data: category } = await useAsyncData(
  () => `category:${route.params.slug}`,
  () => api.findBySlug('categories', route.params.slug as string),
)

if (!category.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found', fatal: true })
}

const { data: products } = await useAsyncData(
  () => `category:${route.params.slug}:products`,
  () =>
    api.products({
      where: { 'category.slug': { equals: route.params.slug as string } },
      limit: 48,
      sort: '-createdAt',
    }),
)

useHead({
  title: () => category.value?.name,
})
useSeoMeta({
  description: () => category.value?.description ?? '',
  ogTitle: () => `${category.value?.name} — Greenleaf`,
  ogDescription: () => category.value?.description ?? '',
  ogType: 'website',
})

useSchemaOrg([
  defineWebPage({
    name: () => `${category.value?.name} — Greenleaf`,
  }),
  defineBreadcrumb({
    itemListElement: [
      { name: 'Home', item: '/' },
      { name: 'Shop', item: '/shop' },
      { name: () => category.value?.name ?? '' },
    ],
  }),
])
</script>

<template>
  <div v-if="category" class="container-page py-8 sm:py-12">
    <nav class="text-xs text-stone-500">
      <NuxtLink to="/" class="hover:text-stone-900">Home</NuxtLink>
      <span class="mx-1">/</span>
      <NuxtLink to="/shop" class="hover:text-stone-900">Shop</NuxtLink>
      <span class="mx-1">/</span>
      <span>{{ category.name }}</span>
    </nav>

    <header class="mt-2 mb-8">
      <h1 class="font-display text-3xl font-semibold sm:text-4xl">{{ category.name }}</h1>
      <p v-if="category.description" class="mt-2 max-w-2xl text-stone-600">{{ category.description }}</p>
      <p class="mt-1 text-sm text-stone-500">{{ products?.totalDocs ?? 0 }} plants</p>
    </header>

    <div v-if="products?.docs.length" class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <ProductCard v-for="p in products.docs" :key="p.id" :product="p" />
    </div>
    <div v-else class="rounded-2xl border border-dashed border-stone-300 py-16 text-center text-stone-500">
      <Icon name="lucide:sprout" class="mx-auto h-8 w-8" />
      <p class="mt-2">No plants in this category yet.</p>
    </div>
  </div>
</template>
