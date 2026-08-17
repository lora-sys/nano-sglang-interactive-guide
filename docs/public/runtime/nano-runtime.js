import { makeEvent, SOURCE } from './trace-contract.js'

function clamp(n, min, max) { return Math.min(max, Math.max(min, Number(n))) }
function words(text) {
  const s = String(text ?? '').trim()
  return s ? s.split(/\s+/) : []
}
function lcp(a, b) {
  let n = 0
  while (n < Math.min(a.length, b.length) && a[n] === b[n]) n++
  return n
}
function seeded(seed = 1) {
  let x = Math.abs(Number(seed) || 1) % 2147483647
  if (x === 0) x = 1
  return () => ((x = (x * 48271) % 2147483647) - 1) / 2147483646
}

export class NanoSGLangRuntime {
  constructor({ tokenModel = 'whitespace-teaching-tokenizer' } = {}) {
    this.tokenModel = tokenModel
  }

  generate(config = {}) {
    const prompt = String(config.prompt ?? 'Explain KV cache.')
    const tokens = words(prompt)
    const promptTokens = Math.max(1, tokens.length)
    const maxNewTokens = clamp(config.maxNewTokens ?? 5, 1, 32)
    const cachedPrefixTokens = clamp(config.cachedPrefixTokens ?? 0, 0, promptTokens)
    const extendTokens = promptTokens - cachedPrefixTokens
    const events = []
    let t = 0
    const push = (step, data) => { events.push(makeEvent({ t, ...data })); t += step }

    push(0.8, { component: 'api', event: 'request_received', message: `accept request · ${promptTokens} teaching tokens`, state: { prompt }, metrics: { prompt_tokens: promptTokens }, source: SOURCE.api })
    push(0.9, { component: 'tokenizer', event: 'tokenized', message: `text → ${promptTokens} teaching tokens`, state: { tokenizer: this.tokenModel }, metrics: { prompt_tokens: promptTokens }, source: SOURCE.tokenizer })
    push(0.9, { component: 'radix', event: cachedPrefixTokens ? 'prefix_hit' : 'prefix_miss', message: cachedPrefixTokens ? `reuse ${cachedPrefixTokens}/${promptTokens} prefix tokens` : 'no reusable prefix', metrics: { matched_prefix_tokens: cachedPrefixTokens, extend_tokens: extendTokens }, source: SOURCE.radix })
    push(1.0, { component: 'scheduler', event: 'admit', message: `schedule EXTEND(${extendTokens})`, state: { forward_mode: 'EXTEND' }, metrics: { extend_tokens: extendTokens, batch_size: 1 }, source: SOURCE.scheduler })
    push(1.2, { component: 'model_runner', event: 'prefill', phase: 'prefill', message: `model forward for ${extendTokens} uncached prompt tokens`, metrics: { prefill_tokens: extendTokens, new_kv_tokens: extendTokens }, source: SOURCE.runner })

    for (let i = 0; i < maxNewTokens; i++) {
      push(0.7, { component: 'scheduler', event: 'decode_step', phase: 'decode', message: `schedule decode step ${i + 1}`, metrics: { decode_step: i + 1, batch_size: 1 }, source: SOURCE.scheduler })
      push(0.7, { component: 'model_runner', event: 'forward', phase: 'decode', message: `forward → token_${i + 1}`, metrics: { generated_tokens: i + 1 }, source: SOURCE.runner })
      push(0.35, { component: 'detokenizer', event: 'stream', phase: 'decode', message: `stream token_${i + 1}`, metrics: { generated_tokens: i + 1 }, source: SOURCE.detokenizer })
    }
    push(0, { component: 'api', event: 'request_finished', phase: 'done', message: 'request complete', metrics: { prompt_tokens: promptTokens, matched_prefix_tokens: cachedPrefixTokens, prefill_tokens: extendTokens, generated_tokens: maxNewTokens }, source: SOURCE.api })

    return {
      scenario: 'first-request',
      config: { prompt, maxNewTokens, cachedPrefixTokens },
      events,
      metrics: { prompt_tokens: promptTokens, matched_prefix_tokens: cachedPrefixTokens, prefill_tokens: extendTokens, generated_tokens: maxNewTokens },
    }
  }

