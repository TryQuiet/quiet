import {
  NativeModules,
  Platform,
  NativeEventEmitter,
  DeviceEventEmitter
} from 'react-native'

export default Platform.select({
  ios: new NativeEventEmitter(NativeModules.TorModule),
  android: DeviceEventEmitter
})
