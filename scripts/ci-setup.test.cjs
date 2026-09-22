const assert = require('node:assert/strict')
const { spawn } = require('node:child_process')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { test } = require('node:test')
const yaml = require('js-yaml')

const root = path.resolve(__dirname, '..')
const action = yaml.load(require('node:fs').readFileSync(path.join(root, '.github/actions/setup-env/action.yml'), 'utf8'))

for (const scope of ['', '@quiet/mobile,@quiet/backend']) {
  test(`the actual bootstrap action retries downloads and preserves scope ${scope || '(all)'}`, async t => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'quiet-ci-bootstrap-'))
    t.after(() => fs.rm(dir, { recursive: true, force: true }))
    await fs.mkdir(path.join(dir, 'scripts'))
    await fs.mkdir(path.join(dir, 'bin'))
    await fs.copyFile(path.join(root, 'scripts/retry-network-command.sh'), path.join(dir, 'scripts/retry-network-command.sh'))
    const calls = path.join(dir, 'calls.jsonl')
    const shim = `#!${process.execPath} --\nconst fs = require('node:fs');
      const file = ${JSON.stringify(calls)};
      const first = !fs.existsSync(file);
      fs.appendFileSync(file, JSON.stringify(process.argv.slice(2)) + '\\n');
      if (first) { console.error('npm error HTTPError: Response code 504 (Gateway Time-out)'); process.exit(1); }
    `
    await fs.writeFile(path.join(dir, 'bin/lerna'), shim, { mode: 0o755 })
    const script = action.runs.steps.find(step => step.name === 'Bootstrap project').run
      .replaceAll('${{ inputs.bootstrap-packages }}', scope)
    const child = spawn('bash', ['-e', '-o', 'pipefail', '-c', script], {
      cwd: dir,
      env: { ...process.env, PATH: `${path.join(dir, 'bin')}${path.delimiter}${process.env.PATH}`, QUIET_NETWORK_RETRY_DELAY_SECONDS: '0' },
    })
    let output = ''
    child.stdout.on('data', data => { output += data })
    child.stderr.on('data', data => { output += data })
    const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve) })
    assert.equal(code, 0, output)
    const expected = scope ? ['bootstrap', '--scope', `{${scope},}`] : ['bootstrap']
    assert.deepEqual((await fs.readFile(calls, 'utf8')).trim().split('\n').map(JSON.parse), [expected, expected])
  })
}

test('an ARM Mac cannot restore an Intel or different Node native dependency cache', () => {
  const cache = action.runs.steps.find(step => step.id === 'cache-nodemodules').with
  const render = (template, arch, runtime, locks) => template
    .replaceAll('${{ inputs.cachePrefix }}', 'test')
    .replaceAll('${{ runner.os }}', 'macOS')
    .replaceAll('${{ runner.arch }}', arch)
    .replaceAll("${{ hashFiles('.nvmrc', 'package.json') }}", runtime)
    .replaceAll("${{ hashFiles('package-lock.json', 'packages/*/package-lock.json') }}", locks)
    .trim()
  const restore = render(cache['restore-keys'], 'ARM64', 'node24-npm10', 'current')
  assert.ok(render(cache.key, 'ARM64', 'node24-npm10', 'previous-locks').startsWith(restore))
  assert.ok(!render(cache.key, 'X64', 'node24-npm10', 'current').startsWith(restore))
  assert.ok(!render(cache.key, 'ARM64', 'node20-npm10', 'current').startsWith(restore))
})
