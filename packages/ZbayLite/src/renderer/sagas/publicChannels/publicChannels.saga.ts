import { all as effectsAll, takeEvery } from 'redux-saga/effects'
import { publicChannelsActions, PublicChannelsActions } from './publicChannels.reducer'
// import channelSelectors from '../../store/selectors/channel'

const all: any = effectsAll

export function* sendMessage (action: PublicChannelsActions['sendMessage']): Generator {
  console.log('working')
  const { payload } = action
  console.log(payload, 'test')
}

export function* publicChannelsSaga () {
  yield all([
    takeEvery(`${publicChannelsActions.sendMessage}`, sendMessage)
  ])
}
