import { jest, describe, it, expect } from '@jest/globals'
import { ProcessInChunks } from './processInChunks'

describe('ProcessInChunks', () => {
  it('processes data', async () => {
    const mockProcessItem = jest.fn(async () => {})
    const data = ['a', 'b', 'c', 'd']
    const processInChunks = new ProcessInChunks(data, mockProcessItem)
    await processInChunks.process()
    expect(mockProcessItem).toBeCalledTimes(data.length)
  })

  it('does not process more data if stopped', async () => {
    const mockProcessItem = jest.fn(async () => {})
    const processInChunks = new ProcessInChunks(['a', 'b', 'c', 'd'], mockProcessItem)
    processInChunks.stop()
    await processInChunks.process()
    expect(mockProcessItem).not.toBeCalled()
  })
})
