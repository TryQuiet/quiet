#!/usr/bin/env node
// Cross-compile the classic-level 1.4.1 Node-API addon for an Android ABI with the NDK.
//
// The vendored arm64 addon in nodejs-assets/deps/android/arm64 was produced with
// nodejs-mobile-gyp (docs/building-classic-level-android.md). This builds the same
// pinned sources with NDK clang directly, as build-classic-level-ios.cjs does for the
// iOS simulator, so neither Python 2 nor gyp is needed. It produces the x86_64 emulator
// addon, which is not committed (docs/android-x86_64-emulator.md).
//
// Usage: node scripts/build-classic-level-android.cjs [--abi x86_64] [--ndk /path/to/ndk]
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { PACKAGES, downloadSources, sourceFiles } = require('./build-classic-level-ios.cjs')

const MOBILE_ROOT = path.resolve(__dirname, '..')
const NODE_HEADERS = path.join(MOBILE_ROOT, 'android/app/libnode/include/node')
const LIBNODE_ROOT = path.join(MOBILE_ROOT, 'android/app/libnode/bin')
const ASSETS_ROOT = path.join(MOBILE_ROOT, 'nodejs-assets/deps/android')
const NDK_VERSION = '28.2.13676358' // android/build.gradle ndkVersion
const MIN_SDK = 26 // android/build.gradle minSdkVersion
// Only ABIs whose addon is fetched per checkout; arm64-v8a stays vendored.
const ABIS = {
  x86_64: { triple: 'x86_64-linux-android', nodeArch: 'x64', machine: 'X86-64' },
}

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

function findNdk(explicit) {
  const candidates = [
    explicit,
    process.env.ANDROID_NDK_HOME,
    process.env.ANDROID_NDK,
    process.env.NDK_PATH,
    process.env.ANDROID_HOME && path.join(process.env.ANDROID_HOME, 'ndk', NDK_VERSION),
    process.env.ANDROID_SDK_ROOT && path.join(process.env.ANDROID_SDK_ROOT, 'ndk', NDK_VERSION),
    path.join(os.homedir(), 'android-sdk/ndk', NDK_VERSION),
    path.join(os.homedir(), 'Android/Sdk/ndk', NDK_VERSION),
    path.join(os.homedir(), 'Library/Android/sdk/ndk', NDK_VERSION),
  ].filter(Boolean)
  const ndk = candidates.find(directory => fs.existsSync(path.join(directory, 'source.properties')))
  assert.ok(ndk, `Android NDK ${NDK_VERSION} not found; pass --ndk or set ANDROID_NDK_HOME`)
  return ndk
}

function toolchainBin(ndk) {
  // The NDK ships linux-x86_64 and darwin-x86_64 host toolchains (Rosetta on Apple silicon).
  const bin = path.join(ndk, 'toolchains/llvm/prebuilt', `${process.platform}-x86_64`, 'bin')
  assert.ok(fs.existsSync(bin), `NDK toolchain not found: ${bin}`)
  return bin
}

function compileArguments({ classicLevel, napiMacros }, abi, output) {
  const leveldb = path.join(classicLevel, 'deps/leveldb/leveldb-1.20')
  const includes = [
    NODE_HEADERS,
    napiMacros,
    leveldb,
    path.join(leveldb, 'include'),
    path.join(leveldb, 'port'),
    path.join(leveldb, 'util'),
    path.join(classicLevel, 'deps/snappy/linux'), // snappy.gyp uses the linux config for android
    path.join(classicLevel, 'deps/snappy/snappy'),
  ]
  return [
    '-std=c++17',
    '-O2',
    '-fPIC',
    '-fno-exceptions',
    '-fno-rtti',
    '-fvisibility=hidden',
    '-fno-builtin-memcmp',
    '-pthread',
    '-Wno-sign-compare',
    '-Wno-unused-function',
    '-DNDEBUG',
    '-DBUILDING_NODE_EXTENSION',
    '-DNODE_GYP_MODULE_NAME=classic_level',
    '-DLEVELDB_PLATFORM_POSIX=1',
    '-DSNAPPY=1',
    '-DHAVE_CONFIG_H=1',
    '-DOS_ANDROID=1', // leveldb.gyp's android branch
    '-D_REENTRANT=1',
    ...includes.flatMap(directory => ['-I', directory]),
    ...sourceFiles(classicLevel),
    '-shared',
    '-Wl,-soname,classic_level.node',
    '-Wl,--no-undefined',
    // Same dynamic dependencies as the vendored arm64 addon; N-API symbols resolve from libnode.so.
    '-L',
    path.join(LIBNODE_ROOT, abi),
    '-lnode',
    '-llog',
    '-lm',
    '-ldl',
    '-o',
    output,
  ]
}

