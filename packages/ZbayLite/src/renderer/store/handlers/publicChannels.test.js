/* eslint import/first: 0 */
jest.mock('../../zcash')

import Immutable from 'immutable'

import create from '../create'
import { actions, initialState, _PublicChannelData } from './publicChannels'
import selectors from '../selectors/publicChannels'

describe('Operations reducer handles ', () => {
  let store = null
  const testPublicChannelData = {
    address: '1234',
    minFee: '1',
    name: '121',
    description: 'sadadsdsadsa',
    onlyForRegistered: 'saddsa',
    owner: 'dsaasdasddsa',
    keys: { ivk: 'zivks14fgrxnk2f6qhtndxtc23cwy74kuyptq78qen9jq2ts2hnz0e7vrqazzytr' }
  }
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        operations: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('actions', () => {
    it('- setPublicChannels', () => {
      store.dispatch(
        actions.setPublicChannels({
          publicChannels: { testaddress1: _PublicChannelData(testPublicChannelData) }
        })
      )
      expect(selectors.publicChannels(store.getState())).toMatchSnapshot()
    })
    it('- merge Channels', () => {
      store.dispatch(
        actions.setPublicChannels({
          publicChannels: { name: _PublicChannelData(testPublicChannelData) }
        })
      )
      store.dispatch(
        actions.setPublicChannels({
          publicChannels: { name: _PublicChannelData(testPublicChannelData) }
        })
      )
      expect(selectors.publicChannels(store.getState()).size).toEqual(1)

      store.dispatch(
        actions.setPublicChannels({
          publicChannels: { name: _PublicChannelData(testPublicChannelData) }
        })
      )
      expect(selectors.publicChannels(store.getState()).size).toEqual(1)
    })
  })
})
