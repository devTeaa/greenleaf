import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/icon', '@nuxtjs/seo'],

  vite: {
    plugins: [tailwindcss()],
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://greenleaf.example',
    name: process.env.NUXT_PUBLIC_SITE_NAME || 'Greenleaf',
    description:
      'Curated rare variegated aroids — Monstera, Philodendron, Alocasia, Anthurium. Shipped worldwide from Thailand.',
    defaultLocale: 'en',
  },

  // SEO: dynamic sitemap source from Payload.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    // Auto-discovered static routes get default priority.
    defaults: { changefreq: 'weekly', priority: 0.7 },
  },

  robots: {
    // Allow all by default; sitemap URL auto-injected from site config.
    disallow: ['/admin', '/api'],
  },

  // OG image generation is heavy on a VPS (needs headless browser) — disabled.
  // Per-page OG tags are set manually via useHead in pages.
  ogImage: {
    enabled: false,
  },

  schemaOrg: {
    // Identity used as default for Organization schema on every page.
    identity: {
      type: 'Organization',
      name: 'Greenleaf',
    },
  },

  runtimeConfig: {
    // Server-only — used by SSR + Nitro routes (sitemap source).
    // Internal Docker network URL — the browser never sees this.
    payloadUrl: process.env.PAYLOAD_URL || 'http://localhost:3052',
    public: {
      // Browser — must be a publicly reachable URL the user's browser can hit
      // for client-side navigation. Set NUXT_PUBLIC_PAYLOAD_URL in production
      // to e.g. https://cms.greenleaf.example
      payloadUrl: process.env.NUXT_PUBLIC_PAYLOAD_URL || process.env.PAYLOAD_URL || 'http://localhost:3052',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#15803d' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap',
        },
      ],
    },
  },

  typescript: {
    typeCheck: false,
    strict: true,
  },
})
