import { produce, immerable } from 'immer'
import { createAction, handleActions } from 'redux-actions'

import { actionCreators } from './modals'
import identitySelector from '../selectors/identity'
import { actions as identityActions } from '../handlers/identity'
import {
  actionTypes,
  unknownUserId
} from '../../../shared/static'
import notificationsHandlers from './notifications'
import { ActionsType, PayloadType } from './types'

// TODO: to remove, but first replace in tests
export const _UserData = {
  firstName: '',
  publicKey: '',
  lastName: '',
  nickname: '',
  address: '',
  onionAddress: '',
  createdAt: 0
}

export class User {
  key?: string
  firstName: string = ''
  publicKey: string = ''
  lastName: string = ''
  nickname: string = ''
  address: string = ''
  onionAddress: string = ''
  createdAt: number = 0

  constructor(values?: Partial<User>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

export interface UsersStore {
  [key: string]: User
}

export const initialState: UsersStore = {}

export const setUsers = createAction<{ users: { [key: string]: User } }>(actionTypes.SET_USERS)
export const addUnknownUser = createAction(actionTypes.ADD_UNKNOWN_USER)
export const mockOwnUser = createAction<{ sigPubKey: string; nickname: string; address: string }>(
  actionTypes.MOCK_OWN_USER
)

export const actions = {
  setUsers,
  addUnknownUser,
  mockOwnUser
}

export type UserActions = ActionsType<typeof actions>

export const createOrUpdateUser = (payload: {
  nickname: string
  firstName?: string
  lastName?: string
  debounce?: boolean
  retry?: number
  updateOnionAddress?: boolean
}) => async (dispatch, getState) => {
  let { nickname } = payload
  const publicKey = identitySelector.signerPubKey(getState())
  const address = identitySelector.address(getState())

  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    nickname = `dev99${nickname}`.substring(0, 20)
  }

  dispatch(actionCreators.closeModal('accountSettingsModal')())

  try {
    dispatch(
      identityActions.setRegistraionStatus({
        nickname,
        status: 'IN_PROGRESS'
      })
    )
    dispatch(
      mockOwnUser({
        sigPubKey: publicKey,
        address,
        nickname
      })
    )
    dispatch(notificationsHandlers.actions.removeSnackbar('username'))
  } catch (err) {
    console.log(err)
    dispatch(
      identityActions.setRegistraionStatus({
        nickname,
        status: 'ERROR'
      })
    )
    dispatch(actionCreators.openModal('failedUsernameRegister')())
  }
}

export const epics = {
  createOrUpdateUser
}

export const reducer = handleActions<UsersStore, PayloadType<UserActions>>(
  {
    [setUsers.toString()]: (state, { payload: { users } }: UserActions['setUsers']) => {
      return produce(state, draft => {
        const usersObj = {
          ...draft,
          ...users
        }
        return usersObj
      })
    },
    [addUnknownUser.toString()]: state =>
      produce(state, draft => {
        draft[unknownUserId] = new User({
          key: unknownUserId,
          nickname: 'Unknown',
          address: unknownUserId
        })
      }),
    [mockOwnUser.toString()]: (
      state,
      { payload: { sigPubKey, nickname, address } }: UserActions['mockOwnUser']
    ) =>
      produce(state, draft => {
        draft[sigPubKey] = new User({
          publicKey: sigPubKey,
          nickname,
          address
        })
      })
  },
  initialState
)

export default {
  reducer,
  epics,
  actions
}
