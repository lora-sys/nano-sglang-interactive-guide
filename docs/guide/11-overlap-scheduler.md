# 11 · Overlap Scheduler：GPU 在算的时候，CPU 别发呆

<ConceptMap src="11-concept.svg" alt="Chapter 11 concept map" />

Serving 的隐形成本经常不在 kernel 本身，而在 kernel 之间的空洞：CPU 准备下一 batch、采样结果处理、IPC、metadata 构建，都可能让 GPU 等待。

SGLang 强调低开销 CPU scheduler，其中一个核心工程方向就是让**下一步 CPU scheduling 与当前步 GPU execution 重叠**。

## 先看动画：Overlap 隐藏空洞，但慢侧仍决定稳态节拍

<video controls playsinline preload="metadata" style="width:100%;border:1px solid #26304A;border-radius:12px;background:#080B14">
  <source src="/animations/overlap-scheduler-steady-cadence.mp4" type="video/mp4">
  <track kind="subtitles" src="/animations/overlap-scheduler-steady-cadence.zh-CN.srt" srclang="zh-CN" label="中文" default>
  你的浏览器不支持 HTML5 视频播放。
</video>

> 动画中的 CPU/GPU 时间线和公式是**概念化代码锚点，不等同于逐行源码或真实 kernel timeline**。它强调的结论是：第一步保留启动成本，后续由 `max(CPU prepare, GPU forward)` 决定理想稳态节拍。

<HtmlLab src="/labs/11-overlap-scheduler.html" title="Lab 11 · CPU/GPU Overlap Timeline" :height="580" />

## 串行时间线 vs 重叠时间线

串行：

`CPU prepare → GPU forward → CPU prepare → GPU forward`

重叠：

`GPU forward(step n)` 的同时，CPU 尽量准备 `step n+1`。

这会引入更复杂的依赖管理：哪些结果必须等 GPU 完成？哪些 metadata 可以提前算？共享 buffer 什么时候可读/可写？因此真正的 overlap scheduler 常常比概念图复杂很多。


## Overlap 的核心是“稳态节拍”，不是把 CPU 时间删除

对于理想两级流水线，第一步仍要付启动成本，后续 steady state 才接近 `max(CPU prepare, GPU forward)` 的节拍。因此当 CPU=4ms、GPU=8ms 时，CPU 工作有机会隐藏在 GPU 下面；当 CPU=10ms、GPU=4ms 时，CPU 反而成为瓶颈。

新版 Lab 11 明确用这个公式，不再假设 CPU 永远能被完全遮住。真实系统还会有同步点、buffer dependency、IPC、sampling 与 kernel launch，所以这个结果只能叫 ideal overlap model。

### 3 分钟 A/B

Save A：CPU 4 / GPU 8。Run B：CPU 10 / GPU 4。看 `bottleneck` 从 GPU 翻到 CPU，同时比较 `serial_total_ms` 与 `overlap_total_ms`。你要解释的是**为什么收益缩小/改变**，不是背一个固定百分比。

<SourceMap :files="[
'python/sglang/srt/managers/scheduler.py',
'python/sglang/srt/managers/tp_worker.py',
'python/sglang/srt/model_executor/model_runner.py'
]" />

<ExerciseCard question="Overlap 的收益来自哪里？" answer="不是减少 GPU kernel 自身计算，而是隐藏 CPU scheduling / preparation 的一部分时间，减少 GPU step 之间的 idle gap。" task="把 CPU prepare time 从 1ms 拉到 6ms，对比 serial 与 overlap 的 timeline。" />
