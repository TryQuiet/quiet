import MockAdapter from 'axios-mock-adapter'
import axios from 'axios'

import JRPC from './jrpc'

describe('jrpc', () => {
  const axiosMock = new MockAdapter(axios)

  beforeEach(() => {
    axiosMock.reset()
    jest.clearAllMocks()
    jest.spyOn(Date, 'now').mockImplementationOnce(() => 1553595131312)
  })

  it('calls appropriate methods', async () => {
    const jrpc = new JRPC()
    axiosMock.onPost('http://localhost:8332').replyOnce(200, { result: 'value' })
    await jrpc.test_method('test-parameter')
    expect(axiosMock.history.post).toMatchSnapshot()
  })

  it('accepts custom url', async () => {
    const jrpc = new JRPC({ url: 'http://localhost:8888' })
    axiosMock.onPost('http://localhost:8888').replyOnce(200, { result: 'value' })
    const result = await jrpc.test_method('test-parameter')
    expect(result).toMatchSnapshot()
  })

  it('adds authentication header', async () => {
    const jrpc = new JRPC({
      auth: {
        username: 'test',
        password: 'test-pass'
      }
    })
    axiosMock.onPost('http://localhost:8332').replyOnce(200, { result: 'value' })
    await jrpc.test_method('test-parameter')
    expect(axiosMock.history.post).toMatchSnapshot()
  })

  it('does not warn on lack of auth configuration', async () => {
    jest.spyOn(console, 'warn').mockImplementation()
    const jrpc = new JRPC()
    axiosMock.onPost('http://localhost:8332').replyOnce(200, { result: 'value' })
    await jrpc.test_method('test-parameter')
    expect(console.warn.mock.calls).toMatchSnapshot()
  })

  it('warns on invalid config', async () => {
    jest.spyOn(console, 'warn').mockImplementation()
    const jrpc = new JRPC({
      auth: {
        username: 'test'
      }
    })
    axiosMock.onPost('http://localhost:8332').replyOnce(200, { result: 'value' })
    await jrpc.test_method('test-parameter')
    expect(console.warn.mock.calls).toMatchSnapshot()
  })

  it('throws on error', async () => {
    const jrpc = new JRPC()
    axiosMock.onPost('http://localhost:8332').replyOnce(500)
    expect(jrpc.test_method('test-parameter')).rejects.toThrowErrorMatchingSnapshot()
  })
})
