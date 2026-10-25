#!/usr/bin/env node
// Fails when a Tor binary Quiet ships is older than the supported baseline, was built against an
// older OpenSSL, or when an end-of-life OpenSSL 1.1 library is vendored again.
//
//   npm run check:tor-binaries                           every vendored binary, plus a run of the one for this OS
//   node scripts/check-tor-binaries.mjs --no-run         static checks only
//   node scripts/check-tor-binaries.mjs --tor-dir <dir>  one packaged tor directory (e.g. resources/tor of a built app)
//
// Raise MINIMUM when scripts/update-tor-binaries-desktop.sh moves to a newer Tor Browser.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const MINIMUM = { tor: '0.4.9.14', openssl: '3.5.9', torFramework: '409.14.1' }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Tor.framework is versioned "<4, tor minor><tor patch>.<wrapper release>": 409.14.1 wraps Tor 0.4.9.14.
export const torInFramework = framework => {
  const [major, patch] = framework.split('.').map(Number)
  return `0.4.${major - 400}.${patch}`
}

export const compareVersions = (a, b) => {
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const delta = (left[i] ?? 0) - (right[i] ?? 0)
    if (delta !== 0) return delta
  }
  return 0
}

const TOR = /\(on Tor (\d+\.\d+\.\d+\.\d+) [0-9a-f]{16}\)/g
const OPENSSL = /OpenSSL (\d+\.\d+\.\d+) +\d{1,2} \w{3} \d{4}/g

/** Versions embedded in a binary: one entry per architecture slice that carries the string. */
export const embeddedVersions = file => {
  const text = readFileSync(file).toString('latin1')
  const all = pattern => [...text.matchAll(pattern)].map(match => match[1])
  return { tor: all(TOR), openssl: all(OPENSSL) }
}

// A dynamically linked Linux tor takes its OpenSSL from the libcrypto beside it, so that file is measured too.
// x86_64 Android is not committed (scripts/fetch-android-tor.sh installs it for emulators), so it is checked when present.
export const TARGETS = [
  { name: 'linux x86_64 tor', file: '3rd-party/tor/linux/tor', slices: 1, tor: true },
  { name: 'linux x86_64 libcrypto.so.3', file: '3rd-party/tor/linux/libcrypto.so.3', slices: 1, openssl: true },
  { name: 'macOS universal tor (x86_64, arm64)', file: '3rd-party/tor/darwin/tor', slices: 2, tor: true, openssl: true },
  { name: 'windows x86_64 tor.exe', file: '3rd-party/tor/win32/tor.exe', slices: 1, tor: true, openssl: true },
  { name: 'android arm64-v8a libtor.so', file: 'packages/mobile/android/app/src/main/jniLibs/arm64-v8a/libtor.so', slices: 1, tor: true, openssl: true },
  { name: 'android x86_64 libtor.so', file: 'packages/mobile/android/app/src/main/jniLibs/x86_64/libtor.so', slices: 1, tor: true, openssl: true, optional: true },
]

// OpenSSL 1.1 is end of life. Tor 0.4.9 links OpenSSL 3, and nothing else Quiet ships loads these.
const STALE_LIBRARY = /^(libssl|libcrypto)(-1_1-x64\.dll|\.so(\.1\.1)?)$/
const STALE_DIRECTORIES = ['3rd-party/tor/linux', '3rd-party/tor/win32', 'packages/desktop', 'packages/desktop/resources']

export class Checker {
  problems = []
  report = []

  fail(message) {
    this.problems.push(message)
  }

  version(label, kind, versions, slices, minimum) {
    if (versions.length < slices) this.fail(`${label}: expected ${kind} version string in each of ${slices} slice(s), found ${versions.length}`)
    for (const version of versions) {
      if (compareVersions(version, minimum) < 0) this.fail(`${label}: ${kind} ${version} is older than ${minimum}`)
    }
  }

  file(target, base = root) {
    const file = path.join(base, target.file)
    if (!existsSync(file)) return target.optional ? undefined : this.fail(`${target.name}: ${target.file} is missing`)
    const versions = embeddedVersions(file)
    if (target.tor) this.version(target.name, 'tor', versions.tor, target.slices, MINIMUM.tor)
    if (target.openssl) this.version(target.name, 'OpenSSL', versions.openssl, target.slices, MINIMUM.openssl)
    this.report.push(`${target.name}: tor ${versions.tor.join(',') || '-'}  openssl ${versions.openssl.join(',') || '-'}`)
  }

  noStaleLibraries(directory, label) {
    if (!existsSync(directory)) return
    for (const name of readdirSync(directory)) {
      if (STALE_LIBRARY.test(name)) this.fail(`${label}: end-of-life OpenSSL 1.1 library ${name} must not be shipped`)
    }
  }

