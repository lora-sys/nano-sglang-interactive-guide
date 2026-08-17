# 05 · RadixAttention：把“相同前缀”变成系统资产

<ConceptMap src="05-concept.svg" alt="Chapter 05 concept map" />

很多真实 workload 会重复相同 prompt prefix：system prompt、few-shot examples、多轮对话历史、RAG 模板。普通做法每次都重新 prefill；SGLang 的代表性设计是 **RadixAttention**：用 radix tree 组织 prefix KV cache，让共享前缀自动匹配与复用。

<HtmlLab src="/labs/05-radix-attention.html" title="Lab 05 · Radix Tree Prefix Reuse" :height="650" />

## 直觉：缓存的不是“字符串”，而是计算结果

radix tree 的 key 可以理解成 token span；节点关联对应 span 的 KV cache。新请求到来时：

1. 用 token sequence 在 tree 中找最长匹配前缀；
2. 命中的那段 KV 不需要重新 prefill；
3. 只对未命中 suffix 做 extend/prefill；
4. 新产生的 KV 再插回 tree，供后续请求复用。

这也是为什么 prefix cache 会反过来影响 scheduler：缓存命中本身就具有“调度价值”。


## Prefix reuse 要同时看三层

只看 radix tree 很容易把它误解成字符串数据结构。真正有用的是同时看：**token prefix match → KV block reuse → scheduler extend work 下降**。Lab 05 把这三层放在一个屏幕里，就是为了让你看到“数据结构”如何变成“计算工作量变化”。

注意，命中 prefix 并不意味着整条请求免费。未命中的 suffix 仍要 prefill，随后 decode 仍然逐 token 继续。后面的 benchmark 也因此只允许声称“重复 prefill 工作减少”，不会直接把 token reduction 等同成 latency reduction。

### 3 分钟 A/B

先保存一组完全没有共享前缀的 A，再把 Prompt B 改成与 Prompt A 共享 system prompt。只看 Diff 中三项：`matched_prefix_tokens`、`prefill_tokens_saved`、`prefix_reuse_ratio`。然后回头指出 scheduler 的 `extend_tokens` 为什么同步下降。

<SourceMap :files="[
'python/sglang/srt/mem_cache/radix_cache.py',
'python/sglang/srt/mem_cache/base_prefix_cache.py',
'python/sglang/srt/managers/schedule_policy.py'
]" />

<ExerciseCard question="RadixAttention 省下的主要是什么？" answer="共享 prefix 的重复 prefill 计算，以及相应 KV 重建工作；它不是让 decode 的每个新 token 都免费。" task="先运行两个完全不同 prompt，再运行两个共享 system prefix 的 prompt，对比 saved prefill tokens。" />
