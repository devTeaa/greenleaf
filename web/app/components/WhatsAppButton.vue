<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    message?: string
    label?: string
    variant?: 'full' | 'icon'
    block?: boolean
  }>(),
  {
    label: 'Order on WhatsApp',
    variant: 'full',
    block: false,
  },
)

const { waLink } = useSite()
const href = computed(() => waLink(props.message))
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    :class="['btn-whatsapp', { 'w-full': block }]"
    :title="label"
  >
    <Icon name="lucide:message-circle" class="h-4 w-4" />
    <span v-if="variant === 'full'">{{ label }}</span>
  </a>
</template>
