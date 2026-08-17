# Real trace slot

This directory intentionally ships without fabricated "real" traces.

The browser labs can import a JSON trace that follows `runtime/trace-contract.schema.json`.
A future GPU-backed capture should record its environment (SGLang version/commit, model,
GPU, CUDA/driver, launch flags, workload) next to the events.

The tutorial pins source links to SGLang v0.5.17. Concept traces are generated locally by
`NanoSGLangRuntime`; imported traces must be explicitly marked `kind: real` or `kind: imported`.