  morphBatch({ requestCount = 3, stage = 0 } = {}) {
    const n = clamp(requestCount, 1, 16)
    const s = clamp(stage, 0, 2)
    const stages = [
      { name: 'Req', component: 'tokenizer', source: SOURCE.tokenizer, state: { locality: 'CPU-side request state', gpu_tensors: false, fields: ['rid', 'input_ids', 'sampling_params', 'state=waiting'] } },
      { name: 'ScheduleBatch', component: 'scheduler', source: SOURCE.batch, state: { locality: 'scheduler-owned control state', gpu_tensors: 'not yet fully tensorized', fields: ['reqs[]', 'forward_mode', 'seq_lens', 'prefix_lens', 'token_budget'] } },
      { name: 'ForwardBatch', component: 'model_runner', source: SOURCE.batch, state: { locality: 'device-ready execution metadata', gpu_tensors: true, fields: ['input_ids', 'positions', 'seq_lens', 'out_cache_loc', 'attention metadata'] } },
    ]
    const current = stages[s]
    return {
      scenario: 'batch-morph',
      events: [makeEvent({ component: current.component, event: 'state_snapshot', message: current.name, state: current.state, metrics: { requests: s === 0 ? 1 : n }, source: current.source })],
      metrics: { requests: s === 0 ? 1 : n, stage: s },
      state: current,
    }
  }

  continuousBatch({ requests = [2, 7, 3, 5, 2], capacity = 4, steps = 10 } = {}) {
    const cap = clamp(capacity, 1, 16)
    const waiting = requests.map((len, i) => ({ id: `r${i + 1}`, left: clamp(len, 1, 64), total: clamp(len, 1, 64) }))
    const running = []
    const events = []
    let reclaimed = 0
    let t = 0
    for (let step = 1; step <= clamp(steps, 1, 64); step++) {
      const done = []
      for (const r of running) r.left -= 1
      for (let i = running.length - 1; i >= 0; i--) {
        if (running[i].left <= 0) { done.push(running[i]); running.splice(i, 1); reclaimed++ }
      }
      const admitted = []
      while (running.length < cap && waiting.length) { const r = waiting.shift(); running.push(r); admitted.push(r) }
      events.push(makeEvent({
        t: t++, component: 'scheduler', event: 'schedule_step', phase: 'decode',
        message: `step ${step} · finish ${done.length} · admit ${admitted.length}`,
        state: { waiting: waiting.map(x => ({ ...x })), running: running.map(x => ({ ...x })), finished: done.map(x => x.id), admitted: admitted.map(x => x.id) },
        metrics: { step, active_slots: running.length, reclaimed_slots: reclaimed, waiting_requests: waiting.length },
        source: SOURCE.scheduler,
      }))
      if (!waiting.length && !running.length) break
    }
    const last = events.at(-1)?.metrics ?? {}
    return { scenario: 'continuous-batch', events, metrics: last }
  }

  radixReuse({ promptA = '', promptB = '' } = {}) {
    const A = words(promptA), B = words(promptB), shared = lcp(A, B)
    const events = [
      makeEvent({ t: 0, requestId: 'A', component: 'radix', event: 'insert', message: `insert A (${A.length} tokens)`, state: { tokens: A }, metrics: { tokens: A.length }, source: SOURCE.radix }),
      makeEvent({ t: 1, requestId: 'B', component: 'radix', event: shared ? 'prefix_hit' : 'prefix_miss', message: shared ? `B reuses ${shared} prefix tokens` : 'B shares no prefix', state: { shared: A.slice(0, shared), suffix_a: A.slice(shared), suffix_b: B.slice(shared) }, metrics: { matched_prefix_tokens: shared, prefill_tokens_saved: shared, prefix_reuse_ratio: B.length ? shared / B.length : 0 }, source: SOURCE.radix }),
      makeEvent({ t: 2, requestId: 'B', component: 'scheduler', event: 'cache_aware_extend', message: `only extend ${Math.max(0, B.length - shared)} tokens`, metrics: { extend_tokens: Math.max(0, B.length - shared) }, source: SOURCE.schedulePolicy }),
    ]
    return { scenario: 'radix-reuse', events, metrics: { matched_prefix_tokens: shared, prefill_tokens_saved: shared, prefix_reuse_ratio: B.length ? shared / B.length : 0 }, state: events[1].state }
  }

