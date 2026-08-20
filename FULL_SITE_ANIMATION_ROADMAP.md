# nano-SGLang 全站动画与互动学习升级路线图

## 目标与现状

本仓库已经具有清晰的 **Run → Trace → Diff → Source** 学习框架，以及 13 个可运行的概念实验。升级不应替换这条已有优势，而应在同一份 `Trace Contract` 上叠加“**预测 → 运行 → 解释**”任务闭环和统一的中文原理动画。这样，学习者先对可观测结果作出承诺，再通过 Runtime 事件、状态镜头和源码锚点校正直觉。

基线检查已通过内容、概念运行时、独立实验和 VitePress 生产构建。当前公共目录尚无独立动画资产，因此首批工作会同时建立 `docs/public/animations/`、视频嵌入模式、中文旁白与字幕的统一交付路径。

> 所有实验继续明确标注为概念模拟；动画与代码锚点均须写明“概念化阅读路径，不等同于上游源码逐行执行”。任何性能叙述只讨论可验证的工作量、时间线或约束，不把概念 Runtime 伪装成真实 GPU 基准。

## 统一设计与验收约束

首批动画采用与 nano-vLLM 教程一致的深色系统：背景 `#080B14`、面板 `#101728`、紫色 `#7C5CFF`、青色 `#40E0D0`、黄色 `#FFD166` 与红色 `#FF6B8A`。每支视频以 ManimCE 制作，输出 1080p60，配中文旁白和独立 `zh-CN` SRT。每支视频遵守音频先行、逐场景低画质渲染、代表帧审查、音画时长核对与高画质定稿的流程。

每个重构实验统一包括固定任务、预测输入、分步运行按钮、可观测状态变化、核对反馈、机制解释和概念化代码锚点。参数变化必须使旧预测和旧运行结果失效，避免学习者从上一次结果反推本次答案。

## 波次 A：SGLang 的高辨识度执行机制

这一波次优先覆盖最能区分 SGLang Runtime 的四个主题。它们已有可复用的共享运行时指标，因此可以先以少量运行时扩展完成任务化重构，再以同一状态语义制作动画。

| 章节 | 动画叙事主线 | 预测任务闭环 | 代码阅读锚点 |
|---|---|---|---|
| 05 · RadixAttention | token prefix 沿 radix tree 匹配，命中 KV，`extend_tokens` 随 suffix 缩短 | 给定共享前缀与分叉位置，预测匹配 token 数和需要重新 Prefill 的 suffix | `radix_cache.py`、`base_prefix_cache.py`、`schedule_policy.py` |
| 07 · Chunked Prefill | 长 prompt 被切为多个 prefill chunk，Decode peer 在 scheduler turn 间得到机会 | 给定 2048 token 与 chunk size，预测 chunk 数、最大块和可插入 Decode turn | scheduler 的 prefill/Decode 选择与 batch 预算 |
| 10 · Speculative Decoding | draft 提案、target 批量 verify、首个拒绝点截断连续接受前缀 | 固定 seed、draft tokens 和接受概率，预测连续 accepted prefix 而非独立命中数 | speculative 子系统、`spec_info.py`、`model_runner.py` |
| 11 · Overlap Scheduler | CPU 准备 step n+1 与 GPU 执行 step n 重叠，稳态由慢侧节拍决定 | 给定 CPU/GPU 时间和步数，预测瓶颈与 ideal overlap 总时长 | `scheduler.py`、`tp_worker.py`、`model_runner.py` |

波次 A 的实验页面会保留现有 Trace Player、A/B Diff 与 Source Lens，但将它们安排在预测提交和分步运行之后。由此既不丢失仓库已有的 trace 优势，也避免互动沦为“拖滑块就得到答案”的控件面板。

## 波次 B：核心数据流、内存与受约束生成

第二波次负责把请求从 CPU 控制状态变为设备执行元数据，并扩展到内存管理、约束采样和普通采样。它们适合在波次 A 的视觉组件和实验状态机已经稳定后统一升级。

| 章节 | 动画与实验的主要判断 | 预期闭环答案 |
|---|---|---|
| 03 · Request → ScheduleBatch → ForwardBatch | 哪一阶段拥有 CPU 请求状态，何时成为 GPU-ready metadata | 判断 `ForwardBatch` 才具备设备执行所需张量元数据 |
| 04 · Scheduler | 每步完成、回收、接纳请求如何改变 running slots | 预测指定容量下的首个重新接纳时刻 |
| 06 · KV Cache | sequence length 与 block size 如何决定页数和内部碎片 | 预测 `ceil(length/block_size)` 与 unused slots |
| 08 · Structured Outputs | grammar state 如何把 logits 变为 allowed/masked candidates | 预测下一状态允许的 token 集合 |
| 09 · Sampling | temperature、top-k、top-p 的顺序如何缩放并过滤分布 | 预测保留候选数或指定 token 是否仍可被采样 |

## 波次 C：学习入口、拓扑与综合证据

第三波次提升整站叙事入口和工程决策能力。01、02 与 Trace Studio 将从“先浏览工具”改造成首个可解释的完整请求；12 会把 TP、DP、EP、PD disaggregation 与 HiCache 做成“证据 → 拓扑假设”的决策树；13 则将 Capstone 升级为可复现实验设计、可声明证据范围和不可声明结论的综合任务。

| 章节 | 升级重点 |
|---|---|
| 00 / 01 / 02 | 用单一请求贯穿 TokenizerManager、Scheduler、ModelRunner 和 DetokenizerManager，并建立 Trace Contract 阅读能力 |
| 12 · Scale Out | 通过瓶颈证据区分 TP、DP、EP、PD 与 HiCache，而非把并行术语堆成参数表 |
| 13 · Capstone | 通过 prefix-reuse 工作量模型、实验变量和 Evidence Gate 形成可审计结论 |

## 执行顺序与质量门

首批实施从 05、07、10、11 开始。每个章节按“先更新实验状态机与代码锚点，再制作音频先行的 Manim 动画，再嵌入章节”的顺序完成。每完成一章，都运行独立实验语法检查；每完成一波，运行 `npm run check`、在浏览器验证正确预测与至少一个反事实分支，并更新 `INTEGRATION_NOTES.md`。

提交前必须确认所有媒体为本地资源、无外链依赖、SRT 与视频路径有效、浏览器实验未使用 `eval` 或 `innerHTML`，并且 Git 工作区仅包含教学交付物。推送后还需核验 GitHub Actions 的 Pages 部署工作流成功。
