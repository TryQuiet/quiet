import { produce } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import client from '../../zcash'
import { actionTypes } from '../../../shared/static'

export const initialState = {}

const addOwnedChannel = createAction(actionTypes.ADD_OWNED_CHANNEL)

export const actions = {
  addOwnedChannel
}

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

export const reducer = handleActions(
  {
    [addOwnedChannel]: (state, { payload: { channels } }) => produce(state, (draft) => {
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
