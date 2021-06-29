import { AppRegistry, NativeModules, Platform } from 'react-native';
import { call, select } from 'typed-redux-saga';
import { pushNotifications } from '../../../services/pushNotifications/pushNotifications.service';
import { publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors';
import { ChannelMessages } from '../../publicChannels/publicChannels.slice';

export function* pushNotificationsSaga(): Generator {
  if (Platform.OS === 'android') {
    const persistentData = yield* select(
      publicChannelsSelectors.channelMessages,
    );
    yield* call(initPushNotifications, persistentData);
  }
}

export const initPushNotifications = (persistentData: ChannelMessages) => {
  AppRegistry.registerHeadlessTask('pushNotifications', () =>
    pushNotifications.bind(persistentData),
  );
  /* Start service to handle notifications for incoming messages, even when the app is in background */
  NativeModules.Integrator.initPushNotifications();
};
