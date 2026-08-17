# 12 · Scale Out：TP / DP / EP / PD 分别在拆什么

<ConceptMap src="12-concept.svg" alt="Chapter 12 concept map" />

单卡理解完以后，不要把“多卡”只理解成 tensor parallel。不同 parallelism 拆的是不同维度。

<HtmlLab src="/labs/12-scale-out.html" title="Lab 12 · Parallelism Planner" :height="650" />

## 四个最常见的视角

- **TP (Tensor Parallel)**：一层内部的 tensor/operator 跨 GPU 切分。
- **DP (Data Parallel)**：复制模型实例，让不同请求分到不同 replica。
- **EP (Expert Parallel)**：MoE experts 分布在不同设备/节点，token 发生 expert routing。
- **PD Disaggregation**：把 Prefill 与 Decode 作为两类服务资源拆开，让它们按不同硬件/并发目标独立扩缩。

SGLang 当前还把 KV cache 层级扩展到 **HiCache**：GPU 可视为 L1、host memory 为 L2、分布式 storage 为 L3，用来扩大 prefix KV reuse 的范围。

## 不要先背参数

先问：**瓶颈到底在哪里？** 模型装不下？请求吞吐不够？MoE expert 通信重？prefill 抢 decode？prefix KV 太大？只有明确瓶颈，parallelism 才是设计，而不是参数堆砌。


## 并行策略不是“越多越高级”

每种 parallelism 都重新定义了**状态放在哪里、一次请求跨哪些设备、通信发生在哪条边界**。TP 让同一个 forward 跨设备协作；DP 让不同请求去不同 replica；EP 把 token 路由到 expert；PD 把同一请求的不同生命周期阶段拆到不同资源池；HiCache 则把 KV 的存储层级继续向 host / distributed tier 扩展。

因此最好的入口不是启动参数，而是 bottleneck statement。Lab 12 的输出叫 topology **hypothesis**，不是自动选型答案：每个建议都必须继续用通信量、负载均衡、TTFT/ITL、KV transfer 等证据验证。

### 3 分钟反事实

依次选择“模型放不下”“独立请求吞吐不足”“长 prompt 干扰 decode”“共享 KV 容量受限”。每次只写一句：这次到底拆的是 model、requests、lifecycle，还是 cache tier？能回答这句，比背 TP/DP/PD 参数有用得多。

<SourceMap :files="[
'python/sglang/srt/managers/data_parallel_controller.py',
'python/sglang/srt/disaggregation/',
'python/sglang/srt/layers/',
'python/sglang/srt/managers/cache_controller.py'
]" />

<ExerciseCard question="PD Disaggregation 和普通 DP 的本质区别？" answer="DP 主要复制完整 serving worker 分摊请求；PD 把一次请求生命周期里的 prefill 与 decode 阶段拆到不同资源池，优化目标和通信边界不同。" task="依次选择模型容量、吞吐、MoE、PD、KV 五类 bottleneck，用一句话说明每个 topology hypothesis 拆的是哪一种资源边界。" />
