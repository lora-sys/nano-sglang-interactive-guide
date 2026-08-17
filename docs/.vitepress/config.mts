import { defineConfig } from 'vitepress'

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const owner = process.env.GITHUB_REPOSITORY?.split('/')[0]
const isUserSite = repo && owner && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`
const base = process.env.GITHUB_ACTIONS === 'true' && repo && !isUserSite ? `/${repo}/` : '/'

const creamTheme = `
:root{--vp-c-indigo-1:#8b6914!important;--vp-c-indigo-2:#c7840c!important;--vp-c-indigo-3:#d9a500!important;--vp-c-indigo-soft:rgba(199,132,12,.12)!important;--vp-c-brand-1:#8b6914!important;--vp-c-brand-2:#c7840c!important;--vp-c-brand-3:#d9a500!important;--vp-c-brand-soft:rgba(199,132,12,.12)!important;--vp-c-bg:#faf7f0!important;--vp-c-bg-alt:#f5efe0!important;--vp-c-bg-elv:#ffffff!important;--vp-c-bg-soft:#f0eada!important;--vp-c-divider:#e5dece!important;--vp-c-border:#e5dece!important;--vp-c-text-1:#1f1d17!important;--vp-c-text-2:#5c5744!important;--vp-c-text-3:#9e9784!important;--vp-c-tip-1:#8b6914!important;--vp-c-tip-2:#c7840c!important;--vp-c-tip-3:#faf7f0!important;--vp-c-tip-soft:rgba(199,132,12,.12)!important;--vp-c-warning-1:#92400e!important;--vp-c-warning-2:#b45309!important;--vp-c-warning-3:#fef3c7!important;--vp-c-warning-soft:rgba(180,83,9,.1)!important;--vp-c-default-1:#5c5744!important;--vp-c-default-2:#9e9784!important;--vp-c-home-hero-name-color:#8b6914!important}`

export default defineConfig({
  lang: 'zh-CN',
  title: 'nano-SGLang',
  description: '从一次请求出发，交互式读懂 SGLang Runtime',
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#faf7f0' }],
    ['meta', { name: 'color-scheme', content: 'light' }]
  ],
  transformHtml(code) {
    return code.replace('</head>', `<style>${creamTheme}</style></head>`)
  },
  themeConfig: {
    logo: '/illustrations/logo.svg',
    nav: [
      { text: '开始学习', link: '/guide/01-first-request' },
      { text: 'Trace Studio', link: '/guide/00-trace-studio' },
      { text: '实验地图', link: '/guide/00-lab-map' },
      { text: '源码地图', link: '/guide/02-runtime-architecture' },
      { text: 'SGLang', link: 'https://github.com/sgl-project/sglang' }
    ],
    sidebar: [
      {
        text: '学习路线',
        items: [
          { text: 'Trace Studio', link: '/guide/00-trace-studio' },
          { text: '实验地图', link: '/guide/00-lab-map' },
          { text: '01 一次请求', link: '/guide/01-first-request' },
          { text: '02 Runtime 架构', link: '/guide/02-runtime-architecture' },
          { text: '03 Request → Batch', link: '/guide/03-request-to-batch' },
          { text: '04 Scheduler 与连续批处理', link: '/guide/04-scheduler' },
          { text: '05 RadixAttention', link: '/guide/05-radix-attention' },
          { text: '06 KV Cache 与 Paged Attention', link: '/guide/06-kv-cache' },
          { text: '07 Prefill / Decode / Chunked Prefill', link: '/guide/07-prefill-decode' },
          { text: '08 Structured Outputs', link: '/guide/08-structured-output' },
          { text: '09 Sampling Loop', link: '/guide/09-sampling' },
          { text: '10 Speculative Decoding', link: '/guide/10-speculative-decoding' },
          { text: '11 Overlap Scheduler', link: '/guide/11-overlap-scheduler' },
          { text: '12 Scale Out：TP / DP / EP / PD', link: '/guide/12-scale-out' },
          { text: '13 Capstone：做一次性能实验', link: '/guide/13-capstone' }
        ]
      }
    ],
    socialLinks: [
      { icon: 'github', link: 'https://github.com/sgl-project/sglang' }
    ],
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    footer: {
      message: 'Community tutorial · not affiliated with the SGLang project',
      copyright: 'MIT Licensed educational content'
    }
  }
})
