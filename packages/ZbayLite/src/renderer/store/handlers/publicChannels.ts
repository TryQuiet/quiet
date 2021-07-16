import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'
import { publicChannelsActions } from '../../sagas/publicChannels/publicChannels.reducer'
import { actionTypes } from '../../../shared/static'
import { ActionsType, PayloadType } from './types'
import contactsSelectors from '../selectors/contacts'
import publicChannelsSelectors from '../selectors/publicChannels'
import debug from 'debug'
const log = Object.assign(debug('zbay:channels'), {
  error: debug('zbay:channels:err')
})

// Used only in some tests
export const _PublicChannelData = {
  address: '',
  name: '',
  description: '',
  owner: '',
  timestamp: 0,
  keys: {}
}

export class PublicChannel {
  address: string
  name: string
  description: string
  owner: string
  keys: { ivk?: string; sk?: string }
  timestamp: number

  constructor(values: Partial<PublicChannel>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export interface PublicChannelsStore {
  [name: string]: PublicChannel
}

export const initialState: PublicChannelsStore = {}

export const setPublicChannels = createAction<{ [name: string]: PublicChannel }>(
  actionTypes.SET_PUBLIC_CHANNELS
)

export const clearPublicChannels = createAction(
  actionTypes.CLEAR_PUBLIC_CHANNELS
)

export const actions = {
  setPublicChannels,
  clearPublicChannels
}

export type PublicChannelsActions = ActionsType<typeof actions>

export const updatePublicChannels = (channels) => async dispatch => {
  await dispatch(setPublicChannels(channels))
}

export const loadPublicChannels = () => async dispatch => {
  /** Get public channels from db */
  await dispatch(publicChannelsActions.getPublicChannels())
}

export const subscribeForPublicChannels = () => async (dispatch, getState) => {
  /** Subscribe for public channels from contacts (joined public channels) */
  const publicChannelsContacts = contactsSelectors.publicChannelsContacts(getState())
  for (const publicChannel of publicChannelsContacts) {
    const channel = publicChannelsSelectors.publicChannelsByName(publicChannel.username)(getState())
    log('subscribing for ', channel.name)
    if (channel) {
      dispatch(publicChannelsActions.subscribeForTopic(channel))
    }
  }
}

export const epics = {
  updatePublicChannels,
  loadPublicChannels,
  subscribeForPublicChannels
}

export const reducer = handleActions<PublicChannelsStore, PayloadType<PublicChannelsActions>>(
  {
    [setPublicChannels.toString()]: (
      state,
      { payload: publicChannels }: PublicChannelsActions['setPublicChannels']
    ) =>
      produce(state, draft => {
        return {
          ...draft,
          ...publicChannels
        }
      }),
    [clearPublicChannels.toString()]: (
      state
    ) =>
      produce(state, () => {
        return {}
      })
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
