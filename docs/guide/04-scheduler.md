# 04 · Scheduler：连续批处理不是“凑够一批再跑”

<ConceptMap src="04-concept.svg" alt="Chapter 04 concept map" />

传统静态 batching 的直觉是：收齐一组请求 → 一起跑完 → 下一组。LLM serving 不适合这么做，因为不同请求输出长度不同。一个请求结束后，如果它的 slot 一直空着等其它请求，就浪费 GPU。

**Continuous Batching** 的核心是：每个 decoding step 都有机会重新决定本轮 batch。

## 先看动画：短请求完成后，slot 为什么能立刻复用

<video controls playsinline preload="metadata" style="width:100%;border:1px solid #26304A;border-radius:12px;background:#080B14">
  <source src="/animations/continuous-batching-reclaim-admit.mp4" type="video/mp4">
  <track kind="subtitles" src="/animations/continuous-batching-reclaim-admit.zh-CN.srt" srclang="zh-CN" label="中文" default>
  你的浏览器不支持 HTML5 视频播放。
</video>

> 动画中的 request、slot、waiting queue 和 capacity 是**概念化代码锚点，不等同于逐行源码、生产调度策略或真实吞吐基准**。它强调的最小循环是：`finish → reclaim slot → admit waiting request → next decode step`。

<HtmlLab src="/labs/04-scheduler.html" title="Lab 04 · Continuous Batching" :height="760" />

## Scheduler 真正在平衡什么？

不是简单“越多越好”，而是至少同时考虑：

- memory / KV capacity
- token budget
- prefill 与 decode 的竞争
- prefix cache 命中
- request priority / policy
- 已运行请求不能被无节制打断

所以 scheduler 是推理引擎里最像“操作系统调度器”的部分。

SGLang 还会利用 prefix 信息做 cache-aware scheduling；真实 `schedule_policy.py` 里存在与 prefix caching、FCFS/LPM 等策略相关的逻辑。


## 把 Scheduler 想成“每一步都重新回答三个问题”

每个 schedule point 都可以压成三个问题：**谁完成了？谁还能继续？谁现在可以进来？** Continuous batching 的价值就藏在第三问：slot 一旦释放，不必等整批结束才复用。

真实系统当然还要叠加 KV budget、prefill/decode 竞争、优先级和 cache-aware policy，但先把这个最小循环吃透，复杂策略才有落脚点。Lab 04 的 event 中保存了 waiting/running snapshot，所以你可以逐 step 看调度决策，而不是只看最终 throughput。

### 3 分钟反事实

把 capacity 从 4 改成 2，再用相同 request lengths 重放。观察 waiting queue 变长，但“短请求完成 → slot 回收 → 新请求补入”这个机制没有改变。**机制不变、拥塞程度改变**，这就是很重要的系统直觉。

<SourceMap :files="[
'python/sglang/srt/managers/scheduler.py',
'python/sglang/srt/managers/schedule_policy.py',
'python/sglang/srt/managers/schedule_batch.py'
]" />

<ExerciseCard question="为什么 decode 过程中还要继续调度？" answer="因为 batch 是动态的：请求会完成，新请求会到达，prefill 会插入，KV 预算会变化。每 step 重组可以减少空槽并提高 GPU 利用率。" task="连续点 Step：观察短请求结束后 slot 何时被回收、waiting request 何时补进来；再解释如果是 static batch，这个空槽为什么会一直浪费到整批结束。" />
