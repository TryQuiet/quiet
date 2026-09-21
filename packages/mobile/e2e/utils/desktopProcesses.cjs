const { execFileSync } = require('child_process')

function processTable() {
  // PID metadata only: process arguments can contain application credentials.
  return execFileSync('ps', ['-axo', 'pid=,ppid=,stat=,lstart='], {
    encoding: 'utf8',
    env: { ...process.env, LC_ALL: 'C' },
  })
    .trim()
    .split('\n')
    .map(line => {
      const [pid, parent, state, ...started] = line.trim().split(/\s+/)
      return { pid: Number(pid), parent: Number(parent), state, started: started.join(' ') }
    })
}

function snapshotOwnedProcesses(rootPid) {
  if (!Number.isSafeInteger(rootPid) || rootPid <= 1) throw new Error("Expected this test's ChromeDriver PID")
  const table = processTable()
  const owned = new Set([rootPid])
  let previous
  do {
    previous = owned.size
    for (const row of table) if (owned.has(row.parent)) owned.add(row.pid)
  } while (owned.size !== previous)
  const snapshot = table.filter(row => owned.has(row.pid))
  if (!snapshot.some(row => row.pid === rootPid)) throw new Error('Owned desktop process is no longer running')
  return snapshot
}

async function waitForProcessExit(snapshot, timeout = 20000) {
  const deadline = Date.now() + timeout
  do {
    const current = processTable()
    const alive = snapshot.filter(old =>
      current.some(row => row.pid === old.pid && row.started === old.started && !row.state.startsWith('Z'))
    )
    if (!alive.length) return
    if (Date.now() >= deadline) throw new Error(`${alive.length} owned desktop processes remain online`)
    await new Promise(resolve => setTimeout(resolve, 250))
  } while (true)
}

module.exports = { snapshotOwnedProcesses, waitForProcessExit }
