# 01 · 第一次请求：先让它动起来

<ConceptMap src="01-concept.svg" alt="Chapter 01 concept map" />

先别读 `scheduler.py`。先看一条请求的生命周期。

真实 SGLang 最短路径可以是：

```bash
uv pip install --prerelease=allow sglang
python3 -m sglang.launch_server \
  --model-path qwen/qwen2.5-0.5b-instruct \
  --host 0.0.0.0 --port 30000
```

另一个终端：

```python
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:30000/v1", api_key="EMPTY")
r = client.chat.completions.create(
    model="qwen/qwen2.5-0.5b-instruct",
    messages=[{"role": "user", "content": "Explain KV cache in one sentence."}],
    temperature=0,
    max_tokens=16,
)
print(r.choices[0].message.content)
```

页面下面的代码不是在浏览器里偷偷装 SGLang。它是一个**可执行的 Nano Runtime 概念模型**：你修改 prompt、`max_new_tokens` 和 `cached_prefix_tokens`，点击 Run，它会生成一串和真实 runtime 阶段对应的教学 trace event。这里的 tokenizer 仍是轻量近似，但 cache hit 不再凭空猜百分比，而由你显式指定。

<HtmlLab src="/labs/01-first-request.html" title="Lab 01 · Run a request" :height="640" />

## 一条请求至少经过哪些边界？

把复杂实现先压成 6 步：

`HTTP/API → Tokenize → Prefix Match → Schedule → Model Step → Detokenize/Stream`

真正重要的不是背顺序，而是知道**每一步的输入输出类型在改变**：文本变 token ids；token ids 被包装成 request；scheduler 把 request 组成 batch；GPU forward 输出 token；token 再变回增量文本。


## 用 Trace 而不是“函数调用栈”建立第一张地图

第一次跑实验时，不要急着记类名。只盯住四类变化：`text → token ids`、`request → scheduled work`、`uncached prefix → new KV`、`one forward → one streamed token`。第二次再把 `cachedPrefixTokens` 从 0 改成一个非零值，观察 **哪些阶段完全不变，哪些指标改变**。

这一步很重要：一个优化机制往往只改变 request lifecycle 的局部，而不是把整条链路替换掉。后面所有章节都会沿用这种“先找不变量，再找变量”的读法。

### 2 分钟反事实

1. Save as A：`cachedPrefixTokens = 0`。
2. 只改成 `cachedPrefixTokens = 4`，Run B。
3. 看 Diff：`prompt_tokens` 和 `generated_tokens` 应保持不变，`matched_prefix_tokens` 上升，`prefill_tokens` 下降。
4. 如果你能用一句话解释这个 Diff，就已经理解 prefix reuse 插在 request lifecycle 的哪里。

<SourceMap :files="[
'python/sglang/srt/managers/tokenizer_manager.py',
'python/sglang/srt/managers/scheduler.py',
'python/sglang/srt/model_executor/model_runner.py',
'python/sglang/srt/managers/detokenizer_manager.py'
]" />

<ExerciseCard question="为什么第一章不从 attention kernel 开始？" answer="因为推理引擎首先是一个请求生命周期系统。先掌握状态与边界，后面的 cache、batch、kernel 才知道是在优化哪一段。" task="把 max_new_tokens 从 4 改成 10，观察 trace 中哪些阶段只出现一次，哪些阶段重复出现。" />
