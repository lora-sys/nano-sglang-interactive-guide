import { defineConfig } from 'vitepress'

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1]
const owner = process.env.GITHUB_REPOSITORY?.split('/')[0]
const isUserSite = repo && owner && repo.toLowerCase() === `${owner.toLowerCase()}.github.io`
const base = process.env.GITHUB_ACTIONS === 'true' && repo && !isUserSite ? `/${repo}/` : '/'

export default defineConfig({
  lang: 'zh-CN',
  title: 'nano-SGLang',
  description: '从一次请求出发，交互式读懂 SGLang Runtime',
  base,
  cleanUrls: true,
  lastUpdated: true,
  head: [
    ['meta', { name: 'theme-color', content: '#0a0a0a' }],
    ['meta', { name: 'color-scheme', content: 'dark light' }]
  ],
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
