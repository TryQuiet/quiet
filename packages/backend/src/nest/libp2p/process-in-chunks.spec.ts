import { jest, describe, it, expect } from '@jest/globals'
import { ProcessInChunksService } from './process-in-chunks.service'

describe('ProcessInChunks', () => {
  it('processes data', async () => {
    const mockProcessItem = jest
      .fn(async () => {})
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 1'))
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 2'))
    const processInChunks = new ProcessInChunksService()
    processInChunks.init(['a', 'b', 'c', 'd'], mockProcessItem)
    await processInChunks.process()
    expect(mockProcessItem).toBeCalledTimes(4)
  })

  it('does not process more data if stopped', async () => {
    const mockProcessItem = jest.fn(async () => {})
    const processInChunks = new ProcessInChunksService()
    processInChunks.init(['a', 'b', 'c', 'd'], mockProcessItem)
    processInChunks.stop()
    await processInChunks.process()
    expect(mockProcessItem).not.toBeCalled()
  })
})
