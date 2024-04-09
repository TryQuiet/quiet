import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { LogBox, StatusBar } from 'react-native'

import WebviewCrypto from 'react-native-webview-crypto'

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

import { MenuProvider } from 'react-native-popup-menu'
import { ScreenNames } from './const/ScreenNames.enum'
import { ChannelScreen } from './screens/Channel/Channel.screen'
import { ChannelListScreen } from './screens/ChannelList/ChannelList.screen'
import { ConnectionProcessScreen } from './screens/ConnectionProcess/ConnectionProcess.screen'
import { CreateChannelScreen } from './screens/CreateChannel/CreateChannel.screen'
import { CreateCommunityScreen } from './screens/CreateCommunity/CreateCommunity.screen'
import { DeleteChannelScreen } from './screens/DeleteChannel/DeleteChannel.screen'
import { ErrorScreen } from './screens/Error/Error.screen'
import { JoinCommunityScreen } from './screens/JoinCommunity/JoinCommunity.screen'
import { LeaveCommunityScreen } from './screens/LeaveCommunity/LeaveCommunity.screen'
import { NotifierScreen } from './screens/Notifier/Notifier.screen'
import { QRCodeScreen } from './screens/QRCode/QRCode.screen'
import { SplashScreen } from './screens/Splash/Splash.screen'
import { SuccessScreen } from './screens/Success/Success.screen'
import { UsernameRegistrationScreen } from './screens/UsernameRegistration/UsernameRegistration.screen'

import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { navigationRef } from './RootNavigation'
import { initActions } from './store/init/init.slice'
import { navigationActions } from './store/navigation/navigation.slice'

import { rootSaga } from './store/root.saga'
import { sagaMiddleware } from './store/store'

import { ThemeProvider } from 'styled-components'
import { defaultTheme } from './styles/themes/default.theme'

import { ChannelContextMenu } from './components/ContextMenu/menus/ChannelContextMenu.container'
import { CommunityContextMenu } from './components/ContextMenu/menus/CommunityContextMenu.container'
import { InvitationContextMenu } from './components/ContextMenu/menus/InvitationContextMenu.container'

import { ConfirmationBox } from './components/ConfirmationBox/ConfirmationBox.component'
import { useConfirmationBox } from './hooks/useConfirmationBox'

import StoreProvider from './Provider'

import { RootStackParamList } from './route.params'
import { DuplicatedUsernameScreen } from './screens/DuplicatedUsername/DuplicatedUsername.screen'

import { UnregisteredUsernameContextMenu } from './components/ContextMenu/menus/UnregisteredUsernameContextMenu.container'
import NewUsernameRequestedScreen from './screens/NewUsernameRequested/NewUsernameRequested.screen'
import { PossibleImpersonationAttackScreen } from './screens/PossibleImpersonationAttack/PossibleImpersonationAttack.screen'
import UsernameTakenScreen from './screens/UsernameTaken/UsernameTaken.screen'

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

  useEffect(() => {
    console.log('LAUNCHED APPLICATION: ', (Math.random() + 1).toString(36).substring(7))
  }, [])

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
                <Screen component={ChannelListScreen} name={ScreenNames.ChannelListScreen} />
                <Screen component={ChannelScreen} name={ScreenNames.ChannelScreen} />
                <Screen component={CreateChannelScreen} name={ScreenNames.CreateChannelScreen} />
                <Screen component={CreateCommunityScreen} name={ScreenNames.CreateCommunityScreen} />
                <Screen component={ConnectionProcessScreen} name={ScreenNames.ConnectionProcessScreen} />
                <Screen component={DeleteChannelScreen} name={ScreenNames.DeleteChannelScreen} />
                <Screen component={ErrorScreen} name={ScreenNames.ErrorScreen} />
                <Screen component={DuplicatedUsernameScreen} name={ScreenNames.DuplicatedUsernameScreen} />
                <Screen component={UsernameTakenScreen} name={ScreenNames.UsernameTakenScreen} />
                <Screen component={NewUsernameRequestedScreen} name={ScreenNames.NewUsernameRequestedScreen} />
                <Screen
                  component={PossibleImpersonationAttackScreen}
                  name={ScreenNames.PossibleImpersonationAttackScreen}
                />
                <Screen component={JoinCommunityScreen} name={ScreenNames.JoinCommunityScreen} />
                <Screen component={LeaveCommunityScreen} name={ScreenNames.LeaveCommunityScreen} />
                <Screen component={NotifierScreen} name={ScreenNames.NotifierScreen} />
                <Screen component={QRCodeScreen} name={ScreenNames.QRCodeScreen} />
                <Screen component={SplashScreen} name={ScreenNames.SplashScreen} />
                <Screen component={SuccessScreen} name={ScreenNames.SuccessScreen} />
                <Screen component={UsernameRegistrationScreen} name={ScreenNames.UsernameRegistrationScreen} />
              </Navigator>
              <CommunityContextMenu />
              <ChannelContextMenu />
              <InvitationContextMenu />
              <UnregisteredUsernameContextMenu />
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
