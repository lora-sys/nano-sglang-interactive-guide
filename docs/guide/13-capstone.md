# 13 · Capstone：别只说“RadixAttention 更快”，把证据做出来

<ConceptMap src="13-concept.svg" alt="Chapter 13 concept map" />

最后一章不再引入新名词。你要像推理系统工程师一样，把一个机制变成**可验证实验**。

目标：验证“共享 prefix workload 下，prefix cache 能减少重复 prefill 工作”。

<HtmlLab src="/labs/13-capstone.html" title="Lab 13 · Prefix Reuse Benchmark Designer" :height="860" />

## 先写实验，不要先写结论

至少固定这些变量：

- SGLang version / commit
- model
- GPU / driver / CUDA
- request count / concurrency
- prefix length / unique suffix length
- output length
- warmup
- cache on/off

然后记录：

- TTFT
- ITL / TPOT（如果适用）
- throughput
- cache hit / matched prefix tokens
- GPU memory

## 浏览器实验为什么不用“假毫秒数”

本教程的 Capstone 只计算**理论重复工作量与事件数**，不会给一个看似真实的 A100/H100 延迟数字。真实性能必须在真实硬件上测，并把环境一起写下来。

真实 SGLang 提供 benchmark/profiling 相关工具；你可以把本章实验设计直接迁移到真实 server，再记录结果。


## Evidence Gate：哪些结论现在能说，哪些必须等真实 GPU

浏览器模型能够严格算出的，是给定 workload 下**有多少重复 prefix token work 理论上不必重复 prefill**。它不能知道你的 H100 kernel efficiency、batch composition、网络、CUDA Graph、CPU overhead，所以也就不能直接推出 TTFT 或 throughput 提升百分比。

这条边界是本教程最后一项训练：看到一个漂亮数字，先问它属于 **work model、trace observation，还是真实 performance measurement**。三者都可以有价值，但不能互相冒充。SGLang 官方 serving benchmark 支持输出结果数据，profiling 文档也提供进一步分析路径，真实实验应该把这些原始证据和环境一起保存。

### 最小毕业实验

1. 设计 A：无共享 prefix 或关闭 reuse 的 workload。
2. 设计 B：保持 request count / suffix / output length 相同，只引入共享 prefix。
3. 先用本章模型预测理论 work reduction。
4. 再上真实 server 记录 raw benchmark output。
5. 如果实测提升与理论 work reduction 差很多，不要“修数字”，而是解释差距来自哪里。

<SourceMap :files="[
'python/sglang/benchmark/serving.py',
'python/sglang/srt/managers/scheduler.py',
'python/sglang/srt/mem_cache/radix_cache.py'
]" />

## 毕业标准

学完后你应该能回答：

1. 一个 request 在 SGLang 里经历哪些对象转换？
2. Scheduler 为什么必须同时理解 token budget 与 KV memory？
3. Radix cache 为什么不仅是“一个 dict”？
4. Prefill / Decode 为什么会推动不同的调度与部署策略？
5. Structured output 与 speculative decoding 分别插在 token loop 的哪里？
6. 看到一个“XX 更快”的 benchmark，你会追问哪些 workload 条件？

<ExerciseCard question="什么才算完成这套教程？" answer="不是把 13 章看完，而是能沿一条 request trace 跳到真实源码，解释每个状态转换，并设计一个可复现实验验证你的判断。" task="把 Capstone 的实验配置导出，去真实 SGLang server 上复现一次，并在 README/博客里记录环境、结果和失败。" />
