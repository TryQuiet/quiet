import React, { useState } from 'react'
import { storiesOf } from '@storybook/react-native'
import { View, Button } from 'react-native'
import { Provider } from 'react-redux'
import { ThemeProvider } from 'styled-components/native'
import { JoiningOptInDrawer } from './JoiningOptIn.drawer'
import { defaultTheme } from '../../../styles/themes/default.theme'
import { prepareStore } from '@quiet/state-manager'
import { invitationCodes } from 'packages/state-manager/src/sagas/communities/communities.selectors'

// Minimal reducer for mocking selectors
const mockReducer = (
  state = {
    communities: {
      qssOptInRequested: true,
      invitationCodes: { qssEndPoint: 'mock-endpoint' },
    },
  },
  action: any
) => state

const store = prepareStore({
  Communities: {
    invitationCodes: { qssEndPoint: 'mock-endpoint' },
    qssOptInRequested: true,
  },
}).store

const JoiningOptInDrawerStory = () => {
  const [visible, setVisible] = useState(true)
  const [lastResult, setLastResult] = useState<{ useServer: boolean } | null>(null)

  const handleClose = (useServer: boolean) => {
    setVisible(false)
    setLastResult({ useServer })
  }

  return (
    <Provider store={store}>
      <ThemeProvider theme={defaultTheme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
          <Button title='Show Drawer' onPress={() => setVisible(true)} />
          <JoiningOptInDrawer visible={visible} onClose={handleClose} />
          {lastResult && (
            <View>
              <Button
                title={`Last: useServer=${lastResult.useServer ? 'true' : 'false'}`}
                onPress={() => setLastResult(null)}
              />
            </View>
          )}
        </View>
      </ThemeProvider>
    </Provider>
  )
}

storiesOf('Drawers/JoiningOptInDrawer', module).add('default', () => <JoiningOptInDrawerStory />)
