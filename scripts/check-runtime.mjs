import { NanoSGLangRuntime } from '../docs/public/runtime/nano-runtime.js'
import { validateTrace } from '../docs/public/runtime/trace-contract.js'
const rt = new NanoSGLangRuntime()
const cases = [
  rt.generate({ prompt: 'a b c', maxNewTokens: 3, cachedPrefixTokens: 2 }),
  rt.morphBatch({ requestCount: 4, stage: 2 }),
  rt.continuousBatch({ requests: [2, 4, 1], capacity: 2, steps: 10 }),
  rt.radixReuse({ promptA: 'a b c', promptB: 'a b d' }),
  rt.kvAllocator({ sequenceLength: 18, blockSize: 8 }),
  rt.chunkedPrefill({ promptTokens: 1024, chunkSize: 256 }),
  rt.grammarMask({ grammar: 'json', stateIndex: 3 }),
  rt.sampling({ temperature: .8, topK: 4, topP: .9 }),
  rt.speculative({ draftTokens: 5, acceptanceRate: .8, seed: 7 }),
  rt.overlap({ cpuMs: 4, gpuMs: 8, steps: 4 }),
  rt.scaleOut({ bottleneck: 'pd' }),
  rt.prefixReuseBenchmark({ requests: 8, sharedPrefixTokens: 1024, suffixTokens: 128 }),
]
for (const [i, result] of cases.entries()) {
  const v = validateTrace(result.events)
  if (!v.ok) throw new Error(`scenario ${i} invalid: ${v.errors.join(', ')}`)
}
if (cases[0].metrics.prefill_tokens !== 1) throw new Error('first request cache math regression')
if (cases[3].metrics.matched_prefix_tokens !== 2) throw new Error('radix LCP regression')
if (cases[4].metrics.allocated_blocks !== 3) throw new Error('KV allocation regression')
if (cases[9].metrics.overlap_total_ms !== 36) throw new Error('overlap pipeline regression')
console.log(`runtime check ok: ${cases.length} scenario assertions`)
