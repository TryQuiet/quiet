import React, { useState } from 'react'
import { Button, Platform, StatusBar, Text, View, useWindowDimensions } from 'react-native'
import { storiesOf } from '@storybook/react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { ModalBottomDrawer } from '../ModalBottomDrawer/ModalBottomDrawer.component'

// A smaller parent reproduces the available space of a resized activity or a
// safe-area container without relying on a device's multi-window controls.
const DrawerWindowStory = () => {
  const { height } = useWindowDimensions()
  const [compact, setCompact] = useState(false)
  const [visible, setVisible] = useState(false)

  if (Platform.OS !== 'android') return <Text>This fixture exercises Android window resizing.</Text>

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar barStyle='dark-content' />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Button title='Open drawer' testID='android-drawer-open' onPress={() => setVisible(true)} />
          <Button title='Resize window' testID='android-drawer-resize' onPress={() => setCompact(value => !value)} />
        </View>
        <View
          testID='android-drawer-viewport'
          style={{ height: Math.min(height * (compact ? 0.35 : 0.6), compact ? 220 : 400), backgroundColor: '#ddd' }}
        >
          <ModalBottomDrawer
            visible={visible}
            onClose={() => setVisible(false)}
            heightRatio={1}
            testIdPrefix='android-window-drawer'
          >
            <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 12 }}>
              <Text testID='android-drawer-content-top'>Top of drawer content</Text>
              <Text testID='android-drawer-content-bottom'>Bottom of drawer content</Text>
            </View>
          </ModalBottomDrawer>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

storiesOf('AndroidCompatibility', module).add('DrawerWindow', () => <DrawerWindowStory />)
