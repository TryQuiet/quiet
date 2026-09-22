import fs from 'fs'
import os from 'os'
import path from 'path'
import { createArbitraryFile } from '../utils'

describe('attachment file fixture', () => {
  let directory: string
  beforeEach(async () => {
    directory = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'quiet-attachment-'))
  })
  afterEach(async () => {
    for (const entry of await fs.promises.readdir(directory)) await fs.promises.unlink(path.join(directory, entry))
    await fs.promises.rmdir(directory)
  })

  it('finishes writing the full attachment before the caller can upload it', async () => {
    const file = path.join(directory, 'large.bin')
    const size = 2 * 1024 * 1024 + 31
    await createArbitraryFile(file, size)
    expect((await fs.promises.readFile(file)).length).toBe(size)
  })

  it('reports a failed write instead of uploading a missing fixture', async () => {
    await expect(createArbitraryFile(path.join(directory, 'missing', 'large.bin'), 10)).rejects.toThrow('ENOENT')
  })
})
