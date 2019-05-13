import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { uriToChannel } from '../../zbay/channels'
import { typeFulfilled, typeRejected, typePending, errorNotification } from './utils'
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
  CLEAR_CHANNEL: 'CLEAR_IMPORTED_CHANNEL'
}

const decodeChannel = createAction(actionTypes.DECODE_CHANNEL, uriToChannel)
const clear = createAction(actionTypes.CLEAR_CHANNEL)

const actions = {
  decodeChannel,
  clear
}

const importChannel = () => async (dispatch, getState) => {
  const state = getState()
  const identityId = identitySelectors.id(state)
  const channel = importedChannelSelectors.data(state).toJS()
  try {
    await getVault().channels.importChannel(identityId, channel)
    await getClient().keys.importSK({ sk: channel.keys.sk, address: channel.address })
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
  try {
    await dispatch(decodeChannel(uri))
  } catch (err) {
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: 'Invalid channel URI' })
      )
    )
  }
}

const epics = {
  importChannel,
  decodeChannel: decodeChannelEpic
}

const reducer = handleActions({
  [typePending(actionTypes.DECODE_CHANNEL)]: (state, { payload: errors }) => state
    .set('errors', '')
    .set('decoding', true),
  [typeFulfilled(actionTypes.DECODE_CHANNEL)]: (state, { payload: channel }) => state
    .set('decoding', false)
    .set('data', Immutable.fromJS(channel)),
  [typeRejected(actionTypes.DECODE_CHANNEL)]: (state, { payload: errors }) => state
    .set('decoding', false)
    .set('errors', errors),
  [clear]: () => ImportedChannelState()
}, initialState)

export default {
  actions,
  epics,
  reducer
}
