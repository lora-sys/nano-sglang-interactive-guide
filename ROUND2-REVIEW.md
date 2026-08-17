# Round 2 Review — Unified Runtime / Trace Architecture

Status: **strong beta**

## What changed

- All 13 numbered browser labs now use the same `NanoSGLangRuntime` instead of independent one-off simulators.
- Added a trace contract (`trace-contract.js` + JSON schema) shared by concept traces and imported external traces.
- Added `TracePlayer` with Play / Step / Reset, Source Lens, and numeric A/B diff helpers.
- Added Trace Studio: switch concept scenarios, inspect state, step through events, and import external JSON traces.
- Added A/B perturbation workflows to the high-value causal labs: first request, RadixAttention, chunked prefill, CPU/GPU overlap.
- Removed `eval()` and `innerHTML` from labs; editable inputs use JSON / DOM APIs.
- Reworked speculative decoding to use deterministic seeded behavior and consecutive accepted-prefix semantics.
- Reworked overlap scheduling around the ideal pipeline period `max(CPU, GPU)` instead of assuming CPU work is always hidden.
- Reworked Chapters 03 / 05 / 07 / 11 / 12 concept diagrams to explain state transitions rather than showing generic box arrows.
- Expanded all 13 chapters with a concrete state/causal/perturbation learning loop.
- Source Map remains pinned to SGLang `v0.5.17`; key source paths were checked against that tag.

## Checks that pass

```text
✓ 13 tutorial chapters
✓ 12 Nano Runtime scenario assertions
✓ 13 numbered labs + Trace Studio
✓ all numbered labs import the shared Nano Runtime
✓ module-script syntax checks
✓ no eval() / innerHTML in browser labs
✓ Python examples compile
✓ HtmlLab targets exist
✓ ConceptMap SVG targets exist
✓ relative ES module imports exist
```

## Evidence boundary

The repository intentionally does **not** bundle a fabricated "real GPU trace". `docs/public/traces/` is an empty evidence slot with instructions. Trace Studio can import a trace that follows the contract, but provenance (SGLang version/commit, GPU, model, launch flags, workload) remains mandatory before the UI should call it a real trace.

## Still not claimed as passed

The current execution environment could not complete `npm install` (network timeout), so a clean VitePress production build was not verified locally in this round. GitHub Actions is configured to run `npm install` followed by `npm run check`, which includes the production build.

## Next quality gate

Before calling this `1.0`:

1. Run a clean GitHub Actions Pages build.
2. Open the deployed site on desktop + mobile and inspect all 14 lab surfaces (13 labs + Trace Studio).
3. Capture at least one real SGLang workload with full environment metadata and build the first converter into the trace contract.
4. Compare Concept Runtime vs imported real trace in Chapters 01 / 04 / 05 / 07 / 11.
5. Fix any source-map drift discovered while tracing the real run.
