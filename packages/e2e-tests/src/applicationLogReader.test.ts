import fs from 'fs'
import os from 'os'
import path from 'path'
import { ApplicationLogReader } from './applicationLogReader'

describe('Application log output', () => {
  let directory: string
  let reader: ApplicationLogReader
  let log: string

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-app-logs-'))
    reader = new ApplicationLogReader(directory)
    log = path.join(directory, 'log_2026-09-21.log')
  })

  afterEach(() => fs.rmdirSync(directory, { recursive: true }))

  it('reads appended backend output exactly once, preserving Unicode messages', () => {
    fs.writeFileSync(log, 'Starting backend\n')
    expect(reader.readNew()).toBe('Starting backend\n')
    expect(reader.readNew()).toBe('')
    fs.appendFileSync(log, 'Chain updated and persisted, emitted updated event 🎉\n')
    expect(reader.readNew()).toBe('Chain updated and persisted, emitted updated event 🎉\n')
    expect(reader.readNew()).toBe('')
  })

  it('does not reuse a graph update from before the test cleared its output', () => {
    fs.writeFileSync(log, 'Chain updated and persisted, emitted updated event\n')
    reader.reset()
    expect(reader.readNew()).toBe('')
    fs.appendFileSync(log, 'A new device invite was persisted\n')
    expect(reader.readNew()).toBe('A new device invite was persisted\n')
  })

  it('handles startup before logs exist, daily rotation, and truncated logs', () => {
    const pending = new ApplicationLogReader(path.join(directory, 'not-created-yet'))
    pending.reset()
    expect(pending.readNew()).toBe('')
    fs.writeFileSync(log, 'Before midnight\n')
    reader.reset()
    fs.writeFileSync(path.join(directory, 'log_2026-09-22.log'), 'After midnight\n')
    expect(reader.readNew()).toBe('After midnight\n')
    fs.writeFileSync(log, 'Restart\n')
    expect(reader.readNew()).toBe('Restart\n')
  })
})