  chunkedPrefill({ promptTokens = 2048, chunkSize = 512, decodeSteps = 4 } = {}) {
    const p = clamp(promptTokens, 1, 32768), c = clamp(chunkSize, 1, p), d = clamp(decodeSteps, 1, 16)
    const chunks = Math.ceil(p / c)
    const events = []
    let left = p, t = 0
    for (let i = 0; i < chunks; i++) {
      const thisChunk = Math.min(c, left); left -= thisChunk
      events.push(makeEvent({ t: t++, component: 'scheduler', event: 'prefill_chunk', phase: 'prefill', message: `chunk ${i + 1}/${chunks}: ${thisChunk} tokens`, metrics: { chunk_tokens: thisChunk, remaining_prefill_tokens: left, scheduler_turn: i + 1 }, source: SOURCE.scheduler }))
      if (i < d) events.push(makeEvent({ t: t + 0.2, requestId: 'decode-peer', component: 'scheduler', event: 'decode_interleave', phase: 'decode', message: `decode peer gets a scheduling turn`, metrics: { decode_turn: i + 1 }, source: SOURCE.scheduler }))
    }
    return { scenario: 'chunked-prefill', events, metrics: { prompt_tokens: p, chunk_size: c, prefill_chunks: chunks, largest_chunk_tokens: c, scheduler_turns: chunks } }
  }

  speculative({ draftTokens = 4, acceptanceRate = 0.8, seed = 7 } = {}) {
    const n = clamp(draftTokens, 1, 16), rate = clamp(acceptanceRate, 0, 1), rand = seeded(seed)
    const accepted = []
    let accepting = true
    for (let i = 0; i < n; i++) {
      const ok = accepting && rand() < rate
      accepted.push(ok)
      if (!ok) accepting = false
    }
    const good = accepted.filter(Boolean).length
    const events = [
      makeEvent({ t: 0, component: 'draft_model', event: 'propose', message: `draft proposes ${n} tokens`, state: { proposal: Array.from({ length: n }, (_, i) => `d${i + 1}`) }, metrics: { draft_tokens: n }, source: SOURCE.runner }),
      makeEvent({ t: 1, component: 'model_runner', event: 'verify', message: `target verifies proposal`, state: { accepted }, metrics: { verified_tokens: n }, source: SOURCE.runner }),
      makeEvent({ t: 2, component: 'scheduler', event: 'accept_prefix', message: `${good} consecutive draft tokens accepted`, metrics: { accepted_tokens: good, rejected_tokens: n - good, acceptance_ratio_observed: n ? good / n : 0 }, source: SOURCE.scheduler }),
    ]
    return { scenario: 'speculative', events, metrics: { draft_tokens: n, accepted_tokens: good, rejected_tokens: n - good, acceptance_ratio_observed: n ? good / n : 0 }, state: { accepted } }
  }

