import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { Checker, MINIMUM, TARGETS, compareVersions, embeddedVersions, main, torInFramework } from './check-tor-binaries.mjs'

const torString = version => `junk\0 (on Tor ${version} 8fe2745aee2c3511)\0junk`
const opensslString = version => `junk\0OpenSSL ${version} 29 Sep 2026\0junk`

const fixture = (t, { tor = MINIMUM.tor, openssl = MINIMUM.openssl, slices = 2, files = {} } = {}) => {
  const base = mkdtempSync(path.join(tmpdir(), 'quiet-tor-check-'))
  t.after(() => rmSync(base, { recursive: true, force: true }))
  const write = (file, content) => {
    mkdirSync(path.dirname(path.join(base, file)), { recursive: true })
    writeFileSync(path.join(base, file), content)
  }
  for (const target of TARGETS.filter(target => !target.optional)) {
    const copies = target.slices === 2 ? slices : target.slices
    write(
      target.file,
      Array.from({ length: copies }, () => `${target.tor ? torString(tor) : ''}${target.openssl ? opensslString(openssl) : ''}`).join('')
    )
  }
  write('packages/mobile/ios/Podfile', "pod 'Tor', podspec: 'https://raw.githubusercontent.com/iCepa/Tor.framework/v409.14.1/Tor.podspec'")
  write('packages/mobile/ios/Podfile.lock', 'PODS:\n  - Tor (409.14.1):\n    - Tor/CTor (= 409.14.1)\n')
  for (const [file, content] of Object.entries(files)) write(file, content)
  return base
}

const run = (base, method = 'repository') => {
  const checker = new Checker()
  checker[method](base, false)
  return checker.problems
}

test('versions compare numerically, not lexically', () => {
  assert.ok(compareVersions('0.4.9.14', '0.4.9.9') > 0)
  assert.ok(compareVersions('0.4.9.12', '0.4.9.14') < 0)
  assert.equal(compareVersions('3.5.9', '3.5.9'), 0)
  assert.equal(torInFramework('409.14.1'), '0.4.9.14')
})

test('extracts Tor and OpenSSL versions from a binary', t => {
  const base = fixture(t)
  assert.deepEqual(embeddedVersions(path.join(base, '3rd-party/tor/win32/tor.exe')), {
    tor: [MINIMUM.tor],
    openssl: [MINIMUM.openssl],
  })
})

test('accepts binaries at the baseline', t => {
  assert.deepEqual(run(fixture(t)), [])
})

test('rejects a Tor older than the baseline on every platform', t => {
  const problems = run(fixture(t, { tor: '0.4.9.12' }))
  for (const name of ['linux x86_64 tor', 'macOS universal', 'windows x86_64 tor.exe', 'android arm64-v8a']) {
    assert.ok(problems.some(problem => problem.startsWith(name) && problem.includes('0.4.9.12')), name)
  }
})

test('rejects an OpenSSL older than the baseline, including the library a Linux tor loads', t => {
  const problems = run(fixture(t, { openssl: '3.5.8' }))
  assert.ok(problems.some(problem => problem.startsWith('linux x86_64 libcrypto.so.3') && problem.includes('3.5.8')))
  assert.ok(problems.some(problem => problem.startsWith('android arm64-v8a') && problem.includes('3.5.8')))
})

test('rejects a macOS universal binary with a slice that carries no version', t => {
  const problems = run(fixture(t, { slices: 1 }))
  assert.ok(problems.some(problem => problem.startsWith('macOS universal') && problem.includes('2 slice')))
})

test('rejects a missing binary and a stale iOS pod', t => {
  const base = fixture(t, { files: { 'packages/mobile/ios/Podfile.lock': '  - Tor (409.11.2):\n' } })
  const problems = run(base)
  assert.ok(problems.some(problem => problem.includes('ios Tor.framework') && problem.includes('older')))
  assert.ok(problems.some(problem => problem.includes('Podfile pins 409.14.1 but Podfile.lock resolves 409.11.2')))
  assert.ok(new Checker().file(TARGETS[0], path.join(base, 'nowhere')) === undefined)
})

test('rejects OpenSSL 1.1 libraries wherever Quiet vendors or packages them', t => {
  const stale = ['3rd-party/tor/linux/libssl.so', '3rd-party/tor/linux/libssl.so.1.1', '3rd-party/tor/linux/libcrypto.so.1.1',
    '3rd-party/tor/win32/libssl-1_1-x64.dll', '3rd-party/tor/win32/libcrypto-1_1-x64.dll',
    'packages/desktop/libssl.so', 'packages/desktop/resources/libssl.so.1.1']
  const problems = run(fixture(t, { files: Object.fromEntries(stale.map(file => [file, 'x'])) }))
  assert.equal(problems.filter(problem => problem.includes('end-of-life OpenSSL 1.1')).length, stale.length)
})

test('checks a packaged tor directory', t => {
  const base = fixture(t, { files: { 'packaged/tor': torString(MINIMUM.tor) + opensslString(MINIMUM.openssl), 'packaged/libcrypto.so.3': opensslString('3.5.8') } })
  const checker = new Checker()
  checker.packaged(path.join(base, 'packaged'), false)
  assert.equal(checker.problems.length, 1)
  assert.match(checker.problems[0], /libcrypto\.so\.3: OpenSSL 3\.5\.8 is older than 3\.5\.9/)
})

test('the vendored binaries in this repository meet the baseline', () => {
  assert.equal(main(['--no-run']), 0)
})
