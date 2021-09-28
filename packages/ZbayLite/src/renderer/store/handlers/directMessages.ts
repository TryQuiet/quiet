import { produce, immerable } from 'immer'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'

import { actionTypes } from '../../../shared/static'
import { ActionsType, PayloadType } from './types'
// import { directMessagesActions } from '../../sagas/directMessages/directMessages.reducer'

import { constants } from '../../cryptography/cryptography'
import debug from 'debug'
const _log = Object.assign(debug('zbay:dm'), {
  error: debug('zbay:dm:err')
})

interface IUser {
  nickname: string
  publicKey: string
  halfKey: string
}

export interface IConversation {
  sharedSecret: string
  contactPublicKey: string
  conversationId: string
}

export class DirectMessages {
  users: { [key: string]: IUser }
  conversations: { [key: string]: IConversation }
  conversationsList: { [key: string]: string }
  publicKey: string
  privateKey: string
  isAdded?: boolean
  constructor(values?: Partial<DirectMessages>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export type DirectMessagesStore = DirectMessages

export const initialState: DirectMessagesStore = {
  users: {},
  conversations: {},
  conversationsList: {},
  privateKey: '',
  publicKey: ''
}

const fetchUsers = createAction<{ usersList: { [key: string]: IUser } }>(actionTypes.FETCH_USERS)
const setPublicKey = createAction<string>(actionTypes.SET_PUBLIC_KEY)
const setPrivateKey = createAction<string>(actionTypes.SET_PRIVATE_KEY)
const addConversation = createAction<IConversation>(actionTypes.ADD_CONVERSATION)
const fetchConversations = createAction<{ conversationsList: { [key: string]: string } }>(
  actionTypes.FETCH_CONVERSATIONS
)

export const actions = {
  fetchUsers,
  setPublicKey,
  setPrivateKey,
  addConversation,
  fetchConversations
}

export type DirectMessagesActions = ActionsType<typeof actions>

const generateDiffieHellman = () => async dispatch => {
  const dh = crypto.createDiffieHellman(constants.prime, 'hex', constants.generator, 'hex')
  dh.generateKeys()
  const privateKey = dh.getPrivateKey('hex')
  const publicKey = dh.getPublicKey('hex')

  await dispatch(actions.setPrivateKey(privateKey))
  await dispatch(actions.setPublicKey(publicKey))
}

export const getPrivateConversations = () => _dispatch => {
  // dispatch(directMessagesActions.getPrivateConversations())
}

const subscribeForAllConversations = () => async _dispatch => {
  // await dispatch(directMessagesActions.subscribeForAllConversations())
}

const getAvailableUsers = () => async _dispatch => {
  // await dispatch(directMessagesActions.getAvailableUsers())
}

export const epics = {
  generateDiffieHellman,
  getAvailableUsers,
  getPrivateConversations,
  subscribeForAllConversations
}

export const reducer = handleActions<DirectMessagesStore, PayloadType<DirectMessagesActions>>(
  {
    [fetchUsers.toString()]: (
      state,
      { payload: { usersList } }: DirectMessagesActions['fetchUsers']
    ) =>
      produce(state, draft => {
        draft.users = {
          ...draft.users,
          ...usersList
        }
      }),
    [fetchConversations.toString()]: (
      state,
      { payload: { conversationsList } }: DirectMessagesActions['fetchConversations']
    ) =>
      produce(state, draft => {
        draft.conversationsList = {
          ...draft.conversationsList,
          ...conversationsList
        }
      }),
    [setPublicKey.toString()]: (
      state,
      { payload: publicKey }: DirectMessagesActions['setPublicKey']
    ) =>
      produce(state, draft => {
        draft.publicKey = publicKey
      }),
    [setPrivateKey.toString()]: (
      state,
      { payload: privateKey }: DirectMessagesActions['setPrivateKey']
    ) =>
      produce(state, draft => {
        draft.privateKey = privateKey
      }),
    [addConversation.toString()]: (
      state,
      { payload: conversation }: DirectMessagesActions['addConversation']
    ) =>
      produce(state, draft => {
        draft.conversations = {
          ...draft.conversations,
          [conversation.conversationId]: conversation
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
