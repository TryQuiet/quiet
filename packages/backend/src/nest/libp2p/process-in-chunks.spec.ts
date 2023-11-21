import { jest, describe, it, expect } from '@jest/globals'
import { ProcessInChunksService } from './process-in-chunks.service'
import waitForExpect from 'wait-for-expect'
import { TestModule } from '../common/test.module'
import { Test, TestingModule } from '@nestjs/testing'
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
    processInChunks.init(['a', 'b', 'c', 'd'], mockProcessItem)
    await processInChunks.process()
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(4)
    })
  })

  it('processes new data', async () => {
    const mockProcessItem = jest
      .fn(async a => {
        console.log('processing', a)
      })
      .mockResolvedValueOnce()
      .mockRejectedValueOnce(new Error('Rejected 1'))
    processInChunks.init(['a', 'b'], mockProcessItem)
    await processInChunks.process()
    processInChunks.updateData(['e', 'f'])
    await processInChunks.process()
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(4)
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
    processInChunks.init(['a', 'b', 'c', 'd'], mockProcessItem, chunkSize)
    await processInChunks.process()
    await waitForExpect(() => {
      expect(mockProcessItem).toBeCalledTimes(4)
    })
  })

  it.skip('does not process more data if stopped', async () => {
    const mockProcessItem = jest.fn(async () => {})
    const processInChunks = new ProcessInChunksService()
    processInChunks.init(['a', 'b', 'c', 'd'], mockProcessItem)
    processInChunks.stop()
    await processInChunks.process()
    expect(mockProcessItem).not.toBeCalled()
  })
})
