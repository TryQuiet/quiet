import fs from 'fs'
import path from 'path'

// GHSA-jr5w-w6x2-84p9: Electron's mitigation for the compromised eMudhra intermediate CA keys ships
// in the Electron binary (Chromium's root store and revocation data), so the only way to be covered is
// to run a patched Electron. The first patched release on each supported line:
const PATCHED = { 42: '42.11.16', 43: '43.8.1', 44: '44.9.1' } as const
const FIRST_PATCHED_MAJOR_45 = '45.0.0-beta.6'

const parse = (version: string) => {
  const [core, pre] = version.split('-')
  const [major, minor, patch] = core.split('.').map(Number)
  return { major, minor, patch, pre }
}

// Is `version` at or after `floor`? Prereleases sort before their release, which is all the 45 beta floor needs.
const atLeast = (version: string, floor: string) => {
  const v = parse(version)
  const f = parse(floor)
  for (const k of ['major', 'minor', 'patch'] as const) {
    if (v[k] !== f[k]) return v[k] > f[k]
  }
  if (!f.pre) return !v.pre
  if (!v.pre) return true
  const num = (p: string) => Number(p.split('.').pop())
  return num(v.pre) >= num(f.pre)
}

const isPatched = (version: string) => {
  const { major } = parse(version)
  if (major >= 46) return true
  if (major === 45) return atLeast(version, FIRST_PATCHED_MAJOR_45)
  const floor = PATCHED[major as keyof typeof PATCHED]
  return floor ? atLeast(version, floor) : false
}

describe('isPatched (eMudhra mitigation floor)', () => {
  it.each(['44.9.1', '44.9.3', '43.8.1', '42.11.16', '45.0.0-beta.6', '45.0.0', '46.0.0'])('accepts %s', v => {
    expect(isPatched(v)).toBe(true)
  })

  it.each(['44.3.0', '44.9.0', '43.8.0', '42.11.15', '45.0.0-beta.5', '41.0.0', '31.7.7'])('rejects %s', v => {
    expect(isPatched(v)).toBe(false)
  })
})

describe('Electron version', () => {
  const desktopRoot = path.resolve(__dirname, '../..')
  const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'))

  it('is pinned at or above the eMudhra mitigation release', () => {
    const declared = readJson(path.join(desktopRoot, 'package.json')).devDependencies.electron
    expect(declared).toMatch(/^\d+\.\d+\.\d+/)
    expect(isPatched(declared)).toBe(true)
  })

  it('locks a patched Electron', () => {
    const lock = readJson(path.join(desktopRoot, 'package-lock.json'))
    expect(isPatched(lock.packages['node_modules/electron'].version)).toBe(true)
  })

  it('has a patched Electron installed', () => {
    const installed = readJson(require.resolve('electron/package.json')).version
    expect(isPatched(installed)).toBe(true)
  })

  it('keeps the e2e ChromeDriver on the same Electron version as the app', () => {
    const declared = readJson(path.join(desktopRoot, 'package.json')).devDependencies.electron
    const e2e = readJson(path.join(desktopRoot, '../e2e-tests/package.json'))
    expect(e2e.devDependencies['electron-chromedriver'] ?? e2e.dependencies['electron-chromedriver']).toBe(declared)
  })
})
