import React, { useEffect, useState } from 'react'
import { Button, Platform, StatusBar, Text, View } from 'react-native'
import { storiesOf } from '@storybook/react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { configureStore } from '@reduxjs/toolkit'
import { Provider, useSelector } from 'react-redux'
import createSagaMiddleware from 'redux-saga'
import { takeEvery } from 'typed-redux-saga'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import RNFS from 'react-native-fs'
import { ThemeProvider } from 'styled-components'
import { communities, publicChannels, users } from '@quiet/state-manager'
import { ChannelOperationStatus, CommunityOwnership, FileMetadata, MessageType } from '@quiet/types'

import { navigationRef } from '../../RootNavigation'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { RootStackParamList } from '../../route.params'
import { ChannelScreen } from '../../screens/Channel/Channel.screen'
import { ChannelListScreen } from '../../screens/ChannelList/ChannelList.screen'
import { allReducers } from '../../store/root.reducer'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { navigationSaga } from '../../store/navigation/navigation/navigation.saga'
import { defaultTheme } from '../../styles/themes/default.theme'
import { ImagePreviewModal } from '../ImageAttachmentPreview/ImageAttachmentPreview.component'
import { quietIconBase64 } from './quietIcon.fixture'

const Stack = createNativeStackNavigator<RootStackParamList>()
const imagePath = `${RNFS.CachesDirectoryPath}/android-compatibility-preview.png`

// Only navigation sagas run here. The Storybook build already disables the
// backend worker; this fixture never imports App, the persisted store, or rootSaga.
function* watchNavigation(): Generator {
  yield* takeEvery(navigationActions.navigation.type, navigationSaga)
}

const createFixture = () => {
  const sagaMiddleware = createSagaMiddleware()
  const store = configureStore({ reducer: allReducers, middleware: [sagaMiddleware] })

  store.dispatch(
    communities.actions.addNewCommunity({
      id: 'android-compatibility',
      name: 'Android compatibility',
      teamId: 'android-compatibility-team',
      ownership: CommunityOwnership.User,
    })
  )
  store.dispatch(communities.actions.setCurrentCommunity('android-compatibility'))
  store.dispatch(users.actions.setUserProfile({ userId: 'storybook-user', nickname: 'Alice' }))
  store.dispatch(
    publicChannels.actions.addChannel({
      status: ChannelOperationStatus.SUCCESS,
      channel: {
        id: 'general',
        name: 'general',
        description: 'Android system Back fixture',
        owner: 'storybook-user',
        timestamp: 1700000000,
        public: true,
        teamId: 'android-compatibility-team',
      },
    })
  )
  store.dispatch(
    publicChannels.actions.cacheMessages({
      channelId: 'general',
      messages: [
        {
          id: 'android-compatibility-message',
          userId: 'storybook-user',
          channelId: 'general',
          createdAt: 1700000000,
          type: MessageType.Basic,
          message: 'Use Android Back to dismiss the keyboard, then return to the channel list.',
        },
      ],
    })
  )
  store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: '' }))

  return { store, sagaMiddleware }
}

const previewData: FileMetadata = {
  path: imagePath,
  name: 'quiet_icon',
  ext: '.png',
  cid: 'storybook-local-preview',
  message: { id: 'storybook-local-preview', channelId: 'general' },
  width: 95,
  height: 94,
  size: 1492,
}

const FixtureContent = ({ reset }: { reset: () => void }) => {
  const channelId = useSelector(publicChannels.selectors.currentChannelId)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [imageState, setImageState] = useState('loading')

  useEffect(() => {
    let mounted = true
    // Writing the bundled fixture gives FastImage the same local-file source
    // as a downloaded attachment, including when Metro serves the JS bundle.
    void RNFS.writeFile(imagePath, quietIconBase64, 'base64').then(
      () => {
        if (mounted) setImageState('ready')
      },
      error => {
        if (mounted) setImageState(`error: ${String(error)}`)
      }
    )
    return () => {
      mounted = false
    }
  }, [])

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}>
        <StatusBar barStyle='dark-content' />
        <View style={{ paddingHorizontal: 12 }}>
          {/* A native-stack pop alone is insufficient: the production channel
              Back handler must also clear the selected channel for unread state. */}
          <Text testID='android-compatibility-channel-state'>{channelId || '(none)'}</Text>
          <Text testID='android-compatibility-preview-state'>{previewOpen ? 'open' : 'closed'}</Text>
          <Text testID='android-compatibility-image-state'>{imageState}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Button title='Reset fixture' testID='android-compatibility-reset' onPress={reset} />
            <Button
              title='Open image preview'
              testID='android-compatibility-open-preview'
              disabled={!channelId || imageState !== 'ready'}
              onPress={() => setPreviewOpen(true)}
            />
          </View>
        </View>
        <NavigationContainer independent ref={navigationRef}>
          <Stack.Navigator initialRouteName={ScreenNames.ChannelListScreen} screenOptions={{ headerShown: false }}>
            <Stack.Screen name={ScreenNames.ChannelListScreen} component={ChannelListScreen} />
            <Stack.Screen name={ScreenNames.ChannelScreen} component={ChannelScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        {previewOpen && (
          <ImagePreviewModal
            imagePreviewData={previewData}
            currentChannelName='Android compatibility preview'
            resetPreviewData={() => setPreviewOpen(false)}
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const Fixture = ({ reset }: { reset: () => void }) => {
  const [{ store, sagaMiddleware }] = useState(createFixture)

  useEffect(() => {
    const task = sagaMiddleware.run(watchNavigation)
    return () => task.cancel()
  }, [sagaMiddleware])

  return (
    <Provider store={store}>
      <ThemeProvider theme={defaultTheme}>
        <FixtureContent reset={reset} />
      </ThemeProvider>
    </Provider>
  )
}

const AndroidCompatibilityStory = () => {
  const [generation, setGeneration] = useState(0)
  if (Platform.OS !== 'android') return <Text>This fixture exercises Android system Back.</Text>
  return <Fixture key={generation} reset={() => setGeneration(value => value + 1)} />
}

storiesOf('AndroidCompatibility', module).add('SystemBack', () => <AndroidCompatibilityStory />)
