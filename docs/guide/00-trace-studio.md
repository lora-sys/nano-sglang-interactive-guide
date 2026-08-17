# Trace Studio：先学会“看运行时”

如果你只想先形成全局直觉，不必从 13 章顺序读。打开 Trace Studio，任选一个 scenario，改参数，然后用 **Play / Step / State Lens / Source Lens** 看同一串事件。

<HtmlLab src="/labs/trace-studio.html" title="Trace Studio · Concept + Imported Trace" :height="860" />

## 为什么它是教程的底座？

13 个实验现在不再各自“演一段动画”。它们共享：

```text
NanoSGLangRuntime
      │
      ▼
Trace Contract
      │
 ┌────┼───────────────┐
 ▼    ▼               ▼
Play  State Lens      Source Lens
      │
      └── A/B Diff / Imported Trace
```

Concept Runtime 的事件明确标记为教学模型。真实 SGLang 的采集结果只要转换成同一 contract，就能复用同一个播放器；教程因此可以比较“为了教学省略了什么”，而不需要把模拟包装成真实执行。

## 最小 Trace Contract

```json
{
  "t": 2.7,
  "request_id": "r1",
  "component": "scheduler",
  "event": "admit",
  "phase": "runtime",
  "state": { "forward_mode": "EXTEND" },
  "metrics": { "extend_tokens": 16 },
  "source": "python/sglang/srt/managers/scheduler.py"
}
```

完整 schema 在 `docs/public/runtime/trace-contract.schema.json`。
