# nano-SGLang 教学升级集成验证记录

## 升级前基线

仓库在升级前已完成 `npm run check`。该命令依次通过 13 章内容检查、12 项共享概念 Runtime 断言、13 个独立实验的安全与模块语法检查，以及 VitePress 生产构建。所有概念实验继续使用共享的 `NanoSGLangRuntime`，且校验器禁止 `eval()` 与 `innerHTML`。

## 首批预测闭环实验：RadixAttention

独立实验页 `/labs/05-radix-attention.html` 已在浏览器验证默认任务。A 与 B 的前 6 个 teaching token 相同、B 总长度为 8；学习者先预测 `matched_prefix_tokens=6` 与 `extend_tokens=2`，再依次执行 A 的 radix tree/KV 插入和 B 的前缀匹配。页面正确显示 6 个共享 token、2 个 Scheduler extend token、75% reuse ratio，以及由 `radix_cache.py` 到 `schedule_policy.py` 的 Trace/Source 链路。核对面板返回“答对 2/2”，并以 `8-6=2` 解释 suffix Prefill 工作量。

## 首批预测闭环实验：Chunked Prefill

独立实验页 `/labs/07-prefill-decode.html` 已在浏览器验证默认 `prompt=2048`、`chunk=512` 任务。学习者先预测 4 个 Prefill chunk 和 4 个 Decode peer turn；运行后，时间线正确显示 P1–P4 与四次 Decode interleave，指标显示 `prefill_chunks=4`、`largest_chunk_tokens=512`、`decode_turns=4`。核对面板返回“答对 2/2”，以 `ceil(2048/512)=4` 和 `decodeSteps=4` 解释边界数量与 peer 插入次数，同时明确这只是调度结构而非真实性能结论。

## 首批预测闭环实验：Speculative Decoding

独立实验页 `/labs/10-speculative-decoding.html` 已在浏览器验证默认 `draft=4`、`acceptance=80%`、`seed=7` 任务。学习者先预测连续 accepted prefix 为 4，再运行 Draft proposal 和 Target 批量 verify；页面正确显示 `d1` 至 `d4` 全部接受、`accepted_tokens=4`、`rejected_tokens=0`、observed ratio 为 100%。核对面板返回“预测正确”，并强调 accepted prefix 是在首个拒绝点停止的连续段，而不是可独立累加的单点命中数。

## 首批预测闭环实验：Overlap Scheduler

独立实验页 `/labs/11-overlap-scheduler.html` 已在浏览器验证 GPU 主导任务 `CPU=4ms`、`GPU=8ms`、4 steps。学习者先预测 GPU 为稳态瓶颈、ideal overlap 为 36ms；运行后页面正确显示 serial total 为 48ms、ideal overlap 为 36ms、bottleneck 为 GPU，并将 CPU prepare 与后续 GPU forward 交替呈现在串行与重叠时间线上。核对面板返回“答对 2/2”，以 `4+8+3×max(4,8)=36ms` 说明启动成本和慢侧节拍。

## 首批原理动画：RadixAttention

`/animations/radix-attention-prefix-reuse.mp4` 已完成 1080p60 定稿，含普通话中文旁白、内嵌 `mov_text` 中文字幕及独立 `radix-attention-prefix-reuse.zh-CN.srt`。动画使用五个 ManimCE 场景解释请求 A 的 token path/KV 建立、请求 B 的最长连续 prefix 命中、`kv` 与 `radix` 的分叉、6 段 KV reuse 和 `extend=8-6=2` 的调度工作量变化。低画质代表帧已审阅，无文字溢出或意外遮挡；低画质总视觉时长为 101.664s，五段实测旁白总时长为 101.640s，误差 0.024s。

第 05 章已嵌入本地视频与中文字幕轨，并在播放器下明确标注动画/代码锚点为概念化阅读路径。动画资源加入后，`npm run check` 再次通过。

