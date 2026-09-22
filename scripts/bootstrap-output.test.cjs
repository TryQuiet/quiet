const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const yaml = require('js-yaml')

test('the real Lerna bootstrap preserves failed lifecycle diagnostics and status', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-bootstrap-output-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const pkg = path.join(directory, 'packages', 'failing-build')
  fs.mkdirSync(pkg, { recursive: true })
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: 'bootstrap-test', private: true }))
  fs.writeFileSync(path.join(directory, 'lerna.json'), JSON.stringify({ version: '1.0.0', packages: ['packages/*'] }))
  fs.writeFileSync(path.join(pkg, 'package.json'), JSON.stringify({
    name: 'failing-build', version: '1.0.0', private: true, scripts: { prepare: 'node failure.cjs' },
  }))
  fs.writeFileSync(path.join(pkg, 'failure.cjs'),
    'process.stdout.write("compiler diagnostic on stdout\\n"); process.stderr.write("compiler diagnostic on stderr\\n"); process.exitCode = 23;')
  const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../.github/actions/setup-env/action.yml'), 'utf8'))
  const bootstrap = workflow.runs.steps.find(step => step.name === 'Bootstrap project')
  const environment = { ...process.env, ...bootstrap.env }
  environment.PATH = path.dirname(process.execPath) + path.delimiter + environment.PATH
  const result = spawnSync(process.execPath, [require.resolve('lerna/cli'), 'bootstrap', '--no-ci'], {
    cwd: directory, env: environment, encoding: 'utf8', timeout: 30000,
  })
  assert.equal(result.status, 23, result.stdout + result.stderr)
  assert.match(result.stdout + result.stderr, /compiler diagnostic on stdout/)
  assert.match(result.stdout + result.stderr, /compiler diagnostic on stderr/)
})
