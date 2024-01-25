import { takeEvery } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { usersActions } from './users.slice'
import { saveUserProfileSaga } from './userProfile/saveUserProfile.saga'

export function* usersMasterSaga(socket: Socket): Generator {
  yield all([takeEvery(usersActions.saveUserProfile.type, saveUserProfileSaga, socket)])
}
