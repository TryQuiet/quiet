// Portable checks of the Android addon recipe; the NDK build itself is exercised by running the script.
const assert = require('node:assert/strict')
const path = require('node:path')
const { test } = require('node:test')
const { ABIS, MIN_SDK, compileArguments } = require('./build-classic-level-android.cjs')

test('x86_64 addon compiles the pinned sources for Android and links against that ABI libnode', () => {
  const sources = { classicLevel: '/src/classic-level', napiMacros: '/src/napi-macros' }
  const args = compileArguments(sources, 'x86_64', '/out/classic_level.node')
  assert.equal(ABIS.x86_64.nodeArch, 'x64') // process.arch on Android x86_64, see packages/backend/classic_level.cjs
  assert.equal(MIN_SDK, 26)
  for (const flag of ['-DOS_ANDROID=1', '-D_REENTRANT=1', '-DSNAPPY=1', '-fno-builtin-memcmp', '-shared', '-Wl,--no-undefined']) {
    assert.ok(args.includes(flag), `missing ${flag}`)
  }
  assert.ok(!args.includes('-DOS_LINUX=1'))
  assert.ok(args.includes('/src/classic-level/binding.cc'))
  assert.ok(args.includes(path.join('/src/classic-level/deps/leveldb/leveldb-1.20', 'port/port_posix.cc')))
  assert.ok(args.includes('/src/classic-level/deps/snappy/linux'))
  const lib = args[args.indexOf('-L') + 1]
  assert.match(lib, /android[\/\\]app[\/\\]libnode[\/\\]bin[\/\\]x86_64$/)
  assert.deepEqual(args.slice(-2), ['-o', '/out/classic_level.node'])
})
