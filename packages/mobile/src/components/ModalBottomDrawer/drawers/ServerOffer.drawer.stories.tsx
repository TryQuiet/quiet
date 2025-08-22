import React, { useState } from 'react'
import { storiesOf } from '@storybook/react-native'
import { View, Button } from 'react-native'
import { ServerOfferDrawer } from './ServerOffer.drawer'

const ServerOfferDrawerStory = () => {
  const [visible, setVisible] = useState(true)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [showDontShowAgain, setShowDontShowAgain] = useState(true)
  const [lastResult, setLastResult] = useState<{ useServer: boolean; dontShowAgain: boolean } | null>(null)

  const handleClose = (useServer: boolean, dsa: boolean) => {
    setVisible(false)
    setDontShowAgain(dsa)
    setLastResult({ useServer, dontShowAgain: dsa })
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Button title='Show Drawer' onPress={() => setVisible(true)} />
      <Button title='Toggle DSA checkbox' onPress={() => setShowDontShowAgain(!showDontShowAgain)} />
      <ServerOfferDrawer visible={visible} onClose={handleClose} showDontShowAgain={showDontShowAgain} />
      {lastResult && (
        <View>
          <Button
            title={`Last: useServer=${lastResult.useServer ? 'true' : 'false'}, dontShowAgain=${
              lastResult.dontShowAgain ? 'true' : 'false'
            }`}
            onPress={() => setLastResult(null)}
          />
        </View>
      )}
    </View>
  )
}

storiesOf('Drawers/ServerOfferDrawer', module).add('default', () => <ServerOfferDrawerStory />)
