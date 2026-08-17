import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('docs/guide')
const chapters = fs.readdirSync(dir).filter(f => /^\d\d-.*\.md$/.test(f) && !f.startsWith('00-'))
if (chapters.length !== 13) throw new Error(`Expected 13 chapters, found ${chapters.length}`)
for (const file of chapters) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8')
  for (const required of ['<HtmlLab', '<SourceMap', '<ExerciseCard']) {
    if (!text.includes(required)) throw new Error(`${file} missing ${required}`)
  }
}
console.log(`content check ok: ${chapters.length} chapters`)
