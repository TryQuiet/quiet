import Config from 'react-native-config'
import DevMenu from 'react-native-dev-menu'
import { NodeEnv } from './utils/const/NodeEnv.enum'
import { store } from './store/store'

if (Config.NODE_ENV === NodeEnv.Development) {
  DevMenu.addItem('Get store state', () => {
    console.info(JSON.stringify(store.getState(), null, 2))
  })
}
