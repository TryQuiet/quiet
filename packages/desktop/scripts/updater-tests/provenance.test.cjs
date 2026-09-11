const { test } = require('node:test')
const assert = require('node:assert/strict')
const { verifyCandidateRun } = require('../verifyCandidateRun.cjs')

function fixture() {
  const sha = 'a'.repeat(40)
  const repository = { id: 100, full_name: 'TryQuiet/quiet' }
  const receipt = { version: '2.0.0', channel: 'latest', platform: 'linux', sourceCommit: sha }
  const workflow = { id: 9 }
  const run = { id: 10, workflow_id: 9, event: 'release', status: 'completed', conclusion: 'success',
    head_sha: sha, head_repository: repository, repository }
  const artifact = { id: 11, name: 'desktop-linux-release-candidate', expired: false,
    workflow_run: { id: 10, head_sha: sha, head_repository_id: 100 } }
  const release = { tag_name: '@quiet/desktop@2.0.0', draft: false, published_at: '2026-09-01T00:00:00Z', prerelease: false }
  const ref = { object: { type: 'commit', sha } }
  const sourcePackage = { encoding: 'base64', content: Buffer.from(JSON.stringify({ version: '2.0.0' })).toString('base64') }
  const request = async endpoint => {
    if (endpoint.endsWith('/actions/workflows/desktop-build.yml')) return workflow
    if (endpoint.endsWith('/actions/runs/10')) return run
    if (endpoint.endsWith('/actions/artifacts/11')) return artifact
    if (endpoint.includes('/releases/tags/')) return release
    if (endpoint.includes('/git/ref/tags/')) return ref
    if (endpoint.includes('/contents/packages/desktop/package.json')) return sourcePackage
    throw new Error(`Unexpected API request ${endpoint}`)
  }
  return { workflow, run, artifact, release, ref, sourcePackage, receipt, request,
    options: { repository: repository.full_name, runId: '10', artifactId: '11', receipt } }
}

test('publishes only a candidate bound to a successful release build, its immutable artifact and exact release tag', async () => {
  const f = fixture()
  await verifyCandidateRun(f.options, f.request)
})

for (const [name, mutate] of Object.entries({
  'PR run': f => { f.run.event = 'pull_request' },
  'failed run': f => { f.run.conclusion = 'failure' },
  'unrelated workflow': f => { f.run.workflow_id = 99 },
  'fork run': f => { f.run.head_repository = { full_name: 'attacker/quiet' } },
  'other build artifact': f => { f.artifact.workflow_run.id = 20 },
  'wrong artifact commit': f => { f.artifact.workflow_run.head_sha = 'b'.repeat(40) },
  'changed receipt commit': f => { f.receipt.sourceCommit = 'b'.repeat(40) },
  'moved release tag': f => { f.ref.object.sha = 'b'.repeat(40) },
  'unpublished release': f => { f.release.draft = true },
  'wrong release channel': f => { f.release.prerelease = true },
  'wrong package version': f => { f.sourcePackage.content = Buffer.from('{"version":"3.0.0"}').toString('base64') },
  'expired artifact': f => { f.artifact.expired = true },
})) {
  test(`rejects ${name} before privileged publication`, async () => {
    const f = fixture()
    mutate(f)
    await assert.rejects(verifyCandidateRun(f.options, f.request))
  })
}
