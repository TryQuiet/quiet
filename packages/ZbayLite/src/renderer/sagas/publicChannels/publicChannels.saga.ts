import { takeLatest, all as effectsAll } from 'redux-saga/effects'
import { ChatMessages } from './actionsTypes'
// import channelSelectors from '../../store/selectors/channel'

const all: any = effectsAll

export function* sendMessage (): Generator {
  console.log('test')
}

export function* publicChannelsSaga () {
  yield all([
    takeLatest(ChatMessages.SEND_MESSAGE, sendMessage)
  ])
}
