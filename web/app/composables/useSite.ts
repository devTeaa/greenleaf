// Site-level composable: settings + WhatsApp link builder + nav data.
// Caches settings via useAsyncData so all components share one fetch.

export const useSite = () => {
  const api = usePayloadApi()

  const { data: settings } = useAsyncData('site:settings', () => api.settings(), { default: () => null })

  const navPages = computed(() =>
    (settings.value?.pages as unknown as Array<{ title: string; slug: string }> | undefined) ?? [],
  )

  const waLink = (message?: string) => {
    const s = settings.value as {
      whatsappNumber?: string | null
      whatsappDefaultMessage?: string | null
    } | null
    // Support both Payload's nested group and Pocketbase's flat fields
    const number = s?.whatsappNumber ?? s?.whatsapp?.number
    if (!number) return '#'
    const msg = message?.trim() || s?.whatsappDefaultMessage || s?.whatsapp?.defaultMessage || 'Hi!'
    return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`
  }

  const formatPrice = (value?: number | null) => {
    if (value == null) return ''
    const currency = settings.value?.currency ?? 'USD'
    const symbol = currency === 'THB' ? '฿' : currency === 'EUR' ? '€' : '$'
    return `${symbol}${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
  }

  return { settings, navPages, waLink, formatPrice }
}
