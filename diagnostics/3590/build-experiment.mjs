import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const backend = join(root, 'packages/backend')
const label = process.argv[2]
assert.match(label ?? '', /^[a-z0-9-]+$/, 'Supply an artifact label')
const delayMs = Number(process.env.REPRO_READ_DELAY_MS ?? 20)
assert.ok(Number.isFinite(delayMs) && delayMs >= 0 && delayMs <= 1000)
const eager = process.env.REPRO_EAGER_WS_SOURCE === 'true'
const output = join(root, 'diagnostics/3590/artifacts', label)
await mkdir(output, { recursive: true })

const sourcePath = await realpath(join(backend, 'node_modules/it-ws/dist/src/source.js'))
const original = await readFile(sourcePath, 'utf8')
const sourceRequire = createRequire(sourcePath)
const lazyStart = '    const source = (async function* () {\n'
const readStart = '        await connected();'
assert.equal(original.split(lazyStart).length, 2)
assert.equal(original.split(readStart).length, 2)
let replacement = original
if (eager) replacement = replacement.replace(lazyStart, '').replace(readStart, `${lazyStart}${readStart}`)
replacement = replacement
  .replace(
    'export default (socket) => {',
    `let clientReaders = 0;
export default (socket) => {
    let listenerReady = false;
    socket.addEventListener('message', event => {
        if (socket.url && !listenerReady) console.info('DIAG3590_FRAME_BEFORE_LISTENER', {
            bytes: event.data.byteLength, reader: clientReaders, delayMs: ${delayMs}, eager: ${eager}
        });
    }, { once: true });`
  )
  .replace(
    lazyStart,
    `${lazyStart}
        // Leave the first dial unchanged so the invalid proof reaches the owner.
        // Later reads yield briefly, simulating scheduling latency, not packet loss.
        if (socket.url && ++clientReaders > 1) await new Promise(resolve => setTimeout(resolve, ${delayMs}));
`
  )
  .replace(
    '        }, { highWaterMark: Infinity });',
    '        }, { highWaterMark: Infinity });\n        listenerReady = true;'
  )
  .replace("from 'event-iterator'", `from ${JSON.stringify(sourceRequire.resolve('event-iterator'))}`)
  .replace(
    "from 'uint8arrays/from-string'",
    `from ${JSON.stringify(join(backend, 'node_modules/uint8arrays/dist/src/from-string.js'))}`
  )
const replacementPath = join(output, 'it-ws-source.mjs')
await writeFile(replacementPath, replacement)

const { default: webpack } = await import(
  new URL('../../packages/backend/node_modules/webpack/lib/index.js', import.meta.url)
)
const { default: configFactory } = await import(new URL('../../packages/backend/webpack.config.js', import.meta.url))
const config = configFactory({ mode: 'development' })
config.context = backend
config.output = { ...config.output, path: output }
// Sharing installed dependencies across worktrees creates duplicate nominal TS
// types. This diagnostic bundle uses normal TS emit without claiming a typecheck.
config.module.rules[0].use.options.transpileOnly = true
config.plugins.push(
  new webpack.NormalModuleReplacementPlugin(/[\\/]it-ws[\\/]dist[\\/]src[\\/]source\.js$/, replacementPath)
)
await new Promise((resolve, reject) => {
  webpack(config, (error, stats) => {
    if (error) return reject(error)
    console.info(stats.toString({ colors: false, all: false, errors: true, warnings: true, timings: true }))
    if (stats.hasErrors()) return reject(new Error('Diagnostic bundle build failed'))
    resolve()
  })
})
const bundle = await readFile(join(output, 'bundle.cjs'))
assert.ok(bundle.includes('DIAG3590_FRAME_BEFORE_LISTENER'), 'The dependency replacement must be present')
await writeFile(
  join(output, 'provenance.json'),
  JSON.stringify(
    {
      commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
      delayMs,
      eager,
      originalSourcePath: sourcePath,
      originalSourceSha256: createHash('sha256').update(original).digest('hex'),
      bundleSha256: createHash('sha256').update(bundle).digest('hex'),
      transpileOnly: true,
    },
    null,
    2
  ) + '\n'
)
