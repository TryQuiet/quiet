/* eslint import/first: 0 */
import importedChannelSelectors from './importedChannel'

import create from '../create'
import { initialState as ImportedChannelState } from '../handlers/importedChannel'

describe('Imported channel', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      importedChannel: {
        ...ImportedChannelState,
        data: {
          name: 'Politics',
          private: true,
          address: 'zs1testaddress',
          description: 'This is a simple test channel',
          keys: {
            ivk: 'this-is-an-ivk-key'
          }
        },
        errors: 'test error'
      }
    })
  })

  it('data selector', async () => {
    expect(importedChannelSelectors.data(store.getState())).toMatchSnapshot()
  })

  it('decoding selector', async () => {
    expect(importedChannelSelectors.decoding(store.getState())).toEqual(false)
  })

  it('errors selector', async () => {
    expect(importedChannelSelectors.errors(store.getState())).toMatchSnapshot()
  })
})
