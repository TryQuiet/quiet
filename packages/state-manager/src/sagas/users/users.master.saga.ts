import { takeEvery, cancelled } from 'redux-saga/effects'
import { all } from 'typed-redux-saga'
import { type Socket } from '../../types'
import { usersActions } from './users.slice'
import { saveUserProfileSaga } from './userProfile/saveUserProfile.saga'

export function* usersMasterSaga(socket: Socket): Generator {
  console.log('usersMasterSaga starting')
  try {
    yield all([takeEvery(usersActions.saveUserProfile.type, saveUserProfileSaga, socket)])
  } finally {
    console.log('usersMasterSaga stopping')
    if (yield cancelled()) {
      console.log('usersMasterSaga cancelled')
    }
  }
}
