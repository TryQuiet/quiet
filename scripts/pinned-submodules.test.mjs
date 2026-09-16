import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { GIT_SUBMODULE_COMMAND } from '../3rd-party/qss/bootstrapper/const.mjs'

const { scripts } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

for (const [name, command] of [
  ['Quiet bootstrap', scripts['pull:submodules']],
  ['QSS bootstrap', GIT_SUBMODULE_COMMAND],
]) {
  test(`${name} keeps the recorded revision when the tracked branch has advanced`, () => {
    const fixture = mkdtempSync(join(tmpdir(), 'quiet-pinned-submodule-'))
    const dependency = join(fixture, 'dependency')
    const checkout = join(fixture, 'checkout')
    const git = (cwd, ...args) =>
      execFileSync('git', args, {
        cwd,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, GIT_ALLOW_PROTOCOL: 'file' },
      }).trim()
    const init = path => {
      git(fixture, 'init', '--initial-branch=main', path)
      git(path, 'config', 'user.name', 'Submodule policy test')
      git(path, 'config', 'user.email', 'submodule-policy@example.invalid')
    }
    try {
      init(dependency)
      writeFileSync(join(dependency, 'policy'), 'pinned policy')
      git(dependency, 'add', 'policy')
      git(dependency, 'commit', '-m', 'pinned revision')
      const pinned = git(dependency, 'rev-parse', 'HEAD')
      writeFileSync(join(dependency, 'policy'), 'different branch-head policy')
      git(dependency, 'commit', '-am', 'advanced branch')
      const latest = git(dependency, 'rev-parse', 'HEAD')

      init(checkout)
      git(checkout, 'submodule', 'add', '-b', 'main', dependency, 'auth')
      git(join(checkout, 'auth'), 'checkout', '--detach', pinned)
      git(checkout, 'add', '.gitmodules', 'auth')
      git(checkout, 'commit', '-m', 'record release pin')
      assert.notEqual(pinned, latest)
      assert.equal(git(join(checkout, 'auth'), 'rev-parse', 'origin/main'), latest)

      const [executable, ...args] = command.split(' ')
      assert.equal(executable, 'git')
      git(checkout, ...args)
      assert.equal(git(join(checkout, 'auth'), 'rev-parse', 'HEAD'), pinned)
    } finally {
      rmSync(fixture, { recursive: true, force: true })
    }
  })
}
