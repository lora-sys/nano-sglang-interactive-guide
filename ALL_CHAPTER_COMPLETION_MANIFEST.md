# nano-SGLang 全章节学习链路完成清单

## 已完成并发布

| 章节 | 中文 Manim 原理动画 | 预测 → 运行 → 解释实验 | 章节视频嵌入与概念化锚点 |
|---|---:|---:|---:|
| 05 · RadixAttention | 已完成 | 已完成 | 已完成 |
| 06 · KV Cache | 已完成 | 待重构 | 已完成 |
| 07 · Chunked Prefill | 已完成 | 已完成 | 已完成 |
| 08 · Structured Outputs | 已完成 | 已完成 | 已完成 |
| 10 · Speculative Decoding | 已完成 | 已完成 | 已完成 |
| 11 · Overlap Scheduler | 已完成 | 已完成 | 已完成 |

## 剩余核心交付

| 批次 | 章节 | 原理动画的核心判断 | 互动闭环的可验证预测 |
|---|---|---|---|
| B1 | 03 · Request → Batch | Request、ScheduleBatch、ForwardBatch 的状态归属与设备就绪边界 | 哪个对象首次携带 GPU-ready 执行元数据 |
| B1 | 04 · Scheduler | 连续批处理中的完成、回收和接纳循环 | 指定 capacity 下首个重新接纳时刻 |
| B1 | 06 · KV Cache | 保留现有分页分配动画，补齐任务化实验 | `ceil(length / block_size)` 与 unused slots |
| B1 | 09 · Sampling | temperature、top-k、top-p 如何依次塑造可采样分布 | 指定过滤器下保留候选数量及 token 是否仍可采样 |
| C1 | 01 · First Request | 单一请求穿过 tokenization、调度、forward 与 stream 的最小完整链路 | 哪个阶段首次产生 KV、哪个阶段持续流式输出 |
| C1 | 02 · Runtime Architecture | 控制面与执行面之间的 request state / batch metadata 交接 | 给定组件，判断其职责与状态位置 |
| C1 | 12 · Scale Out | 证据如何指向 TP、DP、EP、PD 或 HiCache 的拓扑假设 | 给定 bottleneck，判断应验证的拆分边界 |
| C1 | 13 · Capstone | 理论重复 Prefill 工作量与真实性能证据的边界 | 计算 work reduction，并识别不能直接推出的性能结论 |
| C2 | 00 · Lab Map / Trace Studio | 导航入口与 Trace Contract 的读法 | 从 trace 区分可观测事件、概念模型和源码锚点 |

> 所有动画均采用统一深色视觉系统、1080p60、普通话旁白、内嵌中文 `mov_text` 字幕和独立 SRT；所有互动实验继续调用共享 `NanoSGLangRuntime`，禁止 `eval()` 与 `innerHTML`。所有代码镜头与实验结果均需明确标注为概念化阅读路径，不等同于逐行上游源码或真实硬件性能。
