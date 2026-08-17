# 09 · Sampling：最后一个 token 是怎么选出来的

<ConceptMap src="09-concept.svg" alt="Chapter 09 concept map" />

Model forward 给你的不是“答案 token”，而是一组 logits。Sampler 才把 logits 变成 next token。

<HtmlLab src="/labs/09-sampling.html" title="Lab 09 · Sampling Distribution" :height="620" />

## 四个最重要的旋钮

- **Greedy / temperature=0**：直接选最大 logit。
- **Temperature**：缩放 logits，改变分布尖锐程度。
- **Top-k**：只保留概率最高的 k 个候选。
- **Top-p**：保留累计概率达到 p 的最小候选集合。

在 serving engine 里，sampling 不只是“产品参数”。它会和 structured output、speculative decoding、logprob 返回、batch metadata 等功能发生耦合，所以常常有自己的 batch-side 数据结构。


## 用顺序理解三个参数，而不是把它们混成一个旋钮

最小心智模型可以写成：`logits → temperature scaling → top-k / top-p filtering → renormalize → sample`。不同实现细节可能调整顺序或融合 kernel，但学习时先看清每一步对候选空间做了什么。

本实验使用固定的 6 个教学 logits，因此你每次拖动参数看到的变化都是确定性的。这样更适合做反事实：只改 temperature 时，候选概率如何重新分配；再收紧 top-k / top-p 时，哪些候选被直接移除。

### 3 分钟反事实

先保持 `top-k=6, top-p=1`，只把 temperature 从 0.3 拉到 1.8；然后固定 temperature，再把 top-k 从 6 拉到 2。前者主要改变分布形状，后者直接改变候选集合。

<SourceMap :files="[
'python/sglang/srt/layers/sampler.py',
'python/sglang/srt/sampling/sampling_batch_info.py',
'python/sglang/srt/sampling/'
]" />

<ExerciseCard question="temperature 变大后为什么不是简单地‘更随机’？" answer="它改变的是整个 logits 相对差距，从而改变 softmax 分布；随后 top-k/top-p 还可能再次截断候选集合。最终行为是这些步骤组合的结果。" task="先只改变 temperature 观察概率分布，再固定 temperature 收紧 top-k / top-p，区分“重塑概率”和“删除候选”两类变化。" />
