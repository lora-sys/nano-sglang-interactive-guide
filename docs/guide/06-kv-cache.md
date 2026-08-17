# 06 · KV Cache：为什么要分页管理

<ConceptMap src="06-concept.svg" alt="Chapter 06 concept map" />

Autoregressive decode 每生成一个新 token，都需要访问之前 token 的 K/V。如果每一步都重新计算历史，成本会爆炸，所以推理系统把历史 K/V 缓存在 GPU memory。

问题变成：不同请求长度不同、不断增长、不断结束——怎么管理这块动态内存？

<HtmlLab src="/labs/06-kv-cache.html" title="Lab 06 · KV Block Allocator" :height="610" />

## 从“连续大数组”切到“token/block 映射”

Paged-style KV 管理把逻辑序列和物理 KV storage 解耦。request 看到的是连续 token 序列；底层 allocator 可以把它们映射到不同 physical block/page。这样 request 结束时可以回收 block，也能避免为最大长度预留一整块连续空间。

在 SGLang 当前源码里，KV allocator、memory pool、radix cache 是彼此配合的：prefix cache 需要知道哪些 KV 仍有引用，allocator 负责实际可用空间。


## 先区分三个长度

读 KV allocator 时最容易混淆：**逻辑 sequence length、已分配 capacity、真正占用的 physical slots**。Paged-style 管理的意义就是允许这三者不再被“一个连续大数组”绑死。Lab 06 故意只保留 block size 和 sequence length，让内部碎片直接可见。

真实 allocator 还要处理复用、引用、回收、不同 backend 的布局与并发安全；但如果连 `ceil(seq_len / block_size)` 带来的 capacity 与碎片都没有直觉，就很难理解为什么 scheduler 会把 KV memory 当成 admission constraint。

### 2 分钟反事实

固定 sequence length=18，分别选 block size 4 / 8 / 16。不要只看哪个 utilization 高；同时记录 block 数量。你会看到“更细粒度的回收/碎片”和“更多 block metadata”之间天然存在 trade-off。

<SourceMap :files="[
'python/sglang/srt/mem_cache/allocator/',
'python/sglang/srt/mem_cache/memory_pool.py',
'python/sglang/srt/mem_cache/radix_cache.py',
'python/sglang/srt/model_executor/model_runner.py'
]" />

<ExerciseCard question="为什么 KV cache 管理会影响 scheduler？" answer="因为可用 KV memory 决定还能 admit 多少 token/request；调度不是只看计算，还必须满足内存可行性。" task="把实验 block size 从 4 改成 8，对比内部碎片与 block 数量。" />
