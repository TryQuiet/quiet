import { takeLatest, all as effectsAll, select } from 'redux-saga/effects'
import { ChatMessages } from './actionsTypes'
import channelSelectors from '../../store/selectors/channel'

const all: any = effectsAll

export function* sendMessage (): Generator {
  const messageToSend = yield select(channelSelectors.message)
  const channelAddress = yield 
}

export function* publicChannelsSaga () {
  yield all([
    takeLatest(ChatMessages.SEND_MESSAGE, sendMessage)
  ])
}
