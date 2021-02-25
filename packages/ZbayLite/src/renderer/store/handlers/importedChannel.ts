import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import { uriToChannel } from '../../zbay/channels'
import { errorNotification } from './utils'
import channelSelectors from '../selectors/channel'
import channelsSelectors from '../selectors/channels'
import identityHandlers from './identity'
import importedChannelSelectors from '../selectors/importedChannel'
import notificationsHandlers from './notifications'
import client from '../../zcash'
import channels from '../../zcash/channels'
import nodeSelectors from '../selectors/node'
import modalsHandlers from './modals'
import contactsHandlers from './contacts'
import { actionTypes } from '../../../shared/static'
import history from '../../../shared/history'
import electronStore from '../../../shared/electronStore'

import { PublicChannel } from './publicChannels'

import { ActionsType, PayloadType } from './types'

class ImportedChannel {
  data?: PublicChannel
  decoding: boolean
  errors: string

  constructor(values?: Partial<ImportedChannel>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export const initialState: ImportedChannel = {
  ...new ImportedChannel({
    data: null,
    decoding: false,
    errors: ''
  })
}

const setData = createAction<any>(actionTypes.SET_DECODED_CHANNEL)
const setDecoding = createAction<boolean>(actionTypes.SET_DECODING_CHANNEL)
const setDecodingError = createAction<string>(actionTypes.SET_DECODING_ERROR)
const clear = createAction(actionTypes.CLEAR_CHANNEL)

const actions = {
  clear,
  setData,
  setDecoding,
  setDecodingError
}

export type ImportedChannelActions = ActionsType<typeof actions>

const removeChannel = (history, isOffer = false) => async (dispatch, getState) => {
  const state = getState()
  const channel = channelSelectors.channel(state)
  try {
    const network = nodeSelectors.network()

    const generalChannel = channels.general[network]
    if (generalChannel.address !== channel.address) {
      if (isOffer) {
        electronStore.set(`removedChannels.${channel.id}`, channel)
      } else {
        electronStore.set(`removedChannels.${channel.address}`, channel)
      }
      const removedChannels = electronStore.get('removedChannels')
      dispatch(identityHandlers.actions.setRemovedChannels(Object.keys(removedChannels)))
      history.push(`/main/channel/${channelsSelectors.generalChannelId(state)}`)
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar({
          message: 'Successfully removed channel',
          options: {
            variant: 'success'
          }
        })
      )
    } else {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar({
          message: 'General channel cannot be removed',
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
  const channel = importedChannelSelectors.data(state)
  try {
    const importedChannels = electronStore.get('importedChannels') || {}
    electronStore.set(`channelsToRescan.${channel.address}`, true)
    electronStore.set('importedChannels', {
      ...importedChannels,
      [channel.address]: {
        address: channel.address,
        name: channel.name,
        description: channel.description,
        owner: '',
        keys: channel.keys
      }
    })
    await dispatch(
      contactsHandlers.actions.addContact({
        key: channel.address,
        contactAddress: channel.address,
        username: channel.name
      })
    )
    dispatch(
      notificationsHandlers.actions.enqueueSnackbar({
        message: `Successfully imported channel ${channel.name}`,
        options: {
          variant: 'success'
        }
      })
    )
    dispatch(modalsHandlers.actionCreators.closeModal('importChannelModal')())

    history.push(`/main/channel/${channel.address}`)
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

const decodeChannelEpic = uri => async dispatch => {
  dispatch(setDecoding(true))
  try {
    const channel = await uriToChannel(uri)

    const importedChannels = electronStore.get('importedChannels')
    let importAddress
    let checkImported = false
    const checkExisting = Object.values<PublicChannel>(importedChannels).filter(
      x => x.keys.ivk === channel.keys.ivk
    )
    if (checkExisting.length === 0) {
      const addressBefore = await client.addresses()
      await client.importKey(channel.keys.ivk)
      const addressAfter = await client.addresses()
      const addressesDifference = addressAfter.z_addresses.filter(
        x => !addressBefore.z_addresses.includes(x)
      )
      importAddress = addressesDifference[0]
      electronStore.set(`channelsToRescan.${importAddress}`, true)
    } else {
      importAddress = checkExisting[0].address
      checkImported = true
    }
    if (checkImported) {
      dispatch(
        notificationsHandlers.actions.enqueueSnackbar(
          errorNotification({ message: 'You already imported this channel' })
        )
      )
      history.push(`/main/channel/${importAddress}`)
    } else {
      dispatch(setData({ ...channel, address: importAddress }))
      const openModal = modalsHandlers.actionCreators.openModal('importChannelModal')
      dispatch(openModal())
    }
  } catch (err) {
    console.log('Error while decoding channel')
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
  removeChannel,
  decodeChannel: decodeChannelEpic
}

const reducer = handleActions<ImportedChannel, PayloadType<ImportedChannelActions>>(
  {
    [setData.toString()]: (state, { payload: channel }) =>
      produce(state, draft => {
        draft.data = {
          ...channel
        }
      }),
    [setDecoding.toString()]: (state, { payload: decoding }) =>
      produce(state, draft => {
        draft.decoding = decoding
      }),
    [setDecodingError.toString()]: (state, { payload: error }) =>
      produce(state, draft => {
        draft.errors = error
      }),
    [clear.toString()]: state =>
      produce(state, draft => {
        draft.data = null
        draft.decoding = false
        draft.errors = ''
      })
  },
  initialState
)

export default {
  actions,
  epics,
  reducer
}
