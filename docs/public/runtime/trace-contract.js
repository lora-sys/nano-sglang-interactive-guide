export const TRACE_VERSION = '0.2.0'

export const SOURCE = Object.freeze({
  api: 'python/sglang/srt/entrypoints/http_server.py',
  tokenizer: 'python/sglang/srt/managers/tokenizer_manager.py',
  radix: 'python/sglang/srt/mem_cache/radix_cache.py',
  scheduler: 'python/sglang/srt/managers/scheduler.py',
  schedulePolicy: 'python/sglang/srt/managers/schedule_policy.py',
  batch: 'python/sglang/srt/managers/schedule_batch.py',
  runner: 'python/sglang/srt/model_executor/model_runner.py',
  detokenizer: 'python/sglang/srt/managers/detokenizer_manager.py',
  benchmark: 'python/sglang/benchmark/serving.py',
})

export function makeEvent({
  t = 0,
  requestId = 'r1',
  component,
  event,
  phase = 'runtime',
  message = '',
  state = {},
  metrics = {},
  source = '',
  kind = 'concept',
}) {
  if (!component || !event) throw new Error('trace event requires component + event')
  return {
    trace_version: TRACE_VERSION,
    kind,
    t: Number(t),
    request_id: requestId,
    component,
    event,
    phase,
    message,
    state,
    metrics,
    source,
  }
}

export function validateTrace(events) {
  if (!Array.isArray(events)) return { ok: false, errors: ['trace must be an array'] }
  const errors = []
  events.forEach((e, i) => {
    if (!e || typeof e !== 'object') errors.push(`#${i}: not an object`)
    else {
      if (!e.component) errors.push(`#${i}: missing component`)
      if (!e.event) errors.push(`#${i}: missing event`)
      if (!Number.isFinite(Number(e.t))) errors.push(`#${i}: invalid t`)
    }
  })
  return { ok: errors.length === 0, errors }
}

export function summarize(events) {
  const summary = {
    events: events.length,
    components: new Set(),
    lastT: 0,
    requestIds: new Set(),
  }
  for (const e of events) {
    summary.components.add(e.component)
    summary.requestIds.add(e.request_id)
    summary.lastT = Math.max(summary.lastT, Number(e.t) || 0)
  }
  return {
    events: summary.events,
    components: summary.components.size,
    lastT: summary.lastT,
    requests: summary.requestIds.size,
  }
}

export function numericDiff(a = {}, b = {}) {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  const rows = []
  for (const key of keys) {
    const av = a[key]
    const bv = b[key]
    if (typeof av === 'number' && typeof bv === 'number') {
      rows.push({ key, a: av, b: bv, delta: bv - av })
    }
  }
  return rows
}
