// Fails when a lockfile resolves a vulnerable `ws` or `socket.io-parser` in its production dependency tree.
//   ws:               GHSA-96hv-2xvq-fx4p / CVE-2026-48779
//   socket.io-parser: CVE-2026-33151, CVE-2026-69185
//   engine.io:        CVE-2026-102599 (6.6.10)
// Only entries npm does not mark `dev: true` count. Tooling copies (Storybook, webpack-dev-server, jest, the
// orbitdb submodule's own devDependencies, packages/e2e-tests and the Appium lockfile) are not shipped, so they
// are not checked.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

// A version is patched when it is >= the floor of its own major line (ws backported the fix to 6.x and 7.x), or
// when its major is newer than every line listed here.
export const PATCHED_FLOORS = {
  ws: ['6.2.4', '7.5.11', '8.21.0'],
  'socket.io-parser': ['4.2.7'],
  'engine.io': ['6.6.10'],
}

export const CHECKED_LOCKFILES = [
  'packages/backend/package-lock.json',
  'packages/desktop/package-lock.json',
  'packages/mobile/package-lock.json',
  'packages/state-manager/package-lock.json',
]

const parse = version => {
  const [core, prerelease] = version.split('-', 2)
  return { numbers: core.split('.').map(Number), prerelease: prerelease !== undefined }
}

const compare = (a, b) => {
  const left = parse(a)
  const right = parse(b)
  for (let index = 0; index < 3; index += 1) {
    const difference = (left.numbers[index] ?? 0) - (right.numbers[index] ?? 0)
    if (difference !== 0) return difference
  }
  return Number(right.prerelease) - Number(left.prerelease)
}

export const isPatched = (name, version) => {
  const floors = PATCHED_FLOORS[name]
  const { numbers } = parse(version)
  const line = floors.find(floor => parse(floor).numbers[0] === numbers[0])
  if (line) return compare(version, line) >= 0
  return numbers[0] > Math.max(...floors.map(floor => parse(floor).numbers[0]))
}

export const findViolations = (lockfile, lockfilePath = 'package-lock.json') => {
  if (!lockfile.packages) throw new Error(`${lockfilePath}: no "packages" section (lockfileVersion >= 2 required)`)
  const violations = []
  for (const [location, entry] of Object.entries(lockfile.packages)) {
    const name = location.split('node_modules/').pop()
    if (!(name in PATCHED_FLOORS) || entry.dev || entry.link || !entry.version) continue
    if (isPatched(name, entry.version)) continue
    violations.push({ lockfile: lockfilePath, location, name, version: entry.version })
  }
  return violations
}

const main = async () => {
  const root = new URL('../', import.meta.url)
  const violations = []
  for (const path of CHECKED_LOCKFILES) {
    const lockfile = JSON.parse(await readFile(new URL(path, root), 'utf8'))
    violations.push(...findViolations(lockfile, path))
  }
  if (violations.length === 0) {
    console.log(`Runtime dependency floors OK in ${CHECKED_LOCKFILES.length} lockfiles`)
    return
  }
  for (const v of violations) {
    const floors = PATCHED_FLOORS[v.name].join(' / ')
    console.error(`${v.lockfile}: ${v.name}@${v.version} at ${v.location} is below the patched floor (${floors})`)
  }
  process.exitCode = 1
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main()
