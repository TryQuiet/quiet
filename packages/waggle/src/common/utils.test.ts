import fetch from 'node-fetch'
import { fetchRetry } from './utils'
jest.mock('node-fetch')

describe('fetch retry', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  it('resolves properly if receives response within given number of tries', async () => {
    // @ts-expect-error
    fetch.mockReturnValueOnce(Promise.reject(new Error('Proxy connection timeout'))).mockReturnValueOnce(Promise.resolve('data'))
    await fetchRetry('http://properUrl.com', { method: 'GET' }, 3)
  })
  it('rejects if connecting fails given number of tries', async () => {
    // @ts-expect-error
    fetch.mockReturnValue(Promise.reject(new Error('Proxy connection timeout')))
    const retryCount = 3
    await expect(fetchRetry('http://properUrl.com', { method: 'GET' }, retryCount)).rejects.toEqual(new Error('Proxy connection timeout'))
    expect(fetch).toHaveBeenCalledTimes(retryCount)
  })
})
