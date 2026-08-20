# nano-SGLang · 波次 A 原理动画场景蓝图

## 制作决策

本波次使用 **ManimCE**。理由是全部内容都是面向教程的算法、数据结构和系统执行路径解释；任务没有 3Blue1Brown、OpenGL shader 或交互式 REPL 的要求。实现只使用 ManimCE 核心矢量对象和本地旁白音频，不安装插件。每支视频输出 1080p60、中文旁白和独立 `zh-CN` 字幕；时长控制在 65–85 秒。

目标受众是已能阅读 Python 伪代码、正在学习 SGLang Serving Runtime 的开发者。动画和实验共用概念状态，但**不等同于逐行上游源码执行，也不代表真实性能基准**。

## 统一视觉与叙事系统

| 元素 | 规则 |
|---|---|
| 背景与文字 | 背景 `#080B14`，主文字 `#EEF2FF`，次要文字 `#8F9BB7`；使用 Noto Sans CJK SC 与 DejaVu Sans Mono。 |
| 运行态颜色 | 紫色 `#7C5CFF` 表示请求或新路径，青色 `#40E0D0` 表示复用/接受/完成，黄色 `#FFD166` 表示当前执行焦点，红色 `#FF6B8A` 表示分叉、拒绝或瓶颈。 |
| 每支片头 | 主标题、一个可预测的问题和“概念化原理动画”标记。 |
| 每支片尾 | 用一条公式或状态不变量收束，并明确标注“概念化代码锚点，不等同于逐行源码”。 |
| 叙事节奏 | 问题 → 可视化运行 → 状态变化 → 可复用规则。每一场只引入一个新状态，避免把 Runtime 术语堆成静态框图。 |

---

# 05 · RadixAttention：共享前缀不是“相似文本”

## Overview

- **Hook**：两条请求文字相近，为什么只有某一段真的能复用 KV？
- **Key insight**：复用边界是**最长连续 token 前缀**；命中后只需 extend suffix。
- **Target length**：101.64 秒（五段实测旁白总和）。

| 场景 | 音频文件 | 实测时长 |
|---|---|---:|
| 1 | `radix_attention/audio/scene1_hook.wav` | 14.84s |
| 2 | `radix_attention/audio/scene2_insert.wav` | 18.72s |
| 3 | `radix_attention/audio/scene3_match.wav` | 25.60s |
| 4 | `radix_attention/audio/scene4_extend.wav` | 19.36s |
| 5 | `radix_attention/audio/scene5_summary.wav` | 23.12s |

## Scene 1：预测问题（14.84s）

A 和 B 两条 token ribbon 从左侧进入，前 6 个 token 为黄色，随后分别出现 `kv cache` 与 `radix attention`。标题提出：B 可以跳过多少 Prefill？

## Scene 2：A 写入树（18.72s）

A 的 token 依次压缩为 radix tree 单一路径；每个节点下方出现青色 KV block。镜头强调“树是索引，KV 是可复用的计算结果”。

## Scene 3：B 沿路径匹配（25.60s）

B 的 token 指针沿树移动。前 6 次命中依次变青，第 7 个 token 触发紫色分叉并停止匹配；后续相同词不允许“跳回”树枝。

## Scene 4：调度器只 extend suffix（19.36s）

6 个 KV blocks 被锁定为 reused；右侧只保留 2 个紫色未填块。公式逐步写出 `matched=6` 与 `extend=8-6=2`。

## Scene 5：收束（23.12s）

树、KV blocks 和 Scheduler 三者收拢为一条状态链：`longest token prefix → reuse KV → shorter extend work`。展示概念化代码锚点警示。

---

# 07 · Chunked Prefill：把长请求切成调度边界

## Overview

- **Hook**：切块没有减少 token，为什么 Decode 请求反而多了插队机会？
- **Key insight**：chunk size 改变的是单次 bounded prefill 和 Scheduler 重新决策的频率。
- **Target length**：80.28 秒（三段实测旁白总和）。

| 场景 | 音频文件 | 实测时长 |
|---|---|---:|
| 1 | `chunked_prefill/audio/scene1_workloads.wav` | 25.96s |
| 2 | `chunked_prefill/audio/scene2_boundaries.wav` | 25.84s |
| 3 | `chunked_prefill/audio/scene3_tradeoff.wav` | 28.48s |

