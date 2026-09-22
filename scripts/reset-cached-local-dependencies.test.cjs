const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { test } = require('node:test')
const yaml = require('js-yaml')
const { resetCachedLocalDependencies } = require('./reset-cached-local-dependencies.cjs')

const root = path.resolve(__dirname, '..')
const tsc = require.resolve('typescript/bin/tsc')
const lerna = require.resolve('lerna/cli')
const write = (file, text) => {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, text)
}

for (const cacheKind of ['junction', 'copy', 'dangling junction']) {
  test(`rebuilds a real file dependency after restoring a stale ${cacheKind}`, t => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-local-dependency-'))
    t.after(() => fs.rmSync(fixture, { recursive: true, force: true }))
    const pkg = path.join(fixture, 'packages/types')
    const target = path.join(fixture, '3rd-party/auth/packages/crdx/dist')
    const installed = path.join(pkg, 'node_modules/@localfirst/crdx')
    const oldTarget = path.join(fixture, 'previous-checkout/crdx/dist')
    write(path.join(fixture, 'package.json'), JSON.stringify({ name: 'fixture', private: true }))
    write(path.join(fixture, 'lerna.json'), JSON.stringify({
      version: '1.0.0', packages: ['packages/*'], command: { bootstrap: { hoist: ['eslint*'] } },
    }))
    write(path.join(pkg, 'package.json'), JSON.stringify({
      name: '@quiet/types', version: '1.0.0', private: true,
      dependencies: { '@localfirst/crdx': 'file:../../3rd-party/auth/packages/crdx/dist' },
      scripts: { prepare: 'node compile.cjs' },
    }))
    write(path.join(pkg, 'compile.cjs'), `require(${JSON.stringify(tsc)})`)
    write(path.join(pkg, 'tsconfig.json'), JSON.stringify({
      compilerOptions: { moduleResolution: 'node', types: [], declaration: true, outDir: 'lib' }, include: ['src'],
    }))
    write(path.join(pkg, 'src/index.ts'), "import { Keyset } from '@localfirst/crdx'; export const key: Keyset = { name: 'current' };\n")
    write(path.join(target, 'index.js'), 'export const current = true;\n')
    // As in the real auth submodule, this dist directory has no package.json.
    write(path.join(target, 'index.d.ts'), 'export interface Keyset { name: string }\n')
    write(path.join(oldTarget, 'stale.txt'), 'stale output without declarations\n')
    fs.mkdirSync(path.dirname(installed), { recursive: true })
    if (cacheKind === 'copy') fs.cpSync(oldTarget, installed, { recursive: true })
    else fs.symlinkSync(oldTarget, installed, 'junction')
    if (cacheKind === 'dangling junction') fs.rmSync(oldTarget, { recursive: true })
    const before = spawnSync(process.execPath, [tsc, '--pretty', 'false'], { cwd: pkg, encoding: 'utf8' })
    assert.notEqual(before.status, 0)
    assert.match(before.stdout + before.stderr, /TS2307|TS2305/)
    // A registry dependency must survive; the reset is limited to local files.
    write(path.join(pkg, 'node_modules/registry-dependency/keep.txt'), 'keep')
    resetCachedLocalDependencies(fixture)
    assert.equal(fs.existsSync(installed), false)
    assert.equal(fs.readFileSync(path.join(target, 'index.d.ts'), 'utf8'), 'export interface Keyset { name: string }\n')
    if (cacheKind !== 'dangling junction') assert.ok(fs.existsSync(path.join(oldTarget, 'stale.txt')))
    assert.equal(fs.readFileSync(path.join(pkg, 'node_modules/registry-dependency/keep.txt'), 'utf8'), 'keep')
    // Exercise the same hoisted Lerna + npm install + prepare path as CI.
    const result = spawnSync(process.execPath, [lerna, 'bootstrap', '--ci'], {
      cwd: fixture, encoding: 'utf8', timeout: 60000,
      env: { ...process.env, CI: 'true', npm_config_stdio: 'inherit', npm_config_audit: 'false', npm_config_fund: 'false',
        PATH: path.dirname(process.execPath) + path.delimiter + process.env.PATH },
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.equal(fs.realpathSync(installed), fs.realpathSync(target))
    assert.match(fs.readFileSync(path.join(pkg, 'lib/index.d.ts'), 'utf8'), /Keyset/)
    // Repeating setup is safe and preserves the built source behind a live junction.
    resetCachedLocalDependencies(fixture)
    resetCachedLocalDependencies(fixture)
    assert.ok(fs.existsSync(path.join(target, 'index.d.ts')))
  })
}

test('Windows resets cached links before building submodules and bootstrapping', () => {
  const action = yaml.load(fs.readFileSync(path.join(root, '.github/actions/setup-env/action.yml'), 'utf8'))
  const steps = action.runs.steps
  const reset = steps.findIndex(step => step.run === 'node scripts/reset-cached-local-dependencies.cjs')
  assert.ok(reset > steps.findIndex(step => step.id === 'cache-nodemodules'))
  assert.ok(reset < steps.findIndex(step => step.name === 'Build submodules'))
  assert.ok(reset < steps.findIndex(step => step.name === 'Bootstrap project'))
  assert.equal(steps[reset].if, "runner.os == 'Windows'")
})
