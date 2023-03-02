import './App.dev-menu'

import React, { useEffect } from 'react'
import { LogBox, StatusBar } from 'react-native'
import WebviewCrypto from 'react-native-webview-crypto'
import { useDispatch } from 'react-redux'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { ScreenNames } from './const/ScreenNames.enum'
import { SplashScreen } from './screens/Splash/Splash.screen'
import { JoinCommunityScreen } from './screens/JoinCommunity/JoinCommunity.screen'
import { UsernameRegistrationScreen } from './screens/UsernameRegistration/UsernameRegistration.screen'
import { SuccessScreen } from './screens/Success/Success.screen'
import { ErrorScreen } from './screens/Error/Error.screen'
import { ChannelListScreen } from './screens/ChannelList/ChannelList.screen'
import { ChannelScreen } from './screens/Channel/Channel.screen'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { navigationRef } from './RootNavigation'
import { PersistGate } from 'redux-persist/integration/react'
import { rootSaga } from './store/root.saga'
import { persistor, sagaMiddleware } from './store/store'
import { ThemeProvider } from 'styled-components'
import { defaultTheme } from './styles/themes/default.theme'
import { navigationActions } from './store/navigation/navigation.slice'
import PushNotificationIOS, {
  PushNotification
} from '@react-native-community/push-notification-ios'
import { MenuProvider } from 'react-native-popup-menu'

LogBox.ignoreAllLogs()

const { Navigator, Screen } = createNativeStackNavigator()

sagaMiddleware.run(rootSaga)

export const deviceRegistrationHandler = (deviceToken: string) => {
  console.log(`device token: ${deviceToken}`)
}

export const remoteNotificationHandler = (notification: PushNotification) => {
  console.log('quiet: handling incoming remote notification')
}

export default function App(): JSX.Element {
  const dispatch = useDispatch()

  useEffect(() => {
    PushNotificationIOS.addEventListener('register', deviceRegistrationHandler)

    PushNotificationIOS.addEventListener('notification', remoteNotificationHandler)

    return () => {
      PushNotificationIOS.removeEventListener('register')
      PushNotificationIOS.removeEventListener('notification')
    }
  }, [])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <PersistGate loading={null} persistor={persistor}>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => {
              dispatch(navigationActions.redirection())
            }}>
            <WebviewCrypto />
            <MenuProvider>
              <ThemeProvider theme={defaultTheme}>
                <StatusBar backgroundColor={defaultTheme.palette.background.white} />
                <Navigator
                  initialRouteName={ScreenNames.SplashScreen}
                  screenOptions={{
                    headerShown: false
                  }}>
                  <Screen component={SplashScreen} name={ScreenNames.SplashScreen} />
                  <Screen component={JoinCommunityScreen} name={ScreenNames.JoinCommunityScreen} />
                  <Screen
                    component={UsernameRegistrationScreen}
                    name={ScreenNames.UsernameRegistrationScreen}
                  />
                  <Screen component={ChannelListScreen} name={ScreenNames.ChannelListScreen} />
                  <Screen component={ChannelScreen} name={ScreenNames.ChannelScreen} />
                  <Screen component={SuccessScreen} name={ScreenNames.SuccessScreen} />
                  <Screen component={ErrorScreen} name={ScreenNames.ErrorScreen} />
                </Navigator>
              </ThemeProvider>
            </MenuProvider>
          </NavigationContainer>
        </PersistGate>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
