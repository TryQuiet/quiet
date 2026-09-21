import { spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const backendDirectory = fileURLToPath(new URL('../../../', import.meta.url))
const installer = path.join(backendDirectory, 'scripts/apply-gossipsub-patch.cjs')
const patchFile = path.join(backendDirectory, 'patch/libp2p/gossipsub-14.1.0.patch')
const manifestFile = path.join(backendDirectory, 'patch/libp2p/gossipsub-14.1.0.json')
const installedPackage = path.join(backendDirectory, 'node_modules/@chainsafe/libp2p-gossipsub')

/** Exercise installation against copies of the actual pinned package, never shared dependencies. */
describe('Required gossipsub runtime patch installation', () => {
  let temporaryDirectory: string
  let pristineDirectory: string
  let patchedDirectory: string
  let packageDirectory: string
  let targets: string[]

  const snapshot = async (directory: string) => {
    const entries = await Promise.all(
      ['package.json', ...targets].map(async name => [name, await readFile(path.join(directory, name), 'utf8')])
    )
    return Object.fromEntries(entries)
  }

  const copyPackage = async (source: string, destination: string) => {
    for (const name of ['package.json', ...targets]) {
      const target = path.join(destination, name)
      await mkdir(path.dirname(target), { recursive: true })
      await cp(path.join(source, name), target)
    }
  }

  const runPatch = (directory: string, ...options: string[]) =>
    spawnSync('patch', ['--batch', '--silent', '-p1', '-i', patchFile, ...options], {
      cwd: directory,
      encoding: 'utf8',
    })

  const applyInstaller = (directory: string) =>
    spawnSync(process.execPath, [installer, directory], { encoding: 'utf8' })

  beforeAll(async () => {
    const diff = await readFile(patchFile, 'utf8')
    targets = [...diff.matchAll(/^\+\+\+ b\/([^\t\r\n]+)/gm)].map(match => match[1])
    expect(targets.length).toBeGreaterThan(0)
    expect(targets.some(name => name.startsWith('dist/') && name.endsWith('.js'))).toBe(true)

    // macOS exposes /var through /private/var; use the real temporary root so
    // the shared-dependency guard tests package links, not OS path aliases.
    temporaryDirectory = await realpath(await mkdtemp(path.join(tmpdir(), 'quiet-gossipsub-patch-')))
    pristineDirectory = path.join(temporaryDirectory, 'pristine')
    patchedDirectory = path.join(temporaryDirectory, 'reference-patched')
    await copyPackage(installedPackage, pristineDirectory)
    expect(JSON.parse(await readFile(path.join(pristineDirectory, 'package.json'), 'utf8')).version).toBe('14.1.0')

    // Postinstall normally leaves the real package patched. Recover its actual
    // pristine files with the standard patch tool; also support a pristine
    // development install. Neither path invents a synthetic package fixture.
    if (runPatch(pristineDirectory, '--dry-run', '-R').status === 0) {
      const reverse = runPatch(pristineDirectory, '-R')
      expect({ status: reverse.status, error: reverse.stderr }).toEqual({ status: 0, error: '' })
    } else {
      expect(runPatch(pristineDirectory, '--dry-run', '--forward').status).toBe(0)
    }
    await copyPackage(pristineDirectory, patchedDirectory)
    const reference = runPatch(patchedDirectory, '--forward')
    expect({ status: reference.status, error: reference.stderr }).toEqual({ status: 0, error: '' })
  })

  beforeEach(async () => {
    packageDirectory = await mkdtemp(path.join(temporaryDirectory, 'installation-'))
    await copyPackage(pristineDirectory, packageDirectory)
  })

  afterAll(async () => {
    if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true })
  })

  it('applies the approved patch to the real pristine package and is idempotent', async () => {
    const first = applyInstaller(packageDirectory)
    expect({ status: first.status, error: first.stderr }).toEqual({ status: 0, error: '' })
    const patched = await snapshot(packageDirectory)
    expect(patched).toEqual(await snapshot(patchedDirectory))
    expect(patched).not.toEqual(await snapshot(pristineDirectory))

    const repeated = applyInstaller(packageDirectory)
    expect({ status: repeated.status, error: repeated.stderr }).toEqual({ status: 0, error: '' })
    expect(await snapshot(packageDirectory)).toEqual(patched)
  })

  it('rejects a different package version without modifying any files', async () => {
    const metadata = JSON.parse(await readFile(path.join(packageDirectory, 'package.json'), 'utf8'))
    metadata.version = '14.1.1'
    await writeFile(path.join(packageDirectory, 'package.json'), JSON.stringify(metadata))
    const before = await snapshot(packageDirectory)

    expect(applyInstaller(packageDirectory).status).not.toBe(0)
    expect(await snapshot(packageDirectory)).toEqual(before)
  })

  it('validates every source and runtime file before writing to an unexpected layout', async () => {
    const lastTarget = path.join(packageDirectory, targets[targets.length - 1])
    await writeFile(lastTarget, `${await readFile(lastTarget, 'utf8')}\n// unexpected installed contents\n`)
    const before = await snapshot(packageDirectory)

    expect(applyInstaller(packageDirectory).status).not.toBe(0)
    expect(await snapshot(packageDirectory)).toEqual(before)
  })

  it('rejects an incomplete prior patch without altering the remaining files', async () => {
    expect(targets.length).toBeGreaterThan(1)
    await cp(path.join(patchedDirectory, targets[0]), path.join(packageDirectory, targets[0]))
    const before = await snapshot(packageDirectory)

    expect(applyInstaller(packageDirectory).status).not.toBe(0)
    expect(await snapshot(packageDirectory)).toEqual(before)
  })

  it('accepts an explicit private copy beneath an aliased parent directory', async () => {
    const realParent = await mkdtemp(path.join(temporaryDirectory, 'private-parent-'))
    const realPackage = path.join(realParent, 'package')
    const parentAlias = `${realParent}-alias`
    await copyPackage(pristineDirectory, realPackage)
    await symlink(realParent, parentAlias, 'junction')

    const result = applyInstaller(path.join(parentAlias, 'package'))
    expect({ status: result.status, error: result.stderr }).toEqual({ status: 0, error: '' })
    expect(await snapshot(realPackage)).toEqual(await snapshot(patchedDirectory))
  })

  it('refuses to patch a shared dependency through the default package symlink', async () => {
    const fakeBackend = path.join(temporaryDirectory, 'backend-with-shared-dependency')
    const fakeScript = path.join(fakeBackend, 'scripts/apply-gossipsub-patch.cjs')
    const fakePatchDirectory = path.join(fakeBackend, 'patch/libp2p')
    const packageLink = path.join(fakeBackend, 'node_modules/@chainsafe/libp2p-gossipsub')
    await mkdir(path.dirname(fakeScript), { recursive: true })
    await mkdir(fakePatchDirectory, { recursive: true })
    await mkdir(path.dirname(packageLink), { recursive: true })
    await cp(installer, fakeScript)
    await cp(patchFile, path.join(fakePatchDirectory, path.basename(patchFile)))
    await cp(manifestFile, path.join(fakePatchDirectory, path.basename(manifestFile)))
    await symlink(packageDirectory, packageLink, 'junction')
    const before = await snapshot(packageDirectory)

    const result = spawnSync(process.execPath, [fakeScript], { encoding: 'utf8' })
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('symlink')
    expect(await snapshot(packageDirectory)).toEqual(before)
  })
})
