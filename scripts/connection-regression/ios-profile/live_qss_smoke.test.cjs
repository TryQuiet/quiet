const {test} = require('node:test')
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path')
const {run} = require('./live_qss_smoke.cjs')
test('live diagnostic refuses absent or ambiguous stores and unbounded outgoing probes', async () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-live-smoke-'))
  try {
    await assert.rejects(run({profiler: {}}, {output}), /exactly one/)
    const store = {channelData: {name: 'general'}, store: {}, auth: {}}
    const bundle = {profiler: {liveInstances: new Map([['ChannelStore', new Set([store])]])}}
    await assert.rejects(run(bundle, {output, sendPrefix: 'arbitrary-private-text', sendCount: 1}))
    await assert.rejects(run(bundle, {output, sendPrefix: 'qss-smoke-test', sendCount: 1000}))
  } finally { fs.rmSync(output, {recursive: true, force: true}) }
})
