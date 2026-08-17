<template>
  <Layout>
    <template #nav-bar-content-before></template>
    <template #nav-screen-content-before></template>
  </Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import { onMounted } from 'vue'

const { Layout } = DefaultTheme

onMounted(() => {
  const style = document.createElement('style')
  style.textContent = ':root{--vp-c-indigo-1:#8b6914;--vp-c-indigo-2:#c7840c;--vp-c-indigo-3:#d9a500;--vp-c-indigo-soft:rgba(199,132,12,.12);--vp-c-brand-1:#8b6914;--vp-c-brand-2:#c7840c;--vp-c-brand-3:#d9a500;--vp-c-brand-soft:rgba(199,132,12,.12);--vp-c-bg:#faf7f0;--vp-c-bg-alt:#f5efe0;--vp-c-bg-elv:#ffffff;--vp-c-bg-soft:#f0eada;--vp-c-divider:#e5dece;--vp-c-border:#e5dece;--vp-c-text-1:#1f1d17;--vp-c-text-2:#5c5744;--vp-c-text-3:#9e9784;--vp-c-tip-1:#8b6914;--vp-c-tip-2:#c7840c;--vp-c-tip-3:#faf7f0;--vp-c-tip-soft:rgba(199,132,12,.12);--vp-c-warning-1:#92400e;--vp-c-warning-2:#b45309;--vp-c-warning-3:#fef3c7;--vp-c-warning-soft:rgba(180,83,9,.1);--vp-c-default-1:#5c5744;--vp-c-default-2:#9e9784;--vp-c-home-hero-name-color:#8b6914;--vp-c-neutral:#1f1d17;--vp-c-neutral-inverse:#faf7f0}'
  document.head.appendChild(style)
})
</script>
