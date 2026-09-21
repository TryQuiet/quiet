import { spawn, type ChildProcess } from 'child_process'
import { once } from 'events'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { getWindowsBackendPids } from './windowsBackendProcesses'

const describeWindows = process.platform === 'win32' ? describe : describe.skip

describeWindows('Windows backend discovery on the real process table', () => {
  let directory: string
  const children: ChildProcess[] = []

  beforeAll(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "quiet's process test "))
    fs.copyFileSync(process.execPath, path.join(directory, 'Quiet.exe'))
    fs.mkdirSync(path.join(directory, 'backend-bundle'))
    fs.writeFileSync(path.join(directory, 'backend-bundle', 'bundle.cjs'), 'setInterval(() => {}, 1000)')
  })

  afterAll(async () => {
    await Promise.all(
      children.map(async child => {
        if (child.exitCode !== null || child.signalCode !== null) return
        const exited = once(child, 'exit')
        child.kill()
        await exited
      })
    )
    fs.rmdirSync(directory, { recursive: true })
  })

  it('finds and kills only the requested backend, preserving a second client with a similar directory', async () => {
    const dataDir = path.join(directory, 'client')
    for (const name of [dataDir, `${dataDir}-other`]) {
      const child = spawn(path.join(directory, 'Quiet.exe'), [
        path.join(directory, 'backend-bundle', 'bundle.cjs'),
        '-a',
        name,
      ])
      children.push(child)
      await once(child, 'spawn')
    }
    expect(getWindowsBackendPids(dataDir)).toEqual([children[0].pid])
    expect(getWindowsBackendPids(`${dataDir}-other`)).toEqual([children[1].pid])
    const exited = once(children[0], 'exit')
    process.kill(getWindowsBackendPids(dataDir)[0], 'SIGINT')
    await exited
    expect(getWindowsBackendPids(dataDir)).toEqual([])
    expect(getWindowsBackendPids(`${dataDir}-other`)).toEqual([children[1].pid])
  }, 60_000)

  it('refuses an empty directory instead of matching every backend', () => {
    expect(() => getWindowsBackendPids('')).toThrow('data directory is required')
  })
})
