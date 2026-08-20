# 07 · Prefill、Decode 与 Chunked Prefill

<ConceptMap src="07-concept.svg" alt="Chapter 07 concept map" />

LLM inference 看似都是 forward，但 prefill 和 decode 的计算形态完全不同。

## 先看动画：Chunked Prefill 如何增加重新调度边界

<video controls playsinline preload="metadata" style="width:100%;border:1px solid #26304A;border-radius:12px;background:#080B14">
  <source src="/animations/chunked-prefill-scheduler-boundaries.mp4" type="video/mp4">
  <track kind="subtitles" src="/animations/chunked-prefill-scheduler-boundaries.zh-CN.srt" srclang="zh-CN" label="中文" default>
  你的浏览器不支持 HTML5 视频播放。
</video>

> 动画中的 token 条、Decode turn 和 chunk 公式是**概念化代码锚点，不等同于逐行源码或真实性能基准**。它可视化的重点是：chunk size 改变 Scheduler 获得重新决策机会的频率，而不减少总 prompt token。

- **Prefill / Extend**：一次处理很多输入 token，矩阵更“厚”，通常更 compute-heavy。
- **Decode**：每个 request 一步通常只增加一个 token，但要读大量历史 KV，更偏 memory/latency-sensitive。

<HtmlLab src="/labs/07-prefill-decode.html" title="Lab 07 · Prefill vs Decode" :height="600" />

## 为什么需要 Chunked Prefill？

一个超长 prompt 如果一次性 prefill，可能长时间占据 GPU，让正在 decode 的请求 ITL（inter-token latency）抖得很厉害。Chunked Prefill 把大 prefill 切成更小 chunk，让 scheduler 有机会在中间插入其它工作。

这里的核心不是“切得越小越好”。chunk 太小会增加调度/launch overhead；太大又会破坏交互请求的 latency。它本质上是 throughput 与 tail latency 的折中旋钮。


## Chunked Prefill 改变的是“调度颗粒度”

把一个 2048-token prefill 切成 4 个 512-token chunk，并没有神奇地减少总 prompt token。它改变的是 Scheduler **多久获得一次重新决策的机会**。因此本章实验只显示 `prefill_chunks / largest_chunk / scheduler_turns`，故意不捏造毫秒延迟。

真正上 GPU 后，chunk size 会继续受到 kernel efficiency、launch overhead、batch composition、memory 与具体模型的影响。所以教程的目标不是告诉你“512 最优”，而是让你知道“改 chunk size 时，应该观测什么”。

### 3 分钟 A/B

Save A：`prompt=2048, chunk=1024`。Run B：只把 chunk 改成 256。你应该看到总 prompt work 不变，但 chunk 数与 scheduler turns 明显增加。接下来真实 benchmark 才需要回答：更多调度机会是否值得额外 overhead。

<SourceMap :files="[
'python/sglang/srt/managers/scheduler.py',
'python/sglang/srt/managers/schedule_batch.py',
'python/sglang/srt/model_executor/forward_batch_info.py'
]" />

<ExerciseCard question="Prefill 和 Decode 为什么不应该被当成同一种 workload？" answer="prefill 通常一次处理大量 query token，decode 通常每序列一步一个 token 且依赖大量历史 KV；两者算力、内存访问和 latency 目标都不同。" task="固定 prompt tokens，只改变 chunk size；记录 prefill_chunks、largest_chunk 与 scheduler_turns，并说明为什么仅凭这三个概念指标还不能宣布真实性能最优点。" />
