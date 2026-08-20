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
