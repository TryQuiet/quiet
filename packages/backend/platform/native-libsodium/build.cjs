#!/usr/bin/env node
'use strict'
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { createHash } = require('node:crypto')
const VERSION = '1.0.19'
const SHA256 = '018d79fe0a045cca07331d37bd0cb57b2e838c51bc48fd837a1472e50068bbea'
const MOBILE = path.resolve(__dirname, '../../../mobile')
const HEADERS = path.join(MOBILE, 'ios/NodeJsMobile/libnode/include/node')
const CACHE = path.join(__dirname, '.build')
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
function run(command, args, options = {}) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options }).trim()
}
async function sources() {
  fs.mkdirSync(CACHE, { recursive: true })
  const archive = path.join(CACHE, `libsodium-${VERSION}.tar.gz`)
  if (!fs.existsSync(archive)) {
    const response = await fetch(`https://download.libsodium.org/libsodium/releases/libsodium-${VERSION}.tar.gz`, { signal: AbortSignal.timeout(120000) })
    assert.ok(response.ok, `libsodium download: ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    assert.equal(hash(bytes), SHA256, 'libsodium source checksum')
    fs.writeFileSync(archive, bytes)
  }
  assert.equal(hash(fs.readFileSync(archive)), SHA256, 'libsodium source checksum')
  const work = fs.mkdtempSync(path.join(CACHE, 'source-'))
  run('tar', ['-xzf', archive, '--strip-components=1', '-C', work])
  return work
}
function compile(source, build, target) {
  fs.mkdirSync(build)
  const ios = target !== 'host'
  const apple = ios || process.platform === 'darwin'
  // Calling clang by its resolved path does not inherit xcrun's SDK selection.
  // macOS host builds need an explicit sysroot too, including on CI.
  const sdk = apple ? run('xcrun', ['--sdk', ios ? target : 'macosx', '--show-sdk-path']) : undefined
  const triple = `arm64-apple-ios17.1${target === 'iphonesimulator' ? '-simulator' : ''}`
  const flags = ios ? ['-target', triple, '-isysroot', sdk] : apple ? ['-isysroot', sdk] : []
  const cc = apple ? run('xcrun', ['--find', 'clang']) : (process.env.CC || 'cc')
  const env = { ...process.env, CC: cc, CFLAGS: [...flags, '-O2', '-fPIC', '-fvisibility=hidden'].join(' ') }
  // Use an out-of-tree build for each SDK; never reuse configure results across targets.
  console.log(`Compiling libsodium ${VERSION}: ${target}`)
  run(path.join(source, 'configure'), ['--disable-shared', '--enable-static', '--with-pic', '--disable-dependency-tracking', ...(ios ? ['--host=aarch64-apple-darwin'] : [])], { cwd: build, env })
  run('make', ['-j2'], { cwd: build, env })
  if (!ios) run('make', ['-j2', 'check'], { cwd: build, env })
  const binary = path.join(build, 'quiet_sodium.node')
  run(cc, [...flags, '-std=c11', '-O2', '-fPIC', '-fvisibility=hidden', '-Wall', '-Wextra', '-Werror', '-DNAPI_VERSION=8',
    '-I', HEADERS, '-I', path.join(source, 'src/libsodium/include'), '-I', path.join(source, 'src/libsodium/include/sodium'), '-I', path.join(build, 'src/libsodium/include'),
    path.join(__dirname, 'binding.c'), path.join(build, 'src/libsodium/.libs/libsodium.a'),
    ...(apple ? ['-dynamiclib', '-Wl,-undefined,dynamic_lookup', '-Wl,-exported_symbol,_napi_register_module_v1', '-Wl,-exported_symbol,_node_api_module_get_api_version_v1',
      '-Wl,-install_name,@rpath/QuietSodium.framework/QuietSodium'] : ['-shared', '-Wl,--exclude-libs,ALL', '-pthread']), '-o', binary])
  return binary
}
function plist(platform) {
  return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict>
<key>CFBundleExecutable</key><string>QuietSodium</string><key>CFBundleIdentifier</key><string>com.quiet.QuietSodium</string>
<key>CFBundleName</key><string>QuietSodium</string><key>CFBundlePackageType</key><string>FMWK</string>
<key>CFBundleInfoDictionaryVersion</key><string>6.0</string><key>CFBundleShortVersionString</key><string>${VERSION}</string>
<key>CFBundleVersion</key><string>1</string><key>MinimumOSVersion</key><string>17.1</string>
<key>CFBundleSupportedPlatforms</key><array><string>${platform === 'iphoneos' ? 'iPhoneOS' : 'iPhoneSimulator'}</string></array>
</dict></plist>\n`
}
async function build(target, output) {
  assert.ok(['host', 'ios'].includes(target), 'Use --host or --ios')
  if (target === 'ios') assert.equal(process.platform, 'darwin', 'iOS build requires macOS/Xcode')
  assert.ok(!fs.existsSync(output), `Output already exists: ${output}`)
  const source = await sources()
  const work = fs.mkdtempSync(path.join(CACHE, 'compile-'))
  try {
    const manifest = { libsodium: VERSION, sourceSha256: SHA256, napiVersion: 8, bindingSha256: hash(fs.readFileSync(path.join(__dirname, 'binding.c'))), builderSha256: hash(fs.readFileSync(__filename)), artifacts: {} }
    if (target === 'host') {
      const binary = compile(source, path.join(work, 'host'), 'host')
      fs.mkdirSync(output, { recursive: true })
      fs.copyFileSync(binary, path.join(output, 'quiet_sodium.node'))
      manifest.artifacts.host = {sha256: hash(fs.readFileSync(binary)), bytes: fs.statSync(binary).size}
    } else {
      const frameworks = []
      for (const sdk of ['iphoneos', 'iphonesimulator']) {
        const binary = compile(source, path.join(work, sdk), sdk)
        assert.equal(run('xcrun', ['lipo', '-archs', binary]), 'arm64')
        const info = run('xcrun', ['vtool', '-show-build', binary])
        assert.match(info, sdk === 'iphoneos' ? /platform IOS\s/ : /platform IOSSIMULATOR\s/)
        assert.match(run('xcrun', ['nm', '-gU', binary]), /_napi_register_module_v1/)
        const framework = path.join(work, sdk, 'QuietSodium.framework')
        fs.mkdirSync(framework)
        fs.copyFileSync(binary, path.join(framework, 'QuietSodium'))
        fs.writeFileSync(path.join(framework, 'Info.plist'), plist(sdk))
        frameworks.push(framework)
        manifest.artifacts[sdk] = { sha256: hash(fs.readFileSync(binary)), bytes: fs.statSync(binary).size, build: info, dependencies: run('xcrun', ['otool', '-L', binary]) }
      }
      fs.mkdirSync(output, { recursive: true })
      run('xcodebuild', ['-create-xcframework', ...frameworks.flatMap(file => ['-framework', file]), '-output', path.join(output, 'QuietSodium.xcframework')])
      manifest.xcode = run('xcodebuild', ['-version'])
    }
    fs.copyFileSync(path.join(source, 'LICENSE'), path.join(output, 'LICENSE.libsodium'))
    fs.writeFileSync(path.join(output, 'build-manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    console.log(`Created ${output}`)
  } finally {
    fs.rmSync(source, { recursive: true, force: true })
    fs.rmSync(work, { recursive: true, force: true })
  }
}
if (require.main === module) {
  const [flag, output] = process.argv.slice(2)
  if (!['--host', '--ios'].includes(flag) || !output) throw new Error('Usage: node build.cjs --host|--ios NEW_OUTPUT_DIRECTORY')
  build(flag.slice(2), path.resolve(output)).catch(error => { console.error(error.message, error.stderr?.toString() || ''); process.exitCode = 1 })
}
module.exports = { build, hash, SHA256, VERSION, plist }
