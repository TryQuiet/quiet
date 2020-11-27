import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import client from '../../zcash'
import { actionTypes } from '../../../shared/static'

import { ActionsType, PayloadType } from './types'


interface IOwnedChannels {
  [key: string]: boolean
}

export const initialState: IOwnedChannels = {}

const addOwnedChannel = createAction<{ channels: IOwnedChannels }>(actionTypes.ADD_OWNED_CHANNEL)

export const actions = {
  addOwnedChannel
}

export type OwnedChannelsActions = ActionsType<typeof actions>

const getOwnedChannels = () => async (dispatch, getState) => {
  const myChannels = {}
  const addresses = await client.addresses()
  for (const address of addresses.z_addresses) {
    const privKey = await client.getPrivKey(address)
    if (privKey) {
      myChannels[address] = true
    }
  }
  dispatch(addOwnedChannel({ channels: myChannels }))
}

export const epics = {
  getOwnedChannels
}

export const reducer = handleActions<IOwnedChannels, PayloadType<OwnedChannelsActions>>(
  {
    [addOwnedChannel.toString()]: (
      state,
      { payload: { channels } }: OwnedChannelsActions['addOwnedChannel']
    ) =>
      produce(state, draft => {
        return {
          ...draft,
          ...channels
        }
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
