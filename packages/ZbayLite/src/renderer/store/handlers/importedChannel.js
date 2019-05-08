import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { uriToChannel } from '../../zbay/channels'
import { typeFulfilled, typeRejected, typePending } from './utils'
import identitySelectors from '../selectors/identity'
import importedChannelSelectors from '../selectors/importedChannel'
import channelsHandlers from './channels'
import notificationsHandlers from './notifications'
import { getVault } from '../../vault'
import { notifierAction } from '../../components/ui/DismissSnackbarAction'

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
  const identity = identitySelectors.data(state)
  const channel = importedChannelSelectors.data(state)
  try {
    await getVault().channels.importChannel(identity.id, channel.toJS())
    await dispatch(channelsHandlers.actions.loadChannels(identity.id))
    const channelName = channel.get('name')
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar({
        message: `Successfully imported channel ${channelName}`,
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
      notificationsHandlers.actions.enqueueSnackbar({
        message: 'Invalid channel URI',
        options: {
          persist: true,
          variant: 'error',
          action: notifierAction
        }
      })

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