  overlap({ cpuMs = 4, gpuMs = 8, steps = 4 } = {}) {
    const c = clamp(cpuMs, 0, 100), g = clamp(gpuMs, 0.1, 100), n = clamp(steps, 1, 32)
    const serial = n * (c + g)
    const overlapped = c + g + (n - 1) * Math.max(c, g)
    const hidden = serial ? (serial - overlapped) / serial : 0
    const events = []
    for (let i = 0; i < n; i++) {
      events.push(makeEvent({ t: i * Math.max(c, g), component: 'scheduler', event: 'cpu_prepare', message: `prepare step ${i + 1}`, metrics: { cpu_ms: c, step: i + 1 }, source: SOURCE.scheduler }))
      events.push(makeEvent({ t: c + i * Math.max(c, g), component: 'model_runner', event: 'gpu_forward', message: `GPU forward ${i + 1}`, metrics: { gpu_ms: g, step: i + 1 }, source: SOURCE.runner }))
    }
    return { scenario: 'overlap', events, metrics: { serial_total_ms: serial, overlap_total_ms: overlapped, hidden_fraction: hidden, bottleneck: c > g ? 'CPU' : 'GPU' } }
  }

  kvAllocator({ sequenceLength = 18, blockSize = 8 } = {}) {
    const n = clamp(sequenceLength, 1, 1e6), b = clamp(blockSize, 1, 4096)
    const blocks = Math.ceil(n / b), capacity = blocks * b, unused = capacity - n
    const events = [
      makeEvent({ t: 0, component: 'scheduler', event: 'kv_allocate', message: `allocate ${blocks} blocks for ${n} logical tokens`, metrics: { sequence_length: n, block_size: b, allocated_blocks: blocks }, source: SOURCE.scheduler }),
      makeEvent({ t: 1, component: 'model_runner', event: 'kv_layout', message: `${capacity - unused}/${capacity} slots used`, state: { slots: Array.from({ length: capacity }, (_, i) => i < n) }, metrics: { capacity_slots: capacity, unused_slots: unused, utilization: capacity ? n / capacity : 0 }, source: SOURCE.runner }),
    ]
    return { scenario: 'kv-allocator', events, metrics: { sequence_length: n, block_size: b, allocated_blocks: blocks, unused_slots: unused, utilization: capacity ? n / capacity : 0 }, state: events[1].state }
  }

  grammarMask({ grammar = 'json', stateIndex = 0 } = {}) {
    const grammars = {
      json: [['{'], ['"ok"'], [':'], ['true', 'false'], ['}']],
      enum: [['red', 'green', 'blue'], ['<eos>']],
    }
    const g = grammars[grammar] || grammars.json
    const i = clamp(stateIndex, 0, g.length - 1)
    const pool = ['hello', '42', '{', '}', '"ok"', ':', 'true', 'false', 'red', 'green', 'blue', 'banana', '<eos>']
    const allowed = g[i]
    const masked = pool.filter(x => !allowed.includes(x))
    const events = [
      makeEvent({ t: 0, component: 'model_runner', event: 'logits_ready', message: 'model produces next-token logits', metrics: { vocabulary_demo_size: pool.length }, source: SOURCE.runner }),
      makeEvent({ t: 1, component: 'scheduler', event: 'grammar_mask', message: `grammar q${i} keeps ${allowed.length} teaching candidates`, state: { grammar, state_index: i, allowed, masked }, metrics: { allowed_candidates: allowed.length, masked_candidates: masked.length }, source: SOURCE.scheduler }),
    ]
    return { scenario: 'grammar-mask', events, metrics: events[1].metrics, state: events[1].state }
  }

