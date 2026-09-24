import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const root = fileURLToPath(new URL('../', import.meta.url))
const workflow = await readFile(path.join(root, '.github/workflows/mobile-deploy-ios.yml'), 'utf8')
const projectDir = path.join(root, 'packages/mobile/ios')

test('iOS release env files resolve to tracked mobile configuration', async () => {
  const envfile = workflow.match(/^\s*ENVFILE:\s*\$\{\{ github\.event\.action == 'prereleased' && '([^']+)' \|\| '([^']+)' \}\}/m)
  assert.ok(envfile, 'release workflow should select prerelease and production env files')
  for (const selected of envfile.slice(1)) {
    const source = path.resolve(projectDir, '..', selected)
    assert.equal((await stat(source)).isFile(), true, `missing env file: ${source}`)
    assert.equal(path.dirname(source), path.join(root, 'packages/mobile'))
  }
})