function validate(bin, output, { machine }) {
  const readelf = path.join(bin, 'llvm-readelf')
  assert.match(run(readelf, ['-h', output]), new RegExp(`Machine:\\s+.*${machine}`), 'Unexpected ELF machine')
  const loads = run(readelf, ['-lW', output]).split('\n').filter(line => /^\s*LOAD\b/.test(line))
  assert.ok(loads.length > 0, 'No LOAD segments')
  for (const line of loads) {
    const align = parseInt(line.trim().split(/\s+/).pop(), 16)
    assert.ok(align >= 0x4000, `LOAD segment alignment ${align} is below 16 KB`)
  }
  assert.match(run(readelf, ['-d', output]), /\[libnode\.so\]/, 'Addon does not depend on libnode.so')
  const exported = run(path.join(bin, 'llvm-nm'), ['-D', '--defined-only', output])
  assert.match(exported, /\bnapi_register_module_v1\b/, 'Missing Node-API initializer')
}

async function build(abi, ndkPath) {
  const target = ABIS[abi]
  assert.ok(target, `Unsupported ABI ${abi}; supported: ${Object.keys(ABIS).join(', ')}`)
  const libnode = path.join(LIBNODE_ROOT, abi, 'libnode.so')
  assert.ok(
    fs.existsSync(libnode),
    `${libnode} is missing; run: python3 scripts/nodejs-mobile-runtime/install.py --install --abi ${abi}`
  )
  const ndk = findNdk(ndkPath)
  const bin = toolchainBin(ndk)
  const clang = path.join(bin, `${target.triple}${MIN_SDK}-clang++`)
  assert.ok(fs.existsSync(clang), `Compiler not found: ${clang}`)
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-classic-level-android-'))
  try {
    const sources = await downloadSources(work)
    const output = path.join(work, 'classic_level.node')
    console.log(`Building classic-level ${PACKAGES[0].version} for Android ${abi} (API ${MIN_SDK}) with ${ndk}`)
    run(clang, compileArguments(sources, abi, output))
    run(path.join(bin, 'llvm-strip'), ['--strip-unneeded', output])
    validate(bin, output, target)
    const destination = path.join(ASSETS_ROOT, target.nodeArch, 'classic-level', 'classic_level.node')
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(output, destination)
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(destination)).digest('hex')
    console.log(`Installed ${destination} (${fs.statSync(destination).size} bytes, sha256 ${sha256})`)
  } finally {
    fs.rmSync(work, { recursive: true, force: true })
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  let abi = 'x86_64'
  let ndk
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === '--abi' && args[index + 1]) {
      abi = args[(index += 1)]
    } else if (args[index] === '--ndk' && args[index + 1]) {
      ndk = args[(index += 1)]
    } else if (args[index] === '--help') {
      console.log('Usage: node scripts/build-classic-level-android.cjs [--abi x86_64] [--ndk /path/to/ndk]')
      process.exit(0)
    } else {
      console.error(`Unknown argument: ${args[index]}`)
      process.exit(1)
    }
  }
  build(abi, ndk).catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}

module.exports = { ABIS, MIN_SDK, compileArguments, validate }