## Scene 1：一个过长的 Prefill（25.96s）

2048 个 token 被压缩成一条长黄色条；一个小的 Decode peer 在旁边等待。问题：一个长条占住一次调度，会发生什么？

## Scene 2：切成四个 512-token chunk 与 Decode 边界（25.84s）

长条依次切成 P1 到 P4；每块标注 512。镜头明确 token 总量仍为 2048。

## Scene 3：Chunk 粒度的反事实与折中（28.48s）

Scheduler 指针在 P1、P2、P3、P4 间移动；每个 chunk 完成后的空档，蓝绿色 Decode `D` 获得一个 turn。不是并行时间线，而是重新调度边界。

## Scene 4：反事实：1024-token chunk（49–63s）

四块渐变为两块更大的 P1/P2，Decode turn 数同步从 4 减为 2。左侧保持 token 总数不变。

## Scene 5：收束（63–74s）

公式显示 `chunks=ceil(prompt/chunk_size)`，再指出真实 TTFT/TPOT 需要真实系统测量。概念化代码锚点显现。

---

# 10 · Speculative Decoding：接受的是连续前缀

## Overview

- **Hook**：draft 一次给出 4 个 token，target 能否把四个都当作结果？
- **Key insight**：target 批量 verify 后，只能免费推进从当前位置起的**连续 accepted prefix**。
- **Target length**：约 72 秒。

## Scene 1：预测问题（0–10s）

Draft model 递出 d1–d4 token cards；target model 仍是灰色。提出“预测连续接受长度，而不是数绿卡数量”。

## Scene 2：Draft proposal（10–25s）

四张紫色候选卡排成一列进入 target verify gate。整个 proposal 同时被框起来，强调批量验证。

## Scene 3：连续接受或首个拒绝（25–48s）

默认种子下 d1–d4 依次变青，accepted prefix 计数器增长。随后展示一个微型反事实：d3 变红时，d4 即使留在队列里也不能越过 d3 单独累加。

## Scene 4：返回调度器（48–61s）

accepted prefix 变为前进的 token 指针；第一个拒绝边界闪烁，正常 decode 从该位置继续。

## Scene 5：收束（61–72s）

不变量出现：`accepted_tokens = length(consecutive accepted prefix)`，并展示概念化代码锚点。

---

# 11 · Overlap Scheduler：慢侧决定稳态节拍

## Overview

- **Hook**：CPU prepare 和 GPU forward 重叠后，CPU 的 4ms 是否真的消失？
- **Key insight**：第一步保留启动成本，之后稳态由 `max(CPU, GPU)` 决定。
- **Target length**：81.08 秒（三段实测旁白总和）。

| 场景 | 音频文件 | 实测时长 |
|---|---|---:|
| 1 | `overlap_scheduler/audio/scene1_serial.wav` | 21.76s |
| 2 | `overlap_scheduler/audio/scene2_overlap.wav` | 27.08s |
| 3 | `overlap_scheduler/audio/scene3_bottleneck.wav` | 32.24s |

## Scene 1：串行的空洞（21.76s）

四个 step 的 CPU 4ms 与 GPU 8ms 交替排在一条串行轨道上；总计 48ms。

## Scene 2：形成重叠流水线（27.08s）

CPU step n+1 卡片滑入 GPU step n 的下方；第一组 C1/G1 仍独占，后续开始成对重叠。

## Scene 3：计算稳态与 CPU 反事实（32.24s）

轨道压缩为 `C1 | G1+C2 | G2+C3 | G3+C4 | G4`，`max(4,8)=8ms` 高亮为黄色，合计动画推导到 36ms。

## Scene 4：CPU 反事实（50–65s）

CPU 变为 10ms，GPU 为 4ms；红色瓶颈从 GPU 翻转到 CPU。强调 overlap 不会让慢侧消失。

## Scene 5：收束（65–78s）

公式收束：`overlap = CPU + GPU + (steps−1)×max(CPU,GPU)`，并出现概念化代码锚点与真实系统开销声明。

## 旁白与字幕原则

旁白使用普通话、清晰克制的技术讲解语气，不把变量或核心结论念得过快。字幕按场景边界手工标注，使用单行或双行短句；避免尝试调用耗尽额度的自动转写服务。旁白先生成，再根据实际音频时长统一调整各场持续时间和字幕时间轴。
