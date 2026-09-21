const assert = require('node:assert/strict')
const { Level: ClassicLevel } = require('../../../backend/node_modules/level')

async function main() {
  assert.equal(process.versions.electron, require('../../package.json').devDependencies.electron)
  const [directory, phase] = process.argv.slice(2)
  const db = new ClassicLevel(directory, {
    valueEncoding: 'json',
    compression: true,
    writeBufferSize: 4096,
    blockSize: 1024,
  })
  const entries = Array.from({ length: 64 }, (_, i) => [
    `message-${String(i).padStart(3, '0')}`,
    { author: 'alice', text: `Message ${i}: ${'persistent compressed data '.repeat(400)}` },
  ])
  try {
    await db.open()
    if (phase === 'write') {
      await db.batch(entries.map(([key, value]) => ({ type: 'put', key, value })))
      await db.compactRange('', '~')
    }
    assert.deepEqual(await db.iterator().all(), entries)
    assert.deepEqual(await db.get(entries[17][0]), entries[17][1])
    await db.close()
    await db.open()
    assert.deepEqual(
      await db.getMany(entries.map(([key]) => key)),
      entries.map(([, value]) => value)
    )
    if (phase === 'read') {
      await db.del(entries[0][0])
      await assert.rejects(db.get(entries[0][0]), { code: 'LEVEL_NOT_FOUND' })
      assert.equal((await db.iterator().all()).length, 63)
    }
    console.log(
      `PASS native database ${phase}: Electron ${process.versions.electron}, Node ${process.versions.node}, ${process.platform}/${process.arch}`
    )
  } finally {
    await db.close()
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
