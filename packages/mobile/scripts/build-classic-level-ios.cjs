#!/usr/bin/env node
// See README_classic_level_ios.md. This creates an artifact; it never edits the Xcode project.
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const MOBILE_ROOT = path.resolve(__dirname, '..')
const NODE_HEADERS = path.join(MOBILE_ROOT, 'ios/NodeJsMobile/libnode/include/node')
const DEVICE_FRAMEWORK = path.join(MOBILE_ROOT, 'ios/classic-level.framework')
const MINIMUM_IOS = '17.1'
const PACKAGES = [
  {
    name: 'classic-level',
    version: '1.4.1',
    integrity: 'sha512-qGx/KJl3bvtOHrGau2WklEZuXhS3zme+jf+fsu6Ej7W7IP/C49v7KNlWIsT1jZu0YnfzSIYDGcEWpCa1wKGWXQ==',
  },
  {
    name: 'napi-macros',
    version: '2.2.2',
    integrity: 'sha512-hmEVtAGYzVQpCKdbQea4skABsdXW4RUh5t5mJ2zzqowJS2OyXZTU1KhDVFhx+NlWZ4ap9mqR9TcDO3LTTttd+g==',
  },
]

// Sources from the pinned binding.gyp, leveldb.gyp and snappy.gyp, selecting their POSIX/iOS branches.
const LEVELDB_SOURCES = [
  'db/builder.cc',
  'db/db_impl.cc',
  'db/db_iter.cc',
  'db/filename.cc',
  'db/dbformat.cc',
  'db/log_reader.cc',
  'db/log_writer.cc',
  'db/memtable.cc',
  'db/repair.cc',
  'db/table_cache.cc',
  'db/version_edit.cc',
  'db/version_set.cc',
  'db/write_batch.cc',
  'helpers/memenv/memenv.cc',
  'port/port_posix.cc',
  'port/port_posix_sse.cc',
  'table/block.cc',
  'table/block_builder.cc',
  'table/filter_block.cc',
  'table/format.cc',
  'table/iterator.cc',
  'table/merger.cc',
  'table/table.cc',
  'table/table_builder.cc',
  'table/two_level_iterator.cc',
  'util/arena.cc',
  'util/bloom.cc',
  'util/cache.cc',
  'util/coding.cc',
  'util/comparator.cc',
  'util/crc32c.cc',
  'util/env.cc',
  'util/env_posix.cc',
  'util/filter_policy.cc',
  'util/hash.cc',
  'util/logging.cc',
  'util/options.cc',
  'util/status.cc',
]
const SNAPPY_SOURCES = ['snappy-sinksource.cc', 'snappy-stubs-internal.cc', 'snappy.cc']

function run(command, args) {
  return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim()
}

function digest(bytes, algorithm = 'sha256', encoding = 'hex') {
  return crypto.createHash(algorithm).update(bytes).digest(encoding)
}

function verifyArchive(bytes, integrity) {
  assert.equal(`sha512-${digest(bytes, 'sha512', 'base64')}`, integrity, 'Downloaded source integrity mismatch')
}