## 首批原理动画：Overlap Scheduler

`/animations/overlap-scheduler-steady-cadence.mp4` 已完成 1080p60 定稿，含普通话中文旁白、内嵌 `mov_text` 中文字幕及独立 `overlap-scheduler-steady-cadence.zh-CN.srt`。三场 ManimCE 动画先展示 `CPU=4ms`、`GPU=8ms` 的四步串行 48ms 时间线，再展示 CPU prepare 与 GPU forward 的重叠，以及 `max(4,8)=8ms` 的稳态节拍，最后通过 `CPU=10ms`、`GPU=4ms` 的反事实说明瓶颈翻转到 CPU。低画质总视觉时长为 81.598s，三段实测旁白总时长为 81.080s，误差 0.518s，符合一秒内同步门槛。代表帧审阅确认轨道、公式和双场景对比均清晰、无溢出。

第 11 章已嵌入本地视频与中文字幕轨，并标注为概念化时间线与代码锚点。动画资源加入后，`npm run check` 再次通过。

## 首批原理动画：Chunked Prefill

`/animations/chunked-prefill-scheduler-boundaries.mp4` 已完成 1080p60 定稿，附普通话中文旁白、内嵌字幕和独立 SRT。动画通过长 2048-token Prefill、四个 512-token chunk 与 Decode peer turn、再到两个 1024-token chunk 的反事实，解释 chunk size 改变的是重新调度边界而非总 token。低画质总视觉时长为 80.530s，三段实测旁白总时长为 80.280s，误差 0.250s。第 07 章已嵌入本地视频与字幕轨；加入资源后，`npm run check` 通过。

## 首批原理动画：Speculative Decoding

`/animations/speculative-decoding-accepted-prefix.mp4` 已完成 1080p60 定稿，含普通话中文旁白、内嵌中文字幕和独立 SRT。三场动画解释 draft proposal、target batch verify、d3 首次拒绝使 accepted prefix 停在 d1/d2，以及低 acceptance 下 draft 成本可能无法收回的收益边界。低画质视觉总时长为 74.465s，三段旁白总时长为 74.320s，误差 0.145s；代表帧审阅确认 token 卡片、拒绝边界与对比面板均清晰无溢出。第 10 章已嵌入动画与字幕轨，`npm run check` 在嵌入后通过。

## 下一波原理动画：KV Cache 分页分配

`/animations/kv-cache-paged-allocation.mp4` 已完成 1080p60 定稿，包含普通话中文旁白、内嵌 `mov_text` 中文字幕和独立 SRT。三场动画展示逻辑 sequence 与 physical KV page 的解耦、`sequence=18` 与 `block_size=4` 时的 `ceil(18/4)=5`、`capacity=20` 和 `unused=2`，以及可用 physical blocks 如何成为 Scheduler admission constraint。低画质总视觉时长为 80.265s，三段实测旁白总时长为 80.200s，误差 0.065s；代表帧审阅确认中文排版、分页网格、容量公式和 admission 关系均清晰无溢出。第 06 章嵌入视频与字幕轨后，`npm run check` 通过。

## 第二波原理动画与预测闭环：Structured Outputs

`/animations/structured-output-grammar-mask.mp4` 已完成 1080p60 定稿，包含普通话中文旁白、内嵌 `mov_text` 中文字幕和独立 `structured-output-grammar-mask.zh-CN.srt`。三场 ManimCE 动画依次解释 `logits → grammar mask → sampler` 的处理次序、JSON FSM q-state 如何让 allowed set 随 token 推进而变化，以及 grammar 仅删除非法路径、并不替代 logits 或 sampling 的职责边界。低画质总视觉时长为 71.265s，三段实测旁白总时长为 71.080s，误差 0.185s；最终封装视频为 71.067s，代表帧审阅确认 pipeline、allowed set、红色屏蔽标记与边界对比均清晰、无溢出。

