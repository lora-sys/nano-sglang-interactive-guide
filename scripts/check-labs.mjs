import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const dir = path.resolve('docs/public/labs')
const labs = fs.readdirSync(dir).filter(f => /^\d\d-.*\.html$/.test(f)).sort()
if (labs.length !== 13) throw new Error(`Expected 13 numbered labs, found ${labs.length}`)
for (const file of labs) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8')
  if (!text.includes('lab.css')) throw new Error(`${file} missing shared lab.css`)
  if (!text.includes('../runtime/nano-runtime.js')) throw new Error(`${file} is not using shared NanoSGLangRuntime`)
  if (text.includes('eval(')) throw new Error(`${file} contains eval()`)
  if (text.includes('innerHTML')) throw new Error(`${file} contains innerHTML; use DOM/textContent instead`)
}
const studio = fs.readFileSync(path.join(dir, 'trace-studio.html'), 'utf8')
for (const required of ['../runtime/nano-runtime.js', '../runtime/trace-player.js', 'Import Real / External Trace']) {
  if (!studio.includes(required)) throw new Error(`trace-studio missing ${required}`)
}

const scripts = [...labs, 'trace-studio.html']
for (const file of scripts) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8')
  const matches = [...text.matchAll(/<script\s+type=["']module["']>([\s\S]*?)<\/script>/g)]
  for (let i = 0; i < matches.length; i++) {
    const tmp = path.join(os.tmpdir(), `nano-sglang-${file}-${i}.mjs`)
    fs.writeFileSync(tmp, matches[i][1])
    try { execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' }) }
    catch (e) { throw new Error(`${file} module script syntax error:\n${e.stderr?.toString() || e.message}`) }
    finally { fs.rmSync(tmp, { force: true }) }
  }
}
console.log(`lab check ok: ${labs.length} numbered labs + Trace Studio · shared runtime · no eval/innerHTML`)
