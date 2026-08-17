import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import HtmlLab from './components/HtmlLab.vue'
import ExerciseCard from './components/ExerciseCard.vue'
import SourceMap from './components/SourceMap.vue'
import ConceptMap from './components/ConceptMap.vue'
import Layout from './Layout.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('HtmlLab', HtmlLab)
    app.component('ExerciseCard', ExerciseCard)
    app.component('SourceMap', SourceMap)
    app.component('ConceptMap', ConceptMap)
  }
} satisfies Theme
