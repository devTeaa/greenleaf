<script setup lang="ts">
const api = usePayloadApi()
const { settings } = useSite()

const { data: products } = await useAsyncData('home:products', () =>
  api.products({ limit: 100, sort: '-createdAt' }),
)
const { data: categories } = await useAsyncData('home:categories', () =>
  api.categories({ limit: 12 }),
)

const bestSellers = computed(
  () => products.value?.docs.filter((p) => p.tags?.includes('best-seller')).slice(0, 4) ?? [],
)
const newArrivals = computed(
  () => products.value?.docs.filter((p) => p.tags?.includes('new-arrival')).slice(0, 4) ?? [],
)
const featured = computed(
  () => products.value?.docs.filter((p) => p.tags?.includes('featured')).slice(0, 4) ?? [],
)

useHead({ title: () => settings.value?.tagline ?? 'Home' })
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="container-page py-6 sm:py-8">
      <HeroCarousel :slides="settings?.heroSlides" />
    </section>

    <!-- Categories -->
    <section v-if="categories?.docs.length" class="container-page py-10">
      <div class="mb-6 flex items-end justify-between">
        <div>
          <h2 class="font-display text-2xl font-semibold sm:text-3xl">Shop by category</h2>
          <p class="mt-1 text-sm text-stone-500">Find exactly what you're looking for.</p>
        </div>
        <NuxtLink to="/shop" class="hidden text-sm font-medium text-brand-700 hover:text-brand-800 sm:inline-flex sm:items-center sm:gap-1">
          View all
          <Icon name="lucide:arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <CategoryCard
          v-for="cat in categories.docs"
          :key="cat.id"
          :category="cat"
        />
      </div>
    </section>

    <!-- Best Sellers -->
    <section v-if="bestSellers.length" class="container-page py-10">
      <SectionHeading
        title="Best Sellers"
        subtitle="Our most-loved variegated plants."
        to="/shop?tag=best-seller"
      />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in bestSellers" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- New Arrivals -->
    <section v-if="newArrivals.length" class="container-page py-10">
      <SectionHeading
        title="New Arrivals"
        subtitle="Fresh from the nursery this week."
        to="/shop?tag=new-arrival"
      />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in newArrivals" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- WhatsApp CTA -->
    <section class="container-page py-10">
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 px-6 py-12 text-white sm:px-12 sm:py-16">
        <div class="relative max-w-2xl">
          <h2 class="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Can't find what you're looking for?
          </h2>
          <p class="mt-3 text-brand-100">
            Message us on WhatsApp with your wishlist. We have many rare plants not yet listed on the site.
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <WhatsAppButton label="Chat with us" class="!bg-white !text-brand-800 hover:!bg-brand-50" />
            <NuxtLink to="/shop" class="btn !border !border-white/40 !text-white hover:!bg-white/10">
              Browse catalog
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured -->
    <section v-if="featured.length" class="container-page py-10">
      <SectionHeading
        title="Featured"
        subtitle="Hand-picked rarities for serious collectors."
        to="/shop?tag=featured"
      />
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <ProductCard v-for="p in featured" :key="p.id" :product="p" />
      </div>
    </section>
  </div>
</template>
