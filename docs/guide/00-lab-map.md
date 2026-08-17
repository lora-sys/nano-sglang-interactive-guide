# 实验地图：先点，再读

> 想先看整套系统怎么联动？直接打开 [Trace Studio](/guide/00-trace-studio)：所有核心实验已经共享同一个 Nano Runtime 与 Trace Contract。

这套教程的顺序不是“概念 → 源码 → 终于看懂”，而是 **实验 → 直觉 → 数据流 → 源码**。每个实验都故意只暴露一个核心变量，让你能看到“改了什么，系统为什么变”。

| 章 | 实验 | 你会亲眼看到什么 |
|---|---|---|
| 01 | First Request Trace | 一条请求从文本走到 token streaming |
| 02 | Runtime Router | Tokenizer / Scheduler / ModelRunner / Detokenizer 的边界 |
| 03 | Batch Morph | Req 如何变成 ScheduleBatch，再变成 GPU 侧 ForwardBatch |
| 04 | Continuous Batching | waiting/running queue 如何每 step 重新组 batch |
| 05 | Radix Tree | 两条共享前缀的请求如何复用 KV |
| 06 | KV Blocks | token 如何映射到 paged KV block |
| 07 | Prefill vs Decode | 两阶段的计算形态与 chunked prefill |
| 08 | Grammar Mask | JSON grammar 如何限制下一 token 集合 |
| 09 | Sampler | temperature / top-k / top-p 如何改变分布 |
| 10 | Spec Decode | draft token 批量提出、target 一次验证 |
| 11 | Overlap | CPU scheduling 与 GPU execution 如何重叠 |
| 12 | Scale Out | TP / DP / EP / PD 的通信边界 |
| 13 | Capstone Bench | prefix reuse 对“重复 prefill 工作量”的影响 |

## 三个学习按钮

每章都问自己三件事：

1. **State**：此刻系统里有哪些状态？
2. **Transition**：哪个事件让状态发生变化？
3. **Evidence**：我要去真实源码的哪个对象/函数确认？

这比记住“RadixAttention 很快”“SGLang scheduler 很强”更重要。
