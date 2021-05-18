import { produce, immerable } from 'immer'
import crypto from 'crypto'
import { createAction, handleActions } from 'redux-actions'

import directMessagesSelectors from '../selectors/directMessages'
import identitySelectors from '../selectors/identity'
import channelSelectors from '../selectors/channel'

import { actionTypes } from '../../../shared/static'
import { ActionsType, PayloadType } from './types'
import { directMessagesActions } from '../../sagas/directMessages/directMessages.reducer'

import { encodeMessage, constants } from '../../cryptography/cryptography'

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
  users: {
    '02dc8264c555d46b3f6b16f1e751e979ebc69e6df6a02e7d4074a5df981e507da2': {
      nickname: 'holmes',
      publicKey: '02dc8264c555d46b3f6b16f1e751e979ebc69e6df6a02e7d4074a5df981e507da2',
      halfKey: '279e40e4ad5bc84f6cfcdb90465317e61255ba7ee78600179ea129a77e1bcef4'
    }
  },
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

export const getPrivateConversations = () => dispatch => {
  console.log('getPRivateConversationsEpic')
  dispatch(directMessagesActions.getPrivateConversations())
}

const initializeConversation = () => async (dispatch, getState) => {
  const contactPublicKey = channelSelectors.channel(getState()).id

  const myPublicKey = identitySelectors.signerPubKey(getState())

  const halfKey = directMessagesSelectors.user(contactPublicKey)(getState()).halfKey

  const dh = crypto.createDiffieHellman(constants.prime, 'hex', constants.generator, 'hex')
  dh.generateKeys()

  const pubKey = dh.getPublicKey('hex')

  const sharedSecret = dh.computeSecret(halfKey, 'hex').toString('hex')

  const encryptedPhrase = encodeMessage(sharedSecret, `no panic${myPublicKey}`)

  dispatch(
    actions.addConversation({
      sharedSecret,
      contactPublicKey: contactPublicKey,
      conversationId: pubKey
    })
  )

  await dispatch(
    directMessagesActions.initializeConversation({
      address: pubKey,
      encryptedPhrase
    })
  )
}

const getAvailableUsers = () => async dispatch => {
  console.log('EPICS GET AVAILABLE USERS')
  await dispatch(directMessagesActions.getAvailableUsers())
}

export const epics = {
  generateDiffieHellman,
  getAvailableUsers,
  initializeConversation,
  getPrivateConversations
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
          [conversation.contactPublicKey]: conversation
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
