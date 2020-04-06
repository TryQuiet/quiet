import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

import { uriToChannel } from '../../zbay/channels'
import { errorNotification } from './utils'
import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'
import channelsSelectors from '../selectors/channels'
import logsHandlers from '../handlers/logs'
import importedChannelSelectors from '../selectors/importedChannel'
import channelsHandlers from './channels'
import notificationsHandlers from './notifications'
import { getVault } from '../../vault'
import { getClient } from '../../zcash'
import channels from '../../zcash/channels'
import nodeSelectors from '../selectors/node'
import modalsHandlers from './modals'
import { actionTypes } from '../../../shared/static'

export const ImportedChannelState = Immutable.Record(
  {
    data: null,
    decoding: false,
    errors: ''
  },
  'ImportedChannelState'
)

const initialState = ImportedChannelState()

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

const removeChannel = history => async (dispatch, getState) => {
  const state = getState()
  const identityId = identitySelectors.id(state)
  const channel = channelSelectors.channel(state).toJS()
  try {
    const network = nodeSelectors.network(getState())

    const generalChannel = channels.general[network]
    if (generalChannel.address !== channel.address) {
      await getVault().channels.removeChannel({ identityId, channelId: channel.address })
      dispatch(channelsHandlers.actions.loadChannels(identityId))
      history.push(`/main/channel/${channelsSelectors.generalChannelId(state)}`)
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar({
          message: `Successfully deleted channel`,
          options: {
            variant: 'success'
          }
        })
      )
      dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Removing channel ${channel.address}` }))
    } else {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar({
          message: 'General channel cannot be deleted',
          options: {
            variant: 'error'
          }
        })
      )
    }
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

const importChannel = () => async (dispatch, getState) => {
  const state = getState()
  const identityId = identitySelectors.id(state)
  const channel = importedChannelSelectors.data(state).toJS()
  const lastblock = nodeSelectors.latestBlock(getState())
  const fetchTreshold = lastblock - 2000
  try {
    await getVault().channels.importChannel(identityId, channel)
    if (channel.keys.sk) {
      await getClient().keys.importSK({
        sk: channel.keys.sk,
        rescan: 'yes',
        startHeight: fetchTreshold
      })
    } else {
      await getClient().keys.importIVK({
        ivk: channel.keys.ivk,
        rescan: 'yes',
        startHeight: fetchTreshold
      })
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
    dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Successfully imported channel ${channel.name}` }))
    dispatch(modalsHandlers.actionCreators.closeModal('importChannelModal')())
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

const decodeChannelEpic = uri => async (dispatch, getState) => {
  dispatch(setDecoding(true))
  try {
    const channel = await uriToChannel(uri)
    const allChannels = channelsSelectors.data(getState())
    if (allChannels.find(ch => ch.get('address') === channel.address)) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          errorNotification({ message: `You already imported this channel` })
        )
      )
      dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Channel already imported ${channel.address}` }))
    } else {
      dispatch(setData(channel))
      const openModal = modalsHandlers.actionCreators.openModal('importChannelModal')
      dispatch(openModal())
    }
  } catch (err) {
    dispatch(setDecodingError(err))
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar(
        errorNotification({ message: `Invalid channel URI: ${err.message}` })
      )
    )
    dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Invalid channel URI` }))
  }
  dispatch(setDecoding(false))
}

const epics = {
  importChannel,
  removeChannel,
  decodeChannel: decodeChannelEpic
}

const reducer = handleActions(
  {
    [actionTypes.SET_DECODED_CHANNEL]: (state, { payload: channel }) =>
      state.set('data', Immutable.fromJS(channel)),
    [actionTypes.SET_DECODING_CHANNEL]: (state, { payload: decoding }) =>
      state.set('decoding', decoding),
    [actionTypes.SET_DECODING_ERROR]: (state, { payload: error }) => state.set('errors', error),
    [clear]: () => ImportedChannelState()
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
