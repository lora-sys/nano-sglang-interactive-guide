<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ question: string; answer: string; task?: string }>()
const open = ref(false)
</script>
<template>
  <section class="exercise-card">
    <div class="exercise-card__eyebrow">CHECKPOINT</div>
    <h3>{{ question }}</h3>
    <button @click="open = !open">{{ open ? '收起答案' : '查看答案' }}</button>
    <p v-if="open" class="exercise-card__answer">{{ answer }}</p>
    <p v-if="task" class="exercise-card__task"><strong>动手：</strong>{{ task }}</p>
  </section>
</template>
