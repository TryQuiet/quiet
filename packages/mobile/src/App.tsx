import { SuccessScreen } from './screens/Success/Success.screen';
import { RegistrationScreen } from './screens/Registration/Registration.screen';
import WebviewCrypto from 'react-native-webview-crypto';
import { ErrorScreen } from './screens/Error/Error.screen';
import { MainScreen } from './screens/Main/Main.screen';
import React from 'react';
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
import { useNotifications } from './services/pushNotifications/pushNotifications.service';

const { Navigator, Screen } = createStackNavigator();

sagaMiddleware.run(rootSaga);

export default function App(): JSX.Element {
  const dispatch = useDispatch();

  useNotifications();

  return (
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
            <Screen component={SplashScreen} name={ScreenNames.SplashScreen} />
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
  );
}
