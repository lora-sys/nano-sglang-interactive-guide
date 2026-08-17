# 02 · Runtime 架构：四个角色，先分清边界

<ConceptMap src="02-concept.svg" alt="Chapter 02 concept map" />

SGLang 现在已经是很大的工程。入门最容易犯的错，是把所有东西都叫“engine”。这套教程先沿 **Python SRT runtime** 把主链拆成四个角色：

- **TokenizerManager**：面向 API/文本世界，规范化请求、tokenize、维护请求状态并把 tokenized request 发给 scheduler。
- **Scheduler**：面向执行计划，维护 waiting/running、prefix cache、batch admission，并驱动每一步 forward。
- **ModelRunner**：面向 GPU tensor 世界，准备 ForwardBatch、attention backend、KV pool、CUDA Graph 等。
- **DetokenizerManager**：把 scheduler 侧返回的 token ids 增量解码成文本。

::: info v0.5.17 的 frontend 变化
v0.5.17 开始加入初步 Rust frontend，把网络 ingress 到“tokenized request 交给 GPU scheduler”这一段逐步迁到 Rust。它不会让下面的 Scheduler / ModelRunner 学习路径失效，但你要知道：**TokenizerManager 不再是所有部署形态下唯一可能的 frontend 实现。**
:::

<HtmlLab src="/labs/02-runtime-architecture.html" title="Lab 02 · Runtime Router" :height="560" />

## 为什么要多进程/多角色？

因为这四段的工作性质完全不同。Tokenize/HTTP 更偏 CPU 与字符串；scheduler 是控制面；model runner 是 GPU hot path；detokenize 又回到 CPU 文本世界。把它们拆开，系统才有机会让 CPU 工作和 GPU 工作重叠，而不是串行卡住。

## 读源码时的技巧

不要从类定义第一行读到最后一行。先找“边界函数”：

- TokenizerManager：`generate_request()`
- Scheduler：event loop / batch construction 相关逻辑
- ScheduleBatch → ForwardBatch：数据结构转换
- DetokenizerManager：增量 decode 与输出回传


## 用“谁拥有状态”代替“谁调用谁”

大型 runtime 的调用链会不断变化，但**状态所有权**更稳定。阅读时可以给每个角色只问一句：如果这个进程挂了，哪一类状态最直接丢失？Tokenizer/front-end 丢的是请求入口与 tokenization 上下文；Scheduler 丢的是 waiting/running 与资源决策；ModelRunner 丢的是执行侧 device state；Detokenizer 丢的是增量文本恢复状态。

Trace Studio 里的 `component` 字段就是为了训练这个习惯。你不需要把每个函数都映射成 event；只要事件跨越了状态边界，它就值得被看见。

### 2 分钟反事实

在 Lab 02 Step 回放时，停在 Scheduler，再切到 ModelRunner。比较 State Lens：前者为什么有 queue / budget，后者为什么出现 positions / KV address / attention metadata？如果你发现某个字段两边都需要，继续追它到底是在边界处“复制”、还是被“转换”。

<SourceMap :files="[
'python/sglang/srt/managers/tokenizer_manager.py',
'python/sglang/srt/managers/scheduler.py',
'python/sglang/srt/managers/detokenizer_manager.py',
'python/sglang/srt/model_executor/model_runner.py'
]" />

<ExerciseCard question="TokenizerManager 和 Scheduler 的分界线是什么？" answer="前者把外部请求变成 runtime 可消费的 tokenized request；后者决定这些 request 在什么时候、以什么 batch 进入模型执行。" task="在实验里切换组件，尝试只用一句话描述每个组件“拥有的状态”。" />
