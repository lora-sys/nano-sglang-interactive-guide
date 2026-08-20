# 03 · Request → ScheduleBatch → ForwardBatch

<ConceptMap src="03-concept.svg" alt="Chapter 03 concept map" />

这一章是理解 SGLang 源码最划算的一章。

真实源码自己写得非常清楚：`ScheduleBatch` 由 `Scheduler` 管理，主要是 CPU 上的高层调度信息；随后它被转换成 `ForwardBatch`，后者由 `ModelRunner` 消费，主要携带 GPU tensor 侧需要的数据。

## 先看动画：Req 如何跨过控制面到执行面边界

<video controls playsinline preload="metadata" style="width:100%;border:1px solid #26304A;border-radius:12px;background:#080B14">
  <source src="/animations/request-to-batch-dataflow.mp4" type="video/mp4">
  <track kind="subtitles" src="/animations/request-to-batch-dataflow.zh-CN.srt" srclang="zh-CN" label="中文" default>
  你的浏览器不支持 HTML5 视频播放。
</video>

> 动画中的 Req、ScheduleBatch、ForwardBatch 字段均是**概念化代码锚点，不等同于逐行源码或完整生产 batch layout**。它强调的是对象归属边界：`request control state → scheduler batch decision → device-ready forward metadata`。

<HtmlLab src="/labs/03-request-to-batch.html" title="Lab 03 · Batch Morph" :height="700" />

## 为什么不让 Scheduler 直接操作 GPU tensors？

因为 scheduler 关心的是：

- 谁在 waiting？
- 谁已经 running？
- 哪个 request prefix 命中了？
- 本轮 token budget 还剩多少？
- 哪些请求应该进入 extend/prefill，哪些是 decode？

ModelRunner 关心的是：

- input ids / positions / seq lens 怎么布局？
- KV pool 的地址是什么？
- attention backend 需要什么 metadata？
- 这一步能不能走 CUDA Graph？

两个世界分开后，控制逻辑不会被 tensor 细节淹没。


## 这三个对象不是“同一个东西换名字”

`Req` 仍然以单个请求为中心；`ScheduleBatch` 是 Scheduler 为一轮执行组织出的控制状态；`ForwardBatch` 则把这一轮需要的执行信息压成 ModelRunner 可以直接消费的形式。理解这个变化后，你会更容易看懂为什么很多 scheduling feature 先改 `ScheduleBatch`，而 kernel/attention feature 更关心 `ForwardBatch`。

这也是一个通用系统设计模式：**高层决策对象不要直接等于低层执行对象**。否则每加入一种调度策略，都会把 GPU hot path 的数据结构搅乱。

### 2 分钟反事实

拖动 stage 时只记录三件事：request 数量、state locality、是否已经 device-ready。再把 batch request 数从 1 拉到 8：`Req` 仍然只描述一个请求，而 batch-level state 才会随请求数扩张。

<SourceMap :files="[
'python/sglang/srt/managers/schedule_batch.py',
'python/sglang/srt/model_executor/forward_batch_info.py',
'python/sglang/srt/model_executor/model_runner.py'
]" />

<ExerciseCard question="ScheduleBatch → ForwardBatch 这次转换在系统设计上意味着什么？" answer="它是控制面到执行面的边界：高层 request/batch 状态被压成一次模型 forward 所需的低层 tensor metadata。" task="把实验里的请求数从 2 提到 5，观察哪些字段属于单 request，哪些字段必须在 batch 层重新组织。" />
