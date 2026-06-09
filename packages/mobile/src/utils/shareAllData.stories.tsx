import React from 'react'
import { View } from 'react-native'
import { storiesOf } from '@storybook/react-native'

import { Button } from '../components/Button/Button.component'
import { shareAllData } from './shareAllData'

storiesOf('ShareAllData', module).add('Trigger share sheet', () => (
  <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
    <Button
      title={'Share all data'}
      onPress={() => {
        void shareAllData()
      }}
    />
  </View>
))
