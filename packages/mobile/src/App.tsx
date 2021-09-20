import './App.dev-menu';

import { SuccessScreen } from './screens/Success/Success.screen';
import { RegistrationScreen } from './screens/Registration/Registration.screen';
import WebviewCrypto from 'react-native-webview-crypto';
import { ErrorScreen } from './screens/Error/Error.screen';
import { MainScreen } from './screens/Main/Main.screen';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from 'styled-components';
import { ScreenNames } from './const/ScreenNames.enum';
import { SplashScreen } from './screens/Splash/Splash.screen';
import { rootSaga } from './store/root.saga';
import { persistor, sagaMiddleware } from './store/store';
import { defaultTheme } from './styles/themes/default.theme';
import { navigationContainerRef } from './utils/functions/navigateTo/navigateTo';
import { initActions } from './store/init/init.slice';
import { useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import PushNotificationIOS, {
  PushNotification,
} from '@react-native-community/push-notification-ios';

const { Navigator, Screen } = createStackNavigator();

sagaMiddleware.run(rootSaga);

export const deviceRegistrationHandler = (deviceToken: string) => {
  console.log(`device token: ${deviceToken}`);
};

export const remoteNotificationHandler = (notification: PushNotification) => {
  console.log('zbay: handling incoming remote notification');
};

export default function App(): JSX.Element {
  const dispatch = useDispatch();

  useEffect(() => {
    PushNotificationIOS.addEventListener('register', deviceRegistrationHandler);

    PushNotificationIOS.addEventListener(
      'notification',
      remoteNotificationHandler,
    );

    return () => {
      PushNotificationIOS.removeEventListener('register');
      PushNotificationIOS.removeEventListener('notification');
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <PersistGate loading={null} persistor={persistor}>
        <NavigationContainer
          ref={navigationContainerRef}
          onReady={() => {
            dispatch(initActions.setNavigatorReady(true));
            dispatch(initActions.doOnRestore());
          }}>
          <WebviewCrypto />
          <ThemeProvider theme={defaultTheme}>
            <StatusBar backgroundColor={defaultTheme.palette.statusBar.main} />
            <Navigator
              initialRouteName={ScreenNames.SplashScreen}
              screenOptions={{
                headerShown: false,
              }}>
              <Screen
                component={SplashScreen}
                name={ScreenNames.SplashScreen}
              />
              <Screen
                component={RegistrationScreen}
                name={ScreenNames.RegistrationScreen}
              />
              <Screen component={MainScreen} name={ScreenNames.MainScreen} />
              <Screen
                component={SuccessScreen}
                name={ScreenNames.SuccessScreen}
              />
              <Screen component={ErrorScreen} name={ScreenNames.ErrorScreen} />
            </Navigator>
          </ThemeProvider>
        </NavigationContainer>
      </PersistGate>
    </SafeAreaView>
  );
}
