<script setup lang="ts">
// Minimal Lexical → HTML renderer.
// Handles the common nodes our CMS uses; unknown nodes fall back to plain text.

type LexNode = {
  type?: string
  text?: string
  tag?: string
  listType?: string
  children?: LexNode[]
}

const props = defineProps<{ content?: unknown }>()

const walk = (node: unknown): string => {
  if (node == null) return ''
  if (typeof node === 'string') return node
  if (typeof node !== 'object') return String(node)
  const n = node as LexNode

  switch (n.type) {
    case 'root':
      return (n.children ?? []).map(walk).join('')
    case 'paragraph':
      return `<p>${(n.children ?? []).map(walk).join('')}</p>`
    case 'heading': {
      const tag = (n.tag ?? 'p').replace('h', '')
      const level = Math.min(Math.max(Number(tag) || 2, 1), 6)
      return `<h${level}>${(n.children ?? []).map(walk).join('')}</h${level}>`
    }
    case 'text':
      return escape(n.text ?? '').replace(/\n/g, '<br />')
    case 'linebreak':
      return '<br />'
    case 'list': {
      const tag = n.listType === 'number' ? 'ol' : 'ul'
      return `<${tag}>${(n.children ?? []).map(walk).join('')}</${tag}>`
    }
    case 'listitem':
      return `<li>${(n.children ?? []).map(walk).join('')}</li>`
    case 'link':
      return `<a href="#">${(n.children ?? []).map(walk).join('')}</a>`
    case 'quote':
      return `<blockquote>${(n.children ?? []).map(walk).join('')}</blockquote>`
    default:
      if (n.children) return n.children.map(walk).join('')
      return ''
  }
}

const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const html = computed(() => {
  const c = props.content
  if (!c) return ''
  if (typeof c === 'string') {
    // PB editor field stores HTML strings directly. Output as-is.
    // (Page content, product descriptions, etc. — already valid HTML.)
    return c
  }
  // Payload Lexical format: { root: { type: 'root', children: [...] } }
  // Unwrap and walk the tree.
  const root = (c as { root?: LexNode }).root ?? (c as LexNode)
  return walk(root)
})
</script>

<template>
  <div class="rich-text prose prose-stone max-w-none prose-headings:font-display prose-headings:font-semibold prose-headings:tracking-tight prose-a:text-brand-700 prose-a:underline" v-html="html" />
</template>
