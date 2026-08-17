<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
const props = defineProps<{ src: string; title?: string; height?: number }>()
const url = computed(() => withBase(props.src))
</script>

<template>
  <section class="lab-shell">
    <div class="lab-shell__bar">
      <div>
        <span class="lab-shell__dot"></span>
        <strong>{{ title || 'Interactive Lab' }}</strong>
      </div>
      <span class="lab-shell__label">BROWSER · NO GPU</span>
    </div>
    <iframe :src="url" :title="title || 'Interactive Lab'" :style="{ height: `${height || 560}px` }" loading="lazy" />
    <p class="lab-shell__note">这是概念模拟器：用于理解机制，不执行真实 SGLang / CUDA kernel。</p>
  </section>
</template>
