<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{ src: string; alt: string }>()
const url = computed(() => withBase(`/illustrations/${props.src}`))
</script>

<template>
  <img class="concept-map" :src="url" :alt="alt" loading="lazy" />
</template>
