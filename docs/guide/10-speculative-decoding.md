# 10 · Speculative Decoding：一次验证多个候选 token

<ConceptMap src="10-concept.svg" alt="Chapter 10 concept map" />

标准 decode 每一步都让大模型 forward 一次，只拿一个 token。Speculative Decoding 的想法是：先用更便宜的 draft 方法提出多个 token，再让 target model 用更少的昂贵步骤批量验证。

<HtmlLab src="/labs/10-speculative-decoding.html" title="Lab 10 · Draft & Verify" :height="620" />

## 关键不是“draft 越多越快”

如果 draft 准确率低，大量候选会被拒绝；如果 draft 太重，本身就吃掉收益。真正要看的是：

`draft cost + verify cost + acceptance rate`

SGLang 当前 runtime 支持 speculative decoding，并在模型 runner / speculative 子系统中保留专门的数据与 backend 配置。


## Acceptance 不是“独立命中个数”，而是可连续接受的前缀

教学里一个常见误导是把 draft 的每个 token 独立标成对/错，然后把所有“对”的都算收益。真正的 speculative verify 更关心**从当前位置开始能连续接受多长的 proposal prefix**；一旦某处不被接受，后面的 proposal 不能简单当作仍然白送。

所以新版 Lab 10 用 deterministic seed 生成一个可重复的 proposal，并把 `accepted_tokens` 定义成连续接受前缀。你可以稳定复现同一组结果，才方便讨论原因，而不是被随机动画带着走。

### 3 分钟反事实

固定 seed=7，把 acceptance probability 从 90% 一路降到 30%。记录 `accepted prefix` 的变化；再固定概率，只改变 draft tokens。你会看到“多提 proposal”只有在可接受前缀足够长时才可能有价值。

<SourceMap :files="[
'python/sglang/srt/speculative/',
'python/sglang/srt/model_executor/model_runner.py',
'python/sglang/srt/speculative/spec_info.py'
]" />

<ExerciseCard question="Spec Decode 为什么可能变慢？" answer="draft 本身有成本；acceptance 低时，大量候选白算，target 仍需继续正常 decode，额外控制与验证开销可能超过收益。" task="固定 seed，把 acceptance probability 从 90% 降到 30%，观察连续 accepted prefix 如何变化；再增加 draft tokens，判断额外 proposal 是否真的被接受。" />
