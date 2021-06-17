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

const { Navigator, Screen } = createStackNavigator();

sagaMiddleware.run(rootSaga);

export default function App(): JSX.Element {
  const dispatch = useDispatch();

  return (
    <PersistGate loading={null} persistor={persistor}>
      <NavigationContainer
        ref={navigationContainerRef}
        onReady={() => {
          dispatch(initActions.doOnRestore());
        }}>
        <ThemeProvider theme={defaultTheme}>
          <StatusBar backgroundColor={defaultTheme.palette.statusBar.main} />
          <Navigator
            initialRouteName={ScreenNames.SplashScreen}
            screenOptions={{
              headerShown: false,
            }}>
            <Screen component={SplashScreen} name={ScreenNames.SplashScreen} />
            <Screen component={MainScreen} name={ScreenNames.MainScreen} />
            <Screen component={ErrorScreen} name={ScreenNames.ErrorScreen} />
          </Navigator>
        </ThemeProvider>
      </NavigationContainer>
    </PersistGate>
  );
}
