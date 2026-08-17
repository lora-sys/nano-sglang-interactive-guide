import { validateTrace, summarize, numericDiff } from './trace-contract.js'

function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}
function format(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return String(v)
}

export class TracePlayer {
  constructor({ traceEl, pathEl = null, sourceEl = null, speed = 180, onEvent = null } = {}) {
    this.traceEl = traceEl
    this.pathEl = pathEl
    this.sourceEl = sourceEl
    this.speed = speed
    this.onEvent = onEvent
    this.events = []
    this.index = 0
    this.timer = null
  }
  load(events) {
    const checked = validateTrace(events)
    if (!checked.ok) throw new Error(checked.errors.join('\n'))
    this.stop(); this.events = events; this.index = 0
    if (this.traceEl) this.traceEl.replaceChildren()
    this._clearPath()
    return summarize(events)
  }
  _clearPath() {
    if (!this.pathEl) return
    this.pathEl.querySelectorAll('[data-component]').forEach(n => n.classList.remove('active', 'done'))
  }
  _activate(component) {
    if (!this.pathEl) return
    this.pathEl.querySelectorAll('[data-component]').forEach(n => {
      if (n.classList.contains('active')) { n.classList.remove('active'); n.classList.add('done') }
    })
    const n = this.pathEl.querySelector(`[data-component="${CSS.escape(component)}"]`)
    if (n) n.classList.add('active')
  }
  _render(e) {
    this._activate(e.component)
    if (this.sourceEl) {
      this.sourceEl.textContent = e.source || '—'
      if (e.source) this.sourceEl.href = `https://github.com/sgl-project/sglang/blob/v0.5.17/${e.source}`
      else this.sourceEl.removeAttribute('href')
    }
    if (this.traceEl) {
      const row = el('div', 'event')
      const strong = el('strong', '', `${format(e.t)} · ${e.component.toUpperCase()} · ${e.event}`)
      row.append(strong)
      if (e.message) row.append(document.createTextNode(` · ${e.message}`))
      this.traceEl.append(row)
      this.traceEl.scrollTop = this.traceEl.scrollHeight
    }
    this.onEvent?.(e, this.index - 1)
  }
  step() {
    if (this.index >= this.events.length) return false
    this._render(this.events[this.index++])
    return this.index < this.events.length
  }
  play() {
    this.stop()
    const tick = () => {
      if (!this.step()) { this.stop(); return }
      this.timer = setTimeout(tick, this.speed)
    }
    tick()
  }
  reset() { this.stop(); this.index = 0; if (this.traceEl) this.traceEl.replaceChildren(); this._clearPath() }
  stop() { if (this.timer) clearTimeout(this.timer); this.timer = null }
}

export function renderMetricDiff(container, a = {}, b = {}, labels = { a: 'A', b: 'B' }) {
  container.replaceChildren()
  const rows = numericDiff(a, b)
  if (!rows.length) { container.append(el('div', 'event', '没有可比较的数值指标。')); return }
  for (const r of rows) {
    const row = el('div', 'diff-row')
    row.append(el('span', 'diff-key', r.key))
    row.append(el('span', 'diff-a', `${labels.a}: ${format(r.a)}`))
    row.append(el('span', 'diff-b', `${labels.b}: ${format(r.b)}`))
    const sign = r.delta > 0 ? '+' : ''
    row.append(el('strong', r.delta === 0 ? 'diff-zero' : (r.delta > 0 ? 'diff-pos' : 'diff-neg'), `${sign}${format(r.delta)}`))
    container.append(row)
  }
}

export async function loadTraceFile(file) {
  const text = await file.text()
  const parsed = JSON.parse(text)
  const events = Array.isArray(parsed) ? parsed : parsed.events
  const checked = validateTrace(events)
  if (!checked.ok) throw new Error(checked.errors.join('\n'))
  return { events, metadata: Array.isArray(parsed) ? {} : (parsed.metadata || {}) }
}
