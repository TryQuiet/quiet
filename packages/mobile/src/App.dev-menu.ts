import Config from 'react-native-config'
import DevMenu from 'react-native-dev-menu'
import { NodeEnv } from './utils/const/NodeEnv.enum'
import { store } from './store/store'
import { communities, publicChannels } from '@quiet/state-manager'
import { ToastAndroid } from 'react-native'

if (Config.NODE_ENV === NodeEnv.Development) {
  void DevMenu.addItem('Get store state', () => {
    console.info(JSON.stringify(store.getState(), null, 2))
  })

  void DevMenu.addItem('Switch channel', () => {
    const channels = publicChannels.selectors.publicChannels(store.getState())
    const currentChannel = publicChannels.selectors.currentChannel(store.getState())
    const currentChannelIndex = channels.indexOf(
      channels.find(channel => channel.name === currentChannel.name)
    )
    let nextChannelIndex: number
    if (currentChannelIndex === channels.length - 1) {
      nextChannelIndex = 0
    } else {
      nextChannelIndex = currentChannelIndex + 1
    }
    const channel = channels[nextChannelIndex]
    ToastAndroid.show(channel.name, ToastAndroid.SHORT)
    store.dispatch(
      publicChannels.actions.setCurrentChannel({
        channelAddress: channel.name
      })
    )
  })
}
