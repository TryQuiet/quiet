import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import test from 'node:test'

const workflowsDirectory = new URL('../.github/workflows/', import.meta.url)
const expectedGroup =
  "group: ${{ github.workflow }}-${{ github.event_name == 'pull_request' && github.ref || github.run_id }}"
const expectedCancellation = "cancel-in-progress: ${{ github.event_name == 'pull_request' }}"

const topLevelBlock = (source, key) => {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(line => line === `${key}:`)
  if (start === -1) return []

  const block = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line !== '' && !/^\s/.test(line)) break
    block.push(line)
  }
  return block
}

const hasPullRequestTrigger = source => {
  const lines = source.split(/\r?\n/)
  const start = lines.findIndex(line => /^on:/.test(line))
  if (start === -1) return false

  if (/\bpull_request\b/.test(lines[start])) return true

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (line !== '' && !/^\s/.test(line)) break
    if (/^\s+pull_request\s*:/.test(line)) return true
  }
  return false
}

test('detects block and inline pull-request triggers', () => {
  assert.equal(hasPullRequestTrigger('on:\n  pull_request:\n\njobs:\n'), true)
  assert.equal(hasPullRequestTrigger('on: [push, pull_request]\n\njobs:\n'), true)
  assert.equal(hasPullRequestTrigger('on:\n  push:\n\njobs:\n'), false)
})

test('every pull-request workflow cancels only a superseded run of that pull request', async () => {
  const workflowFiles = (await readdir(workflowsDirectory)).filter(file => /\.ya?ml$/.test(file))
  const pullRequestWorkflows = []

  for (const file of workflowFiles) {
    const source = await readFile(new URL(file, workflowsDirectory), 'utf8')
    if (!hasPullRequestTrigger(source)) continue
    pullRequestWorkflows.push(file)

    const concurrency = topLevelBlock(source, 'concurrency').map(line => line.trim())
    assert.ok(concurrency.includes(expectedGroup), `${file} must use a stable PR group and a unique non-PR group`)
    assert.ok(
      concurrency.includes(expectedCancellation),
      `${file} must cancel in-progress work only for pull-request events`
    )
  }

  assert.ok(pullRequestWorkflows.length > 0, 'expected to find pull-request workflows')
})
