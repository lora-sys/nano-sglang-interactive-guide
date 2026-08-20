# 08 · Structured Outputs：不是“提示模型一定要输出 JSON”

<ConceptMap src="08-concept.svg" alt="Chapter 08 concept map" />

让模型“请严格输出 JSON”只是 prompt engineering；真正的 structured decoding 会在每一步根据 grammar/FSM **屏蔽非法 token**，让采样空间只剩当前语法允许的候选。

SGLang 从早期工作开始就把 structured generation 作为重要能力，当前 runtime 也有独立 constrained/grammar backend。

## 先看动画：Grammar Mask 是 decoding pipeline 的约束层

<video controls playsinline preload="metadata" style="width:100%;border:1px solid #26304A;border-radius:12px;background:#080B14">
  <source src="/animations/structured-output-grammar-mask.mp4" type="video/mp4">
  <track kind="subtitles" src="/animations/structured-output-grammar-mask.zh-CN.srt" srclang="zh-CN" label="中文" default>
  你的浏览器不支持 HTML5 视频播放。
</video>

> 动画中的 FSM state、allowed set 和 token 标记是**概念化代码锚点，不等同于逐行源码或真实 grammar backend**。它强调的关键路径是：`logits → grammar mask → sampler`，grammar 只删除非法路径，不替代模型概率。

<HtmlLab src="/labs/08-structured-output.html" title="Lab 08 · Grammar Mask" :height="620" />

## 一步一步看约束发生在哪里

假设目标 schema 是：

```json
{"ok": true, "score": 0}
```

当已经生成 `{"ok":` 后，下一 token 的合法集合不再是完整 vocabulary，而是能继续形成 boolean 的 token 子集。模型仍然产生 logits，但 grammar backend 会把非法路径 mask 掉，再进入 sampling。

因此 structured output 是 **logits → grammar mask → sampler** 这条路径上的系统能力，而不只是前端字符串模板。


## 约束发生在 token loop 的哪一层？

一个很实用的判断方式：**grammar 不生成 logits，它修改“哪些 logits 还有资格进入 sampling”**。因此结构化输出通常不是模型能力的替代品，而是 decoding pipeline 上的约束层。

Lab 08 的词表非常小，只用于展示状态机：每前进一步，allowed set 会变化。真实实现里 grammar backend、tokenizer vocabulary、batch metadata 与 sampler 会更加复杂，但核心问题不变——当前 grammar state 能否快速给出合法候选/掩码。

### 2 分钟反事实

先走 JSON 的每个 q-state，再切到 enum。观察模型“底层 logits 已经存在”这一事实没有变化，变化的是 `allowed_candidates / masked_candidates`。这能帮助你把 structured output 与 prompt engineering 清楚地区分开。

<SourceMap :files="[
'python/sglang/srt/constrained/',
'python/sglang/srt/sampling/',
'python/sglang/srt/managers/schedule_batch.py'
]" />

<ExerciseCard question="Grammar 约束会替代模型概率吗？" answer="不会。它先删除语法上非法的候选，合法候选之间仍由模型 logits 与 sampling 参数决定概率。" task="在实验里从 JSON object 切换到 enum，观察每个 state 的 allowed token set 如何变化。" />
