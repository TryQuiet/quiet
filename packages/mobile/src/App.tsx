import './App.dev-menu'

import React from 'react'
import { useDispatch } from 'react-redux'

import { LogBox, StatusBar } from 'react-native'

import WebviewCrypto from 'react-native-webview-crypto'

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import { MenuProvider } from 'react-native-popup-menu'

import { ScreenNames } from './const/ScreenNames.enum'

import { SplashScreen } from './screens/Splash/Splash.screen'
import { CreateCommunityScreen } from './screens/CreateCommunity/CreateCommunity.screen'
import { JoinCommunityScreen } from './screens/JoinCommunity/JoinCommunity.screen'
import { UsernameRegistrationScreen } from './screens/UsernameRegistration/UsernameRegistration.screen'
import { SuccessScreen } from './screens/Success/Success.screen'
import { ErrorScreen } from './screens/Error/Error.screen'
import { ChannelListScreen } from './screens/ChannelList/ChannelList.screen'
import { ChannelScreen } from './screens/Channel/Channel.screen'
import { LeaveCommunityScreen } from './screens/LeaveCommunity/LeaveCommunity.screen'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { navigationRef } from './RootNavigation'
import { navigationActions } from './store/navigation/navigation.slice'

import { sagaMiddleware } from './store/store'
import { rootSaga } from './store/root.saga'

import { ThemeProvider } from 'styled-components'
import { defaultTheme } from './styles/themes/default.theme'

import { CommunityContextMenu } from './components/ContextMenu/menus/CommunityContextMenu.container'
import { InvitationContextMenu } from './components/ContextMenu/menus/InvitationContextMenu.container'

LogBox.ignoreAllLogs()

const { Navigator, Screen } = createNativeStackNavigator()

sagaMiddleware.run(rootSaga)

const linking = {
  prefixes: [
    'quiet://'
  ],
  config: {
    screens: {
      SplashScreen: ''
    }
  }
}

export default function App(): JSX.Element {
  const dispatch = useDispatch()
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onReady={() => {
            dispatch(navigationActions.redirection())
          }}>
          <WebviewCrypto />
          <MenuProvider>
            <ThemeProvider theme={defaultTheme}>
              <StatusBar
                backgroundColor={defaultTheme.palette.background.white}
                barStyle={'dark-content'}
              />
              <Navigator
                initialRouteName={ScreenNames.SplashScreen}
                screenOptions={{
                  headerShown: false
                }}>
                <Screen
                  component={CreateCommunityScreen}
                  name={ScreenNames.CreateCommunityScreen}
                />
                <Screen component={SplashScreen} name={ScreenNames.SplashScreen} />
                <Screen component={LeaveCommunityScreen} name={ScreenNames.LeaveCommunityScreen} />
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
              <CommunityContextMenu />
              <InvitationContextMenu />
            </ThemeProvider>
          </MenuProvider>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}
