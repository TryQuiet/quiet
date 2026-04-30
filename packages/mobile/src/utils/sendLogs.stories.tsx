import React from 'react'
import { View } from 'react-native'
import { storiesOf } from '@storybook/react-native'

import { Button } from '../components/Button/Button.component'
import { sendLogs } from './sendLogs'

storiesOf('SendLogs', module).add('Trigger share sheet', () => (
  <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
    <Button
      title={'Send logs to devs'}
      onPress={() => {
        void sendLogs()
      }}
    />
  </View>
))
