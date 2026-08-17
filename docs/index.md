---
layout: home

hero:
  name: nano-SGLang
  text: 一次请求，读懂 SGLang Runtime
  tagline: 不先啃 5000 行 scheduler.py。先点 Run，看请求真的“动起来”。
  actions:
    - theme: brand
      text: 从第一条请求开始
      link: /guide/01-first-request
    - theme: alt
      text: 打开 Trace Studio
      link: /guide/00-trace-studio

features:
  - title: Run → Trace → Diff → Source
    details: 13 个实验共享同一个 Nano Runtime 与 Trace Contract；先运行、再对比因果变化，最后映射回真实源码。
  - title: 13 章 × 13 实验
    details: Scheduler、RadixAttention、KV Cache、Structured Output、Spec Decode、PD Disaggregation，一章一个可操作实验。
  - title: 纯浏览器学习
    details: 学习实验不需要 GPU；真实 SGLang 运行命令单独给出，避免把概念模拟冒充真实执行。
---

## 这套教程怎么学

<div class="nano-grid">
  <div class="nano-card"><strong>1. 先跑</strong>每章先做 2–5 分钟实验，先建立直觉。</div>
  <div class="nano-card"><strong>2. 再拆</strong>沿一次请求的数据流理解关键对象和状态变化。</div>
  <div class="nano-card"><strong>3. 最后读源码</strong>只跳到与当前机制直接相关的真实 SGLang 文件。</div>
</div>

> 教程源码阅读主线固定在 **SGLang v0.5.17（2026-08-08 发布）**。SGLang 变化很快，因此 Source Map 一律链接到这个 tag，而不是漂移的 `main`。
>
> v0.5.17 已加入初步的 **Rust frontend**。本教程的主线仍聚焦 Python SRT runtime（TokenizerManager / Scheduler / ModelRunner / DetokenizerManager）；遇到 frontend 差异时会明确标注。
