// Loads wishlist from localStorage before app mounts so the indicator
// and drawer show correct counts on first client render.
export default defineNuxtPlugin(() => {
  const wishlist = useWishlist()
  wishlist.loadFromStorage()

  // Close drawer on ESC + lock body scroll while open.
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && wishlist.isOpen.value) wishlist.close()
    })

    watch(
      () => wishlist.isOpen.value,
      (open) => {
        document.body.style.overflow = open ? 'hidden' : ''
      },
    )
  }
})