async function downloadSources(directory) {
  for (const pkg of PACKAGES) {
    const response = await fetch(`https://registry.npmjs.org/${pkg.name}/-/${pkg.name}-${pkg.version}.tgz`, {
      signal: AbortSignal.timeout(120_000),
    })
    assert.ok(response.ok, `Downloading ${pkg.name}: HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    verifyArchive(bytes, pkg.integrity)
    const archive = path.join(directory, `${pkg.name}.tgz`)
    const destination = path.join(directory, pkg.name)
    fs.writeFileSync(archive, bytes)
    fs.mkdirSync(destination)
    run('tar', ['-xzf', archive, '--strip-components=1', '-C', destination])
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8')).version, pkg.version)
  }
  return { classicLevel: path.join(directory, 'classic-level'), napiMacros: path.join(directory, 'napi-macros') }
}

function sourceFiles(classicLevel) {
  return [
    path.join(classicLevel, 'binding.cc'),
    ...LEVELDB_SOURCES.map(file => path.join(classicLevel, 'deps/leveldb/leveldb-1.20', file)),
    ...SNAPPY_SOURCES.map(file => path.join(classicLevel, 'deps/snappy/snappy', file)),
  ]
}

function compileArguments({ classicLevel, napiMacros }, platform) {
  assert.ok(['ios', 'mac', 'linux'].includes(platform), `Unsupported platform: ${platform}`)
  const leveldb = path.join(classicLevel, 'deps/leveldb/leveldb-1.20')
  const includes = [
    NODE_HEADERS,
    napiMacros,
    leveldb,
    path.join(leveldb, 'include'),
    path.join(leveldb, 'port'),
    path.join(leveldb, 'util'),
    path.join(classicLevel, 'deps/snappy', platform === 'linux' ? 'linux' : 'mac'),
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
    '-DNDEBUG',
    '-DBUILDING_NODE_EXTENSION',
    '-DNODE_GYP_MODULE_NAME=classic_level',
    '-DLEVELDB_PLATFORM_POSIX=1',
    '-DSNAPPY=1',
    '-DHAVE_CONFIG_H=1',
    `-DOS_${platform === 'mac' ? 'MACOSX' : platform.toUpperCase()}=1`,
    ...includes.flatMap(directory => ['-I', directory]),
    ...sourceFiles(classicLevel),
  ]
}

// Check every file, not just the dylib: Xcode must package the existing device framework unchanged.
function snapshotTree(directory) {
  const result = {}
  function visit(relative) {
    for (const name of fs.readdirSync(path.join(directory, relative)).sort()) {
      const entry = path.join(relative, name)
      const filename = path.join(directory, entry)
      const stat = fs.lstatSync(filename)
      if (stat.isSymbolicLink()) result[entry] = `symlink:${fs.readlinkSync(filename)}`
      else if (stat.isDirectory()) visit(entry)
      else result[entry] = digest(fs.readFileSync(filename))
    }
  }
  visit('')
  return result
}

function assertTreeUnchanged(directory, expected) {
  assert.deepEqual(snapshotTree(directory), expected, `Framework contents changed: ${directory}`)
}

function validateOutput(output) {
  assert.ok(!fs.existsSync(output), `Output already exists: ${output}`)
  // Resolve the existing parent first so a symlink cannot place the artifact inside an input.
  const canonical = path.join(fs.realpathSync(path.dirname(output)), path.basename(output))
  for (const input of [DEVICE_FRAMEWORK, NODE_HEADERS]) {
    const relative = path.relative(fs.realpathSync(input), canonical)
    const outside = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)
    assert.ok(outside, `Output must be outside the input framework and Node headers: ${output}`)
  }
  return canonical
}

function simulatorPlist() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleExecutable</key><string>classic-level</string>
  <key>CFBundleIdentifier</key><string>com.janeasystems.classic-level</string>
  <key>CFBundleName</key><string>classic-level</string>
  <key>CFBundlePackageType</key><string>FMWK</string>
  <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
  <key>CFBundleShortVersionString</key><string>1.4.1</string>
  <key>CFBundleVersion</key><string>1</string>
  <key>CFBundleSupportedPlatforms</key><array><string>iPhoneSimulator</string></array>
  <key>DTPlatformName</key><string>iphonesimulator</string>
  <key>MinimumOSVersion</key><string>${MINIMUM_IOS}</string>
</dict></plist>
`
}

async function build(output) {
  assert.equal(process.platform, 'darwin', 'Building iOS slices requires macOS and a full Xcode installation')
  output = validateOutput(output)
  const versionHeader = fs.readFileSync(path.join(NODE_HEADERS, 'node_version.h'), 'utf8')
  for (const [part, value] of [
    ['MAJOR', 18],
    ['MINOR', 20],
    ['PATCH', 4],
  ]) {
    assert.match(
      versionHeader,
      new RegExp(`#define NODE_${part}_VERSION\\s+${value}\\b`),
      'Expected vendored Node 18.20.4 headers'
    )
  }
  const deviceSnapshot = snapshotTree(DEVICE_FRAMEWORK)
  const deviceBinary = path.join(DEVICE_FRAMEWORK, 'classic-level')
  assert.equal(run('xcrun', ['lipo', '-archs', deviceBinary]), 'arm64', 'Expected the existing arm64 device framework')
  const deviceLoadCommands = run('xcrun', ['otool', '-l', deviceBinary])
  const sdk = run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-path'])
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-classic-level-ios-'))
  try {
    const sources = await downloadSources(work)
    const simulatorFramework = path.join(work, 'simulator/classic-level.framework')
    fs.mkdirSync(simulatorFramework, { recursive: true })
    const architectures = ['arm64', 'x86_64']
    const slices = []
    for (const architecture of architectures) {
      const binary = path.join(work, `classic-level-${architecture}`)
      const target = `${architecture}-apple-ios${MINIMUM_IOS}-simulator`
      console.log(`Building classic-level 1.4.1 for ${target}`)
      // Node's dlopen resolves N-API symbols from the already-loaded NodeMobile framework.
      // Node 18 uses napi_register_module_v1; do not add constructor registration or link another Node.
      run('xcrun', [
        '--sdk',
        'iphonesimulator',
        'clang++',
        '-target',
        target,
        '-isysroot',
        sdk,
        ...compileArguments(sources, 'ios'),
        '-dynamiclib',
        '-Wl,-undefined,dynamic_lookup',
        '-Wl,-install_name,@rpath/classic-level.framework/classic-level',
        '-o',
        binary,
      ])
      assert.equal(run('xcrun', ['lipo', '-archs', binary]), architecture)
      const buildVersion = run('xcrun', ['vtool', '-show-build', binary])
      assert.match(buildVersion, /platform IOSSIMULATOR/, 'Compiler must produce an iOS simulator binary')
      const exports = run('xcrun', ['nm', '-gU', binary])
      assert.match(exports, /\b_napi_register_module_v1\b/, 'Missing Node-API initializer')
      assert.match(exports, /\b_node_api_module_get_api_version_v1\b/, 'Missing Node-API version export')
      slices.push({ architecture, target, sha256: digest(fs.readFileSync(binary)), buildVersion })
    }
    run('xcrun', [
      'lipo',
      '-create',
      ...architectures.map(arch => path.join(work, `classic-level-${arch}`)),
      '-output',
      path.join(simulatorFramework, 'classic-level'),
    ])
    fs.writeFileSync(path.join(simulatorFramework, 'Info.plist'), simulatorPlist())
    const artifact = path.join(work, 'artifact')
    fs.mkdirSync(artifact)
    const xcframework = path.join(artifact, 'classic-level.xcframework')
    run('xcodebuild', [
      '-create-xcframework',
      '-framework',
      DEVICE_FRAMEWORK,
      '-framework',
      simulatorFramework,
      '-output',
      xcframework,
    ])
    const info = JSON.parse(run('plutil', ['-convert', 'json', '-o', '-', path.join(xcframework, 'Info.plist')]))
    const device = info.AvailableLibraries.find(
      library => library.SupportedPlatform === 'ios' && !library.SupportedPlatformVariant
    )
    const simulator = info.AvailableLibraries.find(library => library.SupportedPlatformVariant === 'simulator')
    assert.ok(device && simulator, 'XCFramework must contain separate device and simulator variants')
    assert.deepEqual([...simulator.SupportedArchitectures].sort(), [...architectures].sort())
    assertTreeUnchanged(path.join(xcframework, device.LibraryIdentifier, device.LibraryPath), deviceSnapshot)
    assertTreeUnchanged(DEVICE_FRAMEWORK, deviceSnapshot)
    const licenses = path.join(artifact, 'licenses')
    fs.mkdirSync(licenses)
    for (const [source, destination] of [
      [path.join(sources.classicLevel, 'LICENSE'), 'classic-level.txt'],
      [path.join(sources.classicLevel, 'deps/leveldb/leveldb-1.20/LICENSE'), 'leveldb.txt'],
      [path.join(sources.classicLevel, 'deps/snappy/snappy/COPYING'), 'snappy.txt'],
      [path.join(sources.napiMacros, 'LICENSE'), 'napi-macros.txt'],
    ])
      fs.copyFileSync(source, path.join(licenses, destination))
    fs.writeFileSync(
      path.join(artifact, 'build-manifest.json'),
      `${JSON.stringify(
        {
          packages: PACKAGES,
          nodeVersion: '18.20.4',
          nodeHeaders: snapshotTree(NODE_HEADERS),
          xcode: run('xcodebuild', ['-version']),
          compiler: run('xcrun', ['clang++', '--version']),
          sdk: run('xcrun', ['--sdk', 'iphonesimulator', '--show-sdk-version']),
          minimumIOS: MINIMUM_IOS,
          deviceFramework: deviceSnapshot,
          deviceLoadCommands,
          simulatorSlices: slices,
          simulatorDependencies: run('xcrun', ['otool', '-L', path.join(simulatorFramework, 'classic-level')]),
        },
        null,
        2
      )}\n`
    )
    // Reserve the requested destination without overwriting any prior result.
    fs.mkdirSync(output)
    fs.cpSync(artifact, output, { recursive: true, errorOnExist: true, force: false })
    console.log(`Created ${path.join(output, 'classic-level.xcframework')}`)
  } finally {
    fs.rmSync(work, { recursive: true, force: true })
  }
}

if (require.main === module) {
  const args = process.argv.slice(2)
  if (args.length === 1 && args[0] === '--help') {
    console.log('Usage: node scripts/build-classic-level-ios.cjs --output /absolute/new/artifact-directory')
  } else if (args.length === 2 && args[0] === '--output') {
    build(path.resolve(args[1])).catch(error => {
      console.error(error.message)
      process.exitCode = 1
    })
  } else {
    console.error('Expected --output <new directory>; see --help and README_classic_level_ios.md')
    process.exitCode = 1
  }
}

module.exports = {
  NODE_HEADERS,
  PACKAGES,
  verifyArchive,
  downloadSources,
  sourceFiles,
  compileArguments,
  snapshotTree,
  assertTreeUnchanged,
  validateOutput,
}
