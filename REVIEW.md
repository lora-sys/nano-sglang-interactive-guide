# nano-SGLang Interactive Guide — Review

Review date: 2026-08-17

## Verdict

**Status: strong alpha, not yet a final public tutorial.**

The project already has a coherent learning path, a useful browser-lab pattern, pinned source maps, and a deployable GitHub Pages shape. The largest remaining gap is not engineering completeness; it is **tutorial depth and trust**. A newcomer can skim the system and play with mechanisms, but several chapters are still closer to lecture cards than a self-sufficient zero-to-one tutorial.

## What is already strong

- 13-chapter progression follows one request through the runtime instead of listing features.
- Every chapter has a concept map, browser lab, source map, checkpoint, and hands-on task.
- Browser labs are explicitly conceptual simulations, not fake CUDA/SGLang execution.
- Source maps are pinned to SGLang `v0.5.17` and link to the matching GitHub source.
- The tutorial now scopes architecture discussion to the Python SRT runtime and calls out the v0.5.17 Rust frontend work.
- GitHub Pages assets use VitePress base-aware paths.
- Editable lab inputs are escaped instead of being injected unsafely into HTML.
- Several misleading teaching shortcuts were removed: fake CPU/GPU ownership percentages, an optimistic overlap formula, and a mislabeled chunk metric.

## Remaining blockers before calling it “finished”

### P0 — Make the chapters teach, not just summarize

Most chapters need another layer between the concept card and the source map. Add, at minimum:

1. the problem the mechanism solves;
2. the minimal mental model;
3. the real SGLang objects involved;
4. one state transition walkthrough;
5. one common wrong intuition;
6. one real command/log/source-reading task;
7. one perturbation experiment and expected qualitative result.

A reader should be able to finish a chapter without already knowing inference-runtime vocabulary.

### P0 — Fix the “Run code” contract in Lab 01

The current editor looks like Python, but the browser runner only parses a few assignment fields. That is honest in the surrounding text, yet the interaction still *feels* like a code runner.

Best fix: make the browser-side example an actual tiny executable `nanoRuntime(config)` in JavaScript/TypeScript, and place the real Python SGLang snippet beside it. Avoid loading Pyodide by default; it adds weight without teaching the runtime mechanism.

### P0 — Add a real-trace track

The strongest upgrade would be a dual mode:

- **Concept mode:** deterministic browser simulation, instant and parameterized.
- **Real trace mode:** replay a checked-in JSON trace captured from SGLang v0.5.17.

Both should feed the same Trace Player. This preserves zero-GPU onboarding while letting readers compare the teaching model with evidence from a real runtime.

Recommended event contract:

```json
{
  "t": 12.4,
  "request_id": "r1",
  "component": "scheduler",
  "event": "admit",
  "tokens_in": 48,
  "tokens_cached": 32,
  "batch_size": 6,
  "kv_delta": 16,
  "source": "python/sglang/srt/managers/scheduler.py"
}
```

### P1 — Upgrade the mechanism diagrams

The current SVGs are clean and consistent, but several are generic box flows. Chapters 03, 05, 07, 11, and 12 deserve bespoke diagrams:

- `ScheduleBatch → ForwardBatch`: CPU-side state crossing into GPU tensors.
- RadixAttention: actual shared-prefix tree plus KV ownership.
- Chunked Prefill: timeline showing decode interleaving.
- Overlap Scheduler: two-lane pipeline with bottleneck cases.
- PD / TP / DP / EP / HiCache: topology rather than a linear chain.

### P1 — Add counterfactual diff

Every perturbation lab should support **Run A / change one variable / Run B**, then highlight only the events or state that changed. This makes “perturbation-first” measurable rather than decorative.

### P1 — Reproducible production build

Direct dependencies are pinned, but the project still lacks a lockfile because dependency installation could not be completed in the current environment. Before release:

- generate and commit `package-lock.json`;
- switch CI from `npm install` to `npm ci`;
- run `npm run check` on a clean clone;
- verify the deployed repo-subpath URL, navigation, all labs, and source links.

### P2 — Accessibility and polish

- Give form controls explicit labels / `aria-*` where appropriate.
- Add visible keyboard focus treatment.
- Check iframe lab heights on narrow mobile screens.
- Add Previous / Next learning prompts and chapter progress.
- Make `publish-github.sh` handle an existing git repository more gracefully.

## Review score

| Area | Score | Note |
|---|---:|---|
| Learning architecture | 8.5/10 | Request-centered path is strong. |
| Technical/source anchoring | 8.5/10 | Pinned source maps are much better after review. |
| Browser lab teaching value | 7.5/10 | Good mechanisms; needs real-trace comparison and A/B diff. |
| Zero-to-one tutorial depth | 5.5/10 | Main remaining weakness. |
| Engineering / Pages readiness | 7.5/10 | Static checks pass; production VitePress build still unverified. |
| Honesty / evidence discipline | 9/10 | Simulations are labeled; fake benchmark numbers are avoided. |

**Overall: 7.8/10 today.** The foundation is worth keeping. The next pass should spend less effort adding features and more effort turning each chapter into a complete learning loop.