第 08 章在互动实验前嵌入本地视频和独立字幕轨，并以醒目引用说明 FSM state、allowed set 和 token 标记均是**概念化代码锚点，不等同于逐行源码或真实 grammar backend**。`/labs/08-structured-output.html` 同时重构为预测→运行→解释闭环：默认任务固定在 JSON q3（布尔值位置），学习者先预测 allowed token 数；运行共享 `NanoSGLangRuntime.grammarMask()` 后页面显示 `true`、`false`、`allowed_candidates=2` 与其余被屏蔽的教学候选；核对区进一步说明 grammar 先掩蔽非法 logits，合法候选仍由模型概率和 sampler 决定。JSON q0 与 enum q0 提供可重置的反事实任务，且所有旧状态、预测和事件轨迹在切换时清空。资源嵌入和实验重构后，`npm run check` 通过。

## 全站扩展：Sampling、Request→Batch 与 Continuous Batching

`/animations/sampling-distribution.mp4` 已完成 1080p60 定稿，含普通话旁白、内嵌中文字幕和独立 SRT。三场动画依次展示 logits 尚不是 next token、temperature 只重塑概率形状而不删除候选、top-k/top-p 过滤后才重归一化并交给 sampler。低画质视觉总时长为 89.132s，三段实测旁白总时长为 89.120s；代表帧审阅确认概率条、温度对比、过滤门和概念锚点均清晰无溢出。第 09 章已嵌入视频；Lab 09 改为先预测活跃候选数与 `GPU` token 的存留，再运行确定性 sampling state，并解释候选删除与概率重塑的顺序。

`/animations/request-to-batch-dataflow.mp4` 已完成 1080p60 定稿，含普通话旁白、内嵌中文字幕和独立 SRT，总时长 92.640s。三场动画展示 Req 的 CPU 控制状态、多个 Req 汇聚为 ScheduleBatch，以及 ForwardBatch 跨过 control plane → execution plane 成为 ModelRunner 可消费 metadata 的边界。低画质代表帧审阅后修正了第三场底部收束元素的安全区布局。第 03 章已嵌入视频；Lab 03 改为先预测对象 locality 与 device-ready 状态，再显示字段 lens 和共享 runtime event。

`/animations/continuous-batching-reclaim-admit.mp4` 已完成 1080p60 定稿，含普通话旁白、内嵌中文字幕和独立 SRT，总时长 86.560s。三场动画对比静态批空 slot、`finish → reclaim → admit` 循环以及 capacity/KV/token-budget 等真实约束。低画质审阅修正了第一场静态批标签与副标题的间距。第 04 章已嵌入视频；Lab 04 改为先预测首个 slot reuse 的 schedule step 与被接纳 request，再回放 waiting/running state snapshots。

## 全站闭环与入口补强

Lab 06 已改为预测 physical KV block 数与末页 unused slots；Lab 12 已改为从 bottleneck 预测 topology hypothesis 和被拆分的资源边界；Lab 13 已改为预测理论重复 Prefill work reduction，并通过 Evidence Gate 禁止把 work model 自动改写为 latency 或 throughput claim。所有页面继续调用共享 `NanoSGLangRuntime`，且不使用 `eval()` 或 `innerHTML`。

`/animations/runtime-lifecycle-request-trace.mp4` 已完成 1080p60 定稿，含普通话旁白、内嵌中文字幕和独立 SRT，总时长 56.920s。它作为第 01、02 章共享入口动画，将 text/sampling params、tokenized request、Scheduler 的 batch decision、ModelRunner 的 execution metadata 与 Detokenizer streaming text 串成一条 request lifecycle；低画质审阅修复了第二场角色字段标签重叠。第 01、02 章均已嵌入该动画。Lab 02 重构为 runtime role 的预测→运行→解释闭环；Lab 01 与 Trace Studio 均补上概念化代码锚点说明。以上内容加入后，`npm run check` 通过。
