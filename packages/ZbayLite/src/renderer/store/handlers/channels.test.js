/* eslint import/first: 0 */
jest.mock('../../vault')
jest.mock('../../zcash')

import Immutable from 'immutable'
import { DateTime } from 'luxon'
import * as R from 'ramda'

import create from '../create'
import vault, { mock } from '../../vault'
import { createArchive } from '../../vault/marshalling'
import { ChannelsState, actions, actionTypes } from './channels'
import channelsSelectors from '../selectors/channels'
import testUtils from '../../testUtils'
import { typePending } from './utils'
import { mock as zcashMock } from '../../zcash'

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
      jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
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

    it('makes sure keys are present', async () => {
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

      expect(zcashMock.requestManager.z_importviewingkey.mock.calls).toMatchSnapshot()
    })

    it('cleans up loading when rejected', async () => {
      vault.getVault.mockImplementation(() => ({
        channels: {
          listChannels: jest.fn(async () => { throw Error('list channels error') })
        }
      }))
      try {
        await store.dispatch(actions.loadChannels('this is a test id'))
      } catch (err) {}
      expect(channelsSelectors.loader(store.getState())).toMatchSnapshot()
    })

    it('when pending', async () => {
      const action = { type: typePending(actionTypes.LOAD_CHANNELS) }
      await store.dispatch(action)
      assertStoreState()
    })
  })

  describe('handles actions', () => {
    it('-setLastSeen sets last seen for channel', () => {
      const channels = R.range(0, 3).map(testUtils.channels.createChannel)
      store = create({
        initialState: Immutable.Map({
          channels: ChannelsState({
            data: Immutable.fromJS(channels)
          })
        })
      })

      store.dispatch(actions.setLastSeen({
        channelId: channels[1].id,
        lastSeen: testUtils.now.minus({ hours: 2 })
      }))

      const updatedChannels = channelsSelectors.channels(store.getState())
      expect(updatedChannels.data.map(ch => ch.delete('id'))).toMatchSnapshot()
    })
  })
})
