import { NativeModules, NativeEventEmitter } from 'react-native'

export default new NativeEventEmitter(NativeModules.CommunicationModule)
