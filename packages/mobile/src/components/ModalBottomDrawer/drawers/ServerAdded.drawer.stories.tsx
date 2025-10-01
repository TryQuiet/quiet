import React, { useState } from 'react'
import { storiesOf } from '@storybook/react-native'
import { View, Button } from 'react-native'
import { ServerAddedDrawer } from './ServerAdded.drawer'

const ServerAddedDrawerStory = () => {
  const [visible, setVisible] = useState(true)
  const [lastResult, setLastResult] = useState<boolean | null>(null)
  const [serverHost, setServerHost] = useState('example.com')

  const handleClose = (useServer: boolean) => {
    setVisible(false)
    setLastResult(useServer)
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Button title='Show Drawer' onPress={() => setVisible(true)} />
      <Button
        title='Change Server Host'
        onPress={() => setServerHost(serverHost === 'example.com' ? 'another.com' : 'example.com')}
      />
      <ServerAddedDrawer />
      {lastResult !== null && (
        <View>
          <Button title={`Last: useServer=${lastResult ? 'true' : 'false'}`} onPress={() => setLastResult(null)} />
        </View>
      )}
    </View>
  )
}

storiesOf('Drawers/ServerAddedDrawer', module).add('default', () => <ServerAddedDrawerStory />)