  /** Runs the binary and checks what it reports, which is what the dynamic loader really picked. */
  executes(label, file, libraryDirectory) {
    let output
    try {
      const env = { ...process.env, LD_LIBRARY_PATH: libraryDirectory, DYLD_LIBRARY_PATH: libraryDirectory }
      output = execFileSync(file, ['--version'], { env, encoding: 'utf8', timeout: 30_000 })
    } catch (error) {
      return this.fail(`${label}: could not run ${file}: ${String(error.message).split('\n')[0]}`)
    }
    const tor = output.match(/Tor version (\d+\.\d+\.\d+\.\d+)/)?.[1]
    const openssl = output.match(/OpenSSL (\d+\.\d+\.\d+)/)?.[1]
    if (!tor || compareVersions(tor, MINIMUM.tor) < 0) this.fail(`${label}: running binary reports Tor ${tor}`)
    if (!openssl || compareVersions(openssl, MINIMUM.openssl) < 0) this.fail(`${label}: running binary loaded OpenSSL ${openssl}`)
    this.report.push(`${label} (executed): tor ${tor}  openssl ${openssl}`)
  }

  /** iOS takes Tor from the Tor.framework pod, so the pinned pod must bundle the baseline Tor. */
  ios(base = root) {
    const lock = readFileSync(path.join(base, 'packages/mobile/ios/Podfile.lock'), 'utf8')
    const podfile = readFileSync(path.join(base, 'packages/mobile/ios/Podfile'), 'utf8')
    const locked = lock.match(/^ {2}- Tor \((\d+\.\d+\.\d+)\):$/m)?.[1]
    const pinned = podfile.match(/iCepa\/Tor\.framework\/v(\d+\.\d+\.\d+)\/Tor\.podspec/)?.[1]
    if (!locked) return this.fail('ios Tor.framework: not found in Podfile.lock')
    if (pinned !== locked) this.fail(`ios Tor.framework: Podfile pins ${pinned} but Podfile.lock resolves ${locked}`)
    if (compareVersions(locked, MINIMUM.torFramework) < 0) {
      this.fail(`ios Tor.framework ${locked} (Tor ${torInFramework(locked)}) is older than ${MINIMUM.torFramework} (Tor ${MINIMUM.tor})`)
    }
    this.report.push(`ios Tor.framework ${locked}: tor ${torInFramework(locked)}`)
  }

  repository(base = root, run = true) {
    for (const target of TARGETS) this.file(target, base)
    for (const directory of STALE_DIRECTORIES) this.noStaleLibraries(path.join(base, directory), directory)
    this.ios(base)
    const host = { linux: ['3rd-party/tor/linux', 'tor'], win32: ['3rd-party/tor/win32', 'tor.exe'], darwin: ['3rd-party/tor/darwin', 'tor'] }[process.platform]
    if (run && host && (process.arch === 'x64' || process.platform === 'darwin')) {
      this.executes(`${process.platform}-${process.arch} tor`, path.join(base, ...host), path.join(base, host[0]))
    }
  }

  packaged(directory, run = true) {
    const executable = ['tor', 'tor.exe'].find(name => existsSync(path.join(directory, name)))
    if (!executable) return this.fail(`${directory}: no tor or tor.exe found`)
    const label = `packaged ${executable}`
    const versions = embeddedVersions(path.join(directory, executable))
    this.version(label, 'tor', versions.tor, Math.max(versions.tor.length, 1), MINIMUM.tor)
    this.version(label, 'OpenSSL', versions.openssl, Math.max(versions.openssl.length, 1), MINIMUM.openssl)
    if (existsSync(path.join(directory, 'libcrypto.so.3'))) {
      const libcrypto = embeddedVersions(path.join(directory, 'libcrypto.so.3')).openssl
      this.version('packaged libcrypto.so.3', 'OpenSSL', libcrypto, 1, MINIMUM.openssl)
    }
    this.noStaleLibraries(directory, directory)
    this.report.push(`${label}: tor ${versions.tor.join(',')}  openssl ${versions.openssl.join(',') || '-'}`)
    const runnable = executable === 'tor.exe' ? process.platform === 'win32' : process.platform !== 'win32'
    if (run && runnable) this.executes(label, path.join(directory, executable), directory)
  }
}

export const main = (argv = process.argv.slice(2)) => {
  const run = !argv.includes('--no-run')
  const checker = new Checker()
  const index = argv.indexOf('--tor-dir')
  if (index === -1) checker.repository(root, run)
  else checker.packaged(path.resolve(argv[index + 1] ?? ''), run)
  for (const line of checker.report) console.log(`ok    ${line}`)
  for (const message of checker.problems) console.error(`FAIL  ${message}`)
  if (checker.problems.length) {
    console.error(`\nBaseline is tor >= ${MINIMUM.tor} with OpenSSL >= ${MINIMUM.openssl}. Refresh with scripts/update-tor-binaries-desktop.sh.`)
    return 1
  }
  console.log(`\nAll Tor binaries meet tor >= ${MINIMUM.tor}, OpenSSL >= ${MINIMUM.openssl}`)
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main()
