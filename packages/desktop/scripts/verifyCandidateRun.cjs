const fs = require('node:fs')

async function verifyCandidateRun({ repository, runId, artifactId, receipt }, request) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository) || !/^\d+$/.test(runId) || !/^\d+$/.test(artifactId) ||
      !/^[a-f0-9]{40}$/.test(receipt.sourceCommit || '') || !/^[0-9A-Za-z.+-]+$/.test(receipt.version)) {
    throw new Error('Invalid release candidate provenance')
  }
  const prefix = `/repos/${repository}`
  const [workflow, run, artifact] = await Promise.all([
    request(`${prefix}/actions/workflows/desktop-build.yml`),
    request(`${prefix}/actions/runs/${runId}`),
    request(`${prefix}/actions/artifacts/${artifactId}`),
  ])
  const expectedName = `desktop-${receipt.platform === 'win32' ? 'windows' : 'linux'}-release-candidate`
  if (!['linux', 'win32'].includes(receipt.platform) || run.id !== Number(runId) || run.workflow_id !== workflow.id ||
      run.event !== 'release' || run.status !== 'completed' || run.conclusion !== 'success' ||
      run.head_repository?.full_name !== repository || run.repository?.full_name !== repository ||
      run.head_sha !== receipt.sourceCommit || artifact.id !== Number(artifactId) || artifact.name !== expectedName ||
      artifact.expired !== false || artifact.workflow_run?.id !== run.id ||
      artifact.workflow_run?.head_sha !== run.head_sha || artifact.workflow_run?.head_repository_id !== run.repository.id) {
    throw new Error('Candidate must come from this repository\'s successful release-triggered Desktop Build run')
  }
  const tag = `@quiet/desktop@${receipt.version}`
  const [release, ref, sourcePackage] = await Promise.all([
    request(`${prefix}/releases/tags/${encodeURIComponent(tag)}`),
    request(`${prefix}/git/ref/tags/${encodeURIComponent(tag)}`),
    request(`${prefix}/contents/packages/desktop/package.json?ref=${receipt.sourceCommit}`),
  ])
  if (release.tag_name !== tag || release.draft !== false || !release.published_at ||
      release.prerelease !== (receipt.channel !== 'latest')) throw new Error('Candidate is not the selected published desktop release')
  let object = ref.object
  for (let depth = 0; object?.type === 'tag' && depth < 5; depth++) {
    object = (await request(`${prefix}/git/tags/${object.sha}`)).object
  }
  if (object?.type !== 'commit' || object.sha !== receipt.sourceCommit ||
      sourcePackage.encoding !== 'base64' || JSON.parse(Buffer.from(sourcePackage.content, 'base64')).version !== receipt.version) {
    throw new Error('Release tag, build commit and packaged version do not agree')
  }
}

if (require.main === module) {
  const receipt = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
  const request = async endpoint => {
    const response = await fetch(`https://api.github.com${endpoint}`, { redirect: 'error', signal: AbortSignal.timeout(15_000),
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2026-03-10' } })
    if (!response.ok) throw new Error(`Cannot verify release provenance: GitHub HTTP ${response.status}`)
    return response.json()
  }
  verifyCandidateRun({ repository: process.env.GITHUB_REPOSITORY, runId: process.env.CANDIDATE_RUN_ID,
    artifactId: process.env.CANDIDATE_ARTIFACT_ID, receipt }, request)
    .catch(error => { console.error(error.message); process.exitCode = 1 })
}

module.exports = { verifyCandidateRun }
