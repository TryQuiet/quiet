import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { uriToChannel } from '../../zbay/channels'
import { errorNotification } from './utils'
import identitySelectors from '../selectors/identity'
import importedChannelSelectors from '../selectors/importedChannel'
import channelsHandlers from './channels'
import notificationsHandlers from './notifications'
import { getVault } from '../../vault'
import { getClient } from '../../zcash'

export const ImportedChannelState = Immutable.Record({
  data: null,
  decoding: false,
  errors: ''
}, 'ImportedChannelState')

const initialState = ImportedChannelState()

export const actionTypes = {
  DECODE_CHANNEL: 'DECODE_IMPORTED_CHANNEL',
  SET_DECODED_CHANNEL: 'SET_DECODED_CHANNEL',
  SET_DECODING_CHANNEL: 'SET_DECODING_CHANNEL',
  SET_DECODING_ERROR: 'SET_DECODING_ERROR',
  CLEAR_CHANNEL: 'CLEAR_IMPORTED_CHANNEL'
}

const setData = createAction(actionTypes.SET_DECODED_CHANNEL)
const setDecoding = createAction(actionTypes.SET_DECODING_CHANNEL)
const setDecodingError = createAction(actionTypes.SET_DECODING_ERROR)
const clear = createAction(actionTypes.CLEAR_CHANNEL)

const actions = {
  clear,
  setData,
  setDecoding,
  setDecodingError
}

const importChannel = () => async (dispatch, getState) => {
  const state = getState()
  const identityId = identitySelectors.id(state)
  const channel = importedChannelSelectors.data(state).toJS()
  try {
    await getVault().channels.importChannel(identityId, channel)
    if (channel.keys.sk) {
      await getClient().keys.importSK({ sk: channel.keys.sk, address: channel.address })
    } else {
      await getClient().keys.importIVK({ ivk: channel.keys.ivk, address: channel.address })
    }
    await dispatch(channelsHandlers.actions.loadChannels(identityId))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar({
        message: `Successfully imported channel ${channel.name}`,
        options: {
          variant: 'success'
        }
      })
    )
    dispatch(clear())
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar({
        message: err.message,
        options: {
          variant: 'error'
        }
      })
    )
  }
}

const decodeChannelEpic = (uri) => async (dispatch) => {
  dispatch(setDecoding(true))
  try {
    const channel = await uriToChannel(uri)
    dispatch(setData(channel))
  } catch (err) {
    dispatch(setDecodingError(err))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: `Invalid channel URI: ${err.message}` })
      )
    )
  }
  dispatch(setDecoding(false))
}

const epics = {
  importChannel,
  decodeChannel: decodeChannelEpic
}

const reducer = handleActions({
  [actionTypes.SET_DECODED_CHANNEL]: (state, { payload: channel }) => state.set('data', Immutable.fromJS(channel)),
  [actionTypes.SET_DECODING_CHANNEL]: (state, { payload: decoding }) => state.set('decoding', decoding),
  [actionTypes.SET_DECODING_ERROR]: (state, { payload: error }) => state.set('errors', error),
  [clear]: () => ImportedChannelState()
}, initialState)

export default {
  actions,
  epics,
  reducer
}