  sampling({ temperature = 1, topK = 6, topP = 1 } = {}) {
    const names = ['cache', 'scheduler', 'token', 'GPU', 'tree', 'banana']
    const logits = [4.2, 3.2, 2.3, 1.7, 1.2, 0.2]
    const T = clamp(temperature, 0.05, 10), k = Math.round(clamp(topK, 1, names.length)), p = clamp(topP, 0.01, 1)
    const scaled = logits.map(x => x / T), m = Math.max(...scaled), exp = scaled.map(x => Math.exp(x - m)), z = exp.reduce((a,b)=>a+b,0), probs = exp.map(x=>x/z)
    const order = probs.map((v,i)=>({v,i})).sort((a,b)=>b.v-a.v)
    const keepK = new Set(order.slice(0,k).map(x=>x.i)); let cum=0; const keepP=new Set()
    for (const {v,i} of order) { if (cum < p || keepP.size === 0) { keepP.add(i); cum += v } }
    let filtered = probs.map((v,i)=> keepK.has(i) && keepP.has(i) ? v : 0); const sum=filtered.reduce((a,b)=>a+b,0)||1; filtered=filtered.map(x=>x/sum)
    const distribution = names.map((name,i)=>({name, probability:filtered[i]}))
    const active = distribution.filter(x=>x.probability>0).length
    const events = [
      makeEvent({ t:0, component:'model_runner', event:'logits_ready', message:'6 teaching logits', state:{names,logits}, source:SOURCE.runner }),
      makeEvent({ t:1, component:'scheduler', event:'sampling_filter', message:`T=${T.toFixed(2)} · top-k=${k} · top-p=${p.toFixed(2)}`, state:{distribution}, metrics:{active_candidates:active, temperature:T, top_k:k, top_p:p}, source:SOURCE.scheduler }),
    ]
    return { scenario:'sampling', events, metrics:events[1].metrics, state:{distribution} }
  }

  scaleOut({ bottleneck = 'fit' } = {}) {
    const plans = {
      fit: { choice:'TP', advice:'模型单设备放不下：先从 tensor parallel 的模型切分直觉开始。', nodes:['GPU0 · TP0','collective','GPU1 · TP1'], evidence:['same request','model shard per GPU','communication cost'] },
      throughput: { choice:'DP', advice:'独立请求吞吐不足：先看 data parallel / replicas 与负载分配。', nodes:['Replica A','router','Replica B'], evidence:['different requests','replicated weights','load balance'] },
      moe: { choice:'EP', advice:'MoE expert 计算与路由成为瓶颈：看 expert parallel 与 token routing。', nodes:['Tokens','EP router','Expert shards'], evidence:['token routing','expert placement','all-to-all cost'] },
      pd: { choice:'PD', advice:'长 prefill 干扰 decode latency：看 prefill/decode disaggregation。', nodes:['Prefill pool','KV handoff','Decode pool'], evidence:['TTFT side','KV transfer','ITL side'] },
      kv: { choice:'HiCache', advice:'共享 prefix KV 容量/层级成为核心：看 GPU → host → distributed cache。', nodes:['GPU L1','Host L2','Distributed L3'], evidence:['hot KV','spill tier','remote/shared tier'] },
    }
    const plan = plans[bottleneck] || plans.fit
    const events = [makeEvent({ t:0, component:'scheduler', event:'topology_plan', message:`bottleneck=${bottleneck} → inspect ${plan.choice}`, state:plan, metrics:{topology_nodes:plan.nodes.length}, source:SOURCE.scheduler })]
    return { scenario:'scale-out', events, metrics:events[0].metrics, state:plan }
  }

  prefixReuseBenchmark({ requests = 16, sharedPrefixTokens = 2048, suffixTokens = 256 } = {}) {
    const n = clamp(requests, 1, 10000), p = clamp(sharedPrefixTokens, 0, 1e7), s = clamp(suffixTokens, 0, 1e7)
    const noCache = n * (p + s)
    const withReuse = (p + s) + Math.max(0, n - 1) * s
    const reduction = noCache ? 1 - withReuse / noCache : 0
    const events = [
      makeEvent({ t: 0, component: 'benchmark', event: 'workload_defined', message: `${n} requests · shared prefix=${p} · suffix=${s}`, metrics: { requests: n, shared_prefix_tokens: p, suffix_tokens: s }, source: SOURCE.benchmark }),
      makeEvent({ t: 1, component: 'radix', event: 'reuse_model', message: `theoretical repeated prefill avoided`, metrics: { no_cache_prefill_tokens: noCache, reuse_prefill_tokens: withReuse, theoretical_work_reduction: reduction }, source: SOURCE.radix }),
    ]
    return { scenario: 'prefix-benchmark', events, metrics: { no_cache_prefill_tokens: noCache, reuse_prefill_tokens: withReuse, theoretical_work_reduction: reduction } }
  }
}
