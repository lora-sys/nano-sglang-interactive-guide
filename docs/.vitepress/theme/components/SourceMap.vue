<script setup lang="ts">
const props = withDefaults(defineProps<{ files: string[]; version?: string }>(), {
  version: 'v0.5.17'
})

function href(file: string) {
  const kind = file.endsWith('/') ? 'tree' : 'blob'
  return `https://github.com/sgl-project/sglang/${kind}/${props.version}/${file}`
}
</script>

<template>
  <section class="source-map">
    <div class="source-map__head">
      <div class="source-map__eyebrow">SOURCE MAP · PINNED SNAPSHOT</div>
      <span class="source-map__version">{{ version }}</span>
    </div>
    <a v-for="f in files" :key="f" :href="href(f)" target="_blank" rel="noreferrer">
      <code>{{ f }}</code><span aria-hidden="true">↗</span>
    </a>
  </section>
</template>
