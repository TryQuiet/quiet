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
import { CreateChannelScreen } from './screens/CreateChannel/CreateChannel.screen'
import { DeleteChannelScreen } from './screens/DeleteChannel/DeleteChannel.screen'
import { QRCodeScreen } from './screens/QRCode/QRCode.screen'
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
import { ChannelContextMenu } from './components/ContextMenu/menus/ChannelContextMenu.container'
import { InvitationContextMenu } from './components/ContextMenu/menus/InvitationContextMenu.container'

import { useConfirmationBox } from './hooks/useConfirmationBox'
import { ConfirmationBox } from './components/ConfirmationBox/ConfirmationBox.component'

import StoreProvider from './Provider'
import { RootStackParamList } from './route.params'
import ConnectionProcessScreen from './screens/ConnectionProcess/ConnectionProcess.screen'

LogBox.ignoreAllLogs()

const { Navigator, Screen } = createNativeStackNavigator<RootStackParamList>()

sagaMiddleware.run(rootSaga)

const linking = {
  prefixes: ['quiet://'],
  config: {
    screens: {
      SplashScreen: '',
    },
  },
}

function App(): JSX.Element {
  const dispatch = useDispatch()

  const confirmationBox = useConfirmationBox()

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer
          ref={navigationRef}
          linking={linking}
          onReady={() => {
            dispatch(navigationActions.redirection())
          }}
        >
          <WebviewCrypto />
          <MenuProvider>
            <ThemeProvider theme={defaultTheme}>
              <StatusBar backgroundColor={defaultTheme.palette.background.white} barStyle={'dark-content'} />
              <Navigator
                initialRouteName={ScreenNames.SplashScreen}
                screenOptions={{
                  headerShown: false,
                }}
              >
                <Screen component={CreateCommunityScreen} name={ScreenNames.CreateCommunityScreen} />
                <Screen component={SplashScreen} name={ScreenNames.SplashScreen} />
                <Screen component={LeaveCommunityScreen} name={ScreenNames.LeaveCommunityScreen} />
                <Screen component={JoinCommunityScreen} name={ScreenNames.JoinCommunityScreen} />
                <Screen component={UsernameRegistrationScreen} name={ScreenNames.UsernameRegistrationScreen} />
                <Screen component={ChannelListScreen} name={ScreenNames.ChannelListScreen} />
                <Screen component={ConnectionProcessScreen} name={ScreenNames.ConnectionProcessScreen} />
                <Screen component={ChannelScreen} name={ScreenNames.ChannelScreen} />
                <Screen component={CreateChannelScreen} name={ScreenNames.CreateChannelScreen} />
                <Screen component={DeleteChannelScreen} name={ScreenNames.DeleteChannelScreen} />
                <Screen component={QRCodeScreen} name={ScreenNames.QRCodeScreen} />
                <Screen component={SuccessScreen} name={ScreenNames.SuccessScreen} />
                <Screen component={ErrorScreen} name={ScreenNames.ErrorScreen} />
              </Navigator>
              <CommunityContextMenu />
              <ChannelContextMenu />
              <InvitationContextMenu />
              <ConfirmationBox {...confirmationBox} />
            </ThemeProvider>
          </MenuProvider>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

export default () => (
  <StoreProvider>
    <App />
  </StoreProvider>
)
