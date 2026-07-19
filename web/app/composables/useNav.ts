// Navigation data: categories + pages grouped by nav/footer placement.
// Fetched once, cached via useAsyncData keys.

export const useNav = () => {
  const api = usePayloadApi()

  const { data: categories } = useAsyncData('nav:categories', () =>
    api.categories({ limit: 50, sort: 'order' }),
  )

  const { data: pages } = useAsyncData('nav:pages', () =>
    api.pages({ limit: 50, sort: 'order' }),
  )

  const navPages = computed(() => (pages.value?.docs ?? []).filter((p) => p.showInNav))
  const footerPages = computed(() => (pages.value?.docs ?? []).filter((p) => p.showInFooter))

  return { categories, navPages, footerPages }
}
