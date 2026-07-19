<script setup lang="ts">
// Single source of truth for site settings via useSite composable.
const { settings } = useSite()
const route = useRoute()

useHead({
  titleTemplate: (page) =>
    page ? `${page} · ${settings.value?.siteName ?? 'Greenleaf'}` : (settings.value?.siteName ?? 'Greenleaf'),
  meta: [{ name: 'description', content: () => settings.value?.description ?? '' }],
})

// Default OG / Twitter meta — pages override with useSeoMeta().
useSeoMeta({
  ogSiteName: () => settings.value?.siteName ?? 'Greenleaf',
  ogType: 'website',
  ogLocale: 'en_US',
  ogDescription: () => settings.value?.description ?? '',
  twitterCard: 'summary_large_image',
})

// Default Organization + WebSite schema (applied site-wide via nuxt-schema-org).
useSchemaOrg([
  defineWebSite({
    name: () => settings.value?.siteName ?? 'Greenleaf',
    description: () => settings.value?.description ?? '',
  }),
  defineOrganization({
    name: () => settings.value?.siteName ?? 'Greenleaf',
    logo: () => (typeof window !== 'undefined' ? `${window.location.origin}/icon.png` : '/icon.png'),
    sameAs: () => settings.value?.social?.map((s) => s.url) ?? [],
  }),
])
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
