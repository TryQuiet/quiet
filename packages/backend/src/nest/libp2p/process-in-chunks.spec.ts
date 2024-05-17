import { jest, describe, it, expect } from '@jest/globals'
import { ProcessInChunksService } from './process-in-chunks.service'
import waitForExpect from 'wait-for-expect'
import { TestModule } from '../common/test.module'
import { Test, TestingModule } from '@nestjs/testing'
import { sleep } from '../common/sleep'
describe('ProcessInChunks', () => {
  let module: TestingModule
  let processInChunks: ProcessInChunksService<string>

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [TestModule, ProcessInChunksService],
    }).compile()

    processInChunks = await module.resolve(ProcessInChunksService)
  })

  it('processes data', async () => {
    const mockProcessItem = jest
      .fn(async a => {
        console.log('processing', a)
      })
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 1'))
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 2'))
    processInChunks.init({ initialData: ['a', 'b', 'c', 'd'], processItem: mockProcessItem })
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(6)
    })
  })

  it('processes new data', async () => {
    const mockProcessItem = jest
      .fn(async a => {
        console.log('processing', a)
      })
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 1'))
    processInChunks.init({ initialData: ['a', 'b'], processItem: mockProcessItem })
    processInChunks.updateQueue(['e', 'f'])
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(5)
    })
  })

  it('processes data in chunks', async () => {
    const mockProcessItem = jest
      .fn(async a => {
        console.log('processing', a)
      })
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 1'))
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 2'))
    const chunkSize = 2
    processInChunks.init({ initialData: ['a', 'b', 'c', 'd'], processItem: mockProcessItem, chunkSize })
    await sleep(10000)
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(6)
    })
  })

  it('does not process more data if stopped', async () => {
    const mockProcessItem = jest.fn(async () => {})
    processInChunks.init({ initialData: [], processItem: mockProcessItem })
    processInChunks.pause()
    processInChunks.updateQueue(['a', 'b', 'c', 'd'])
    expect(mockProcessItem).not.toBeCalled()
  })

  it('processes tasks after resuming from pause', async () => {
    const mockProcessItem = jest.fn(async () => {})
    processInChunks.init({ initialData: [], processItem: mockProcessItem })
    processInChunks.pause()
    processInChunks.updateQueue(['a', 'b', 'c', 'd'])
    processInChunks.resume()
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(4)
    })
  })

  it('processes tasks when deferred', async () => {
    const mockProcessItem = jest.fn(async () => {})
    processInChunks.init({ initialData: ['a', 'b', 'c', 'd'], processItem: mockProcessItem, startImmediately: false })
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(0)
    })
    processInChunks.resume()
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(4)
    })
  })
})
