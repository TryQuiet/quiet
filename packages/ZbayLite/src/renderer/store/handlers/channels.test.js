/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import vault, { mock } from '../../vault'
import { createArchive } from '../../vault/marshalling'
import { ChannelsState, actions, actionTypes } from './channels'
import channelsSelectors from '../selectors/channels'
import testUtils from '../../testUtils'
import { typePending } from './utils'

describe('channels reducer', () => {
  let store = null
  beforeEach(async () => {
    store = create({
      initialState: Immutable.Map({
        channels: ChannelsState()
      })
    })
    jest.clearAllMocks()
  })

  const assertStoreState = () => expect(
    channelsSelectors.channels(store.getState())
  ).toMatchSnapshot()

  describe('handles load channels', () => {
    it('when fulfilled', async () => {
      const id = 'this is'
      mock.setArchive(createArchive())
      await Promise.all(
        R.range(0, 3).map(
          R.compose(
            R.curry(vault.getVault().channels.importChannel)(id),
            testUtils.channels.createChannel
          )
        )
      )
      await store.dispatch(actions.loadChannels(id))
      const channels = channelsSelectors.channels(store.getState())
      expect(channels.data.map(ch => ch.delete('id'))).toMatchSnapshot()
    })

    it('when rejected', async () => {
      const errorMsg = 'list channels error'
      vault.getVault.mockImplementation(() => ({
        channels: {
          listChannels: jest.fn(async () => { throw Error(errorMsg) })
        }
      }))
      expect.assertions(2)
      try {
        await store.dispatch(actions.loadChannels('this is a test id'))
      } catch (err) {
        expect(err.message).toEqual(errorMsg)
      }
      expect(channelsSelectors.errors(store.getState())).toEqual(errorMsg)
    })

    it('when pending', async () => {
      const action = { type: typePending(actionTypes.LOAD_CHANNELS) }
      await store.dispatch(action)
      assertStoreState()
    })
  })
})
