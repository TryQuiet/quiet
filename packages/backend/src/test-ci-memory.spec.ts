import { spawnSync } from 'child_process'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { fileURLToPath } from 'url'

/**
 * The backend unit-test job used to run every suite in a single Node process (`jest --runInBand`).
 * Each suite gets a fresh Jest module registry and re-evaluates the whole backend dependency graph
 * (NestJS, libp2p, Helia, OrbitDB, @localfirst/auth, @quiet/state-manager), and the finished sandbox is
 * not reclaimed until V8's last-resort collection, so the heap climbed by tens of megabytes per suite
 * until it reached `--max-old-space-size` and the job died with "Ineffective mark-compacts near heap
 * limit".
 *
 * The fix runs the suites in a single worker process instead, with `--workerIdleMemoryLimit`, so Jest
 * recycles that worker whenever its heap passes the limit. These tests pin both halves of the fix: the
 * flags the CI script must carry, and the recycling behaviour of the installed Jest itself.
 */

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const FIXTURE_FILE_COUNT = 4
const FIXTURE_MEMORY_LIMIT = '100MB'

type FixtureRun = { status: number | null; output: string; heaps: number[]; pids: string[] }

const readTestCiScript = (): string => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(backendRoot, 'package.json'), 'utf8'))
  const script = packageJson.scripts?.['test-ci']
  if (typeof script !== 'string') {
    throw new Error('packages/backend/package.json has no test-ci script')
  }
  return script
}

const locateJestBin = (): string => {
  const candidates = [
    path.join(backendRoot, 'node_modules', 'jest', 'bin', 'jest.js'),
    path.join(backendRoot, '..', '..', 'node_modules', 'jest', 'bin', 'jest.js'),
  ]
  const found = candidates.find(candidate => fs.existsSync(candidate))
  if (found == null) {
    throw new Error(`could not locate the jest binary, looked in: ${candidates.join(', ')}`)
  }
  return found
}

/**
 * Writes plain-JS suites that each retain roughly 30 MB in a module-scope array, standing in for what a
 * real backend suite retains by way of its imported module graph. No TypeScript transform, so the nested
 * runs stay fast.
 */
const writeLeakFixture = (dir: string): string => {
  for (let index = 1; index <= FIXTURE_FILE_COUNT; index++) {
    const source = [
      "const fs = require('fs')",
      'const retained = []',
      `describe('leak fixture ${index}', () => {`,
      "  it('records the process it ran in, then retains memory past teardown', () => {",
      '    fs.appendFileSync(process.env.LEAK_PID_FILE, `${process.pid}\\n`)',
      `    for (let chunk = 0; chunk < 15; chunk++) retained.push(new Array(250000).fill('leak-${index}-' + chunk))`,
      '    expect(retained.length).toBe(15)',
      '  })',
      '})',
      'module.exports = { retained }',
    ].join('\n')
    fs.writeFileSync(path.join(dir, `leak${index}.test.js`), `${source}\n`)
  }

  const configPath = path.join(dir, 'jest.fixture.config.cjs')
  fs.writeFileSync(
    configPath,
    `module.exports = ${JSON.stringify({
      rootDir: dir,
      testEnvironment: 'node',
      transform: {},
      testMatch: ['**/leak*.test.js'],
    })}\n`
  )
  return configPath
}

const runFixture = (configPath: string, pidFile: string, jestArgs: string[]): FixtureRun => {
  fs.rmSync(pidFile, { force: true })
  const result = spawnSync(
    process.execPath,
    [locateJestBin(), '--config', configPath, '--ci', '--silent', '--logHeapUsage', ...jestArgs],
    {
      cwd: backendRoot,
      encoding: 'utf8',
      env: { ...process.env, LEAK_PID_FILE: pidFile, NODE_OPTIONS: '--max-old-space-size=1024' },
    }
  )
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  return {
    status: result.status,
    output,
    heaps: [...output.matchAll(/\((\d+) MB heap size\)/g)].map(match => Number(match[1])),
    pids: fs.existsSync(pidFile)
      ? fs
          .readFileSync(pidFile, 'utf8')
          .split('\n')
          .filter(line => line.length > 0)
      : [],
  }
}

describe('backend test-ci memory budget', () => {
  let fixtureDir: string
  let recycled: FixtureRun
  let inBand: FixtureRun

  beforeAll(() => {
    // realpath so the fixture rootDir matches the paths Jest resolves; macOS temp dirs are symlinked.
    fixtureDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-jest-heap-')))
    const configPath = writeLeakFixture(fixtureDir)
    const pidFile = path.join(fixtureDir, 'pids.txt')
    recycled = runFixture(configPath, pidFile, ['--maxWorkers=1', `--workerIdleMemoryLimit=${FIXTURE_MEMORY_LIMIT}`])
    inBand = runFixture(configPath, pidFile, ['--runInBand'])
  }, 300000)

  afterAll(() => {
    if (fixtureDir != null) {
      fs.rmSync(fixtureDir, { recursive: true, force: true })
    }
  })

  it('does not pin every suite into one process, and caps that process below the heap ceiling', () => {
    const script = readTestCiScript()

    // --runInBand is what accumulated every suite's retained module graph in a single heap.
    expect(script).not.toContain('--runInBand')
    // One suite at a time is still required: several suites bind Tor control ports and libp2p listeners.
    expect(script).toContain('--maxWorkers=1')

    const limitMatch = script.match(/--workerIdleMemoryLimit=(\d+)(MB|GB)/)
    expect(limitMatch).not.toBeNull()
    const ceilingMatch = script.match(/--max-old-space-size=(\d+)/)
    expect(ceilingMatch).not.toBeNull()

    const limitMb = Number(limitMatch![1]) * (limitMatch![2] === 'GB' ? 1024 : 1)
    const ceilingMb = Number(ceilingMatch![1])

    // The worker is recycled once it passes the limit, so the heap peaks at roughly the limit plus one
    // suite's own footprint. Leave at least half the ceiling for that suite and for Jest's own overhead.
    expect(limitMb).toBeGreaterThan(0)
    expect(limitMb).toBeLessThanOrEqual(ceilingMb / 2)
  })

  it('runs every suite in the one process when run in band, retaining each one past teardown', () => {
    expect(inBand.status).toBe(0)
    expect(inBand.output).toContain(`${FIXTURE_FILE_COUNT} passed`)
    expect(inBand.pids).toHaveLength(FIXTURE_FILE_COUNT)
    expect(inBand.heaps).toHaveLength(FIXTURE_FILE_COUNT)

    // Everything ran in the one process, and none of the retained memory came back between suites.
    // This is the failure mode the CI job hit; it is here as the control for the test below.
    expect(new Set(inBand.pids).size).toBe(1)
    expect(inBand.heaps[inBand.heaps.length - 1]).toBeGreaterThan(inBand.heaps[0])
  })

  it('recycles the worker once its heap passes the idle memory limit', () => {
    expect(recycled.status).toBe(0)
    expect(recycled.output).toContain(`${FIXTURE_FILE_COUNT} passed`)
    expect(recycled.pids).toHaveLength(FIXTURE_FILE_COUNT)
    expect(recycled.heaps).toHaveLength(FIXTURE_FILE_COUNT)

    // More than one process ran the suites, which only happens when the worker was restarted.
    expect(new Set(recycled.pids).size).toBeGreaterThan(1)
    // And the recycling is what keeps the heap down: the same suites in band end up holding more.
    expect(recycled.heaps[recycled.heaps.length - 1]).toBeLessThan(inBand.heaps[inBand.heaps.length - 1])
  })
})
