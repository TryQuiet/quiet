import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { LeaveCommunity } from './LeaveCommunity.component'

storiesOf('LeaveCommunity', module).add('Default', () => (
  <LeaveCommunity
    name={'Rockets'}
    leaveCommunity={() => {
      console.log('leaving community')
    }}
    handleBackButton={() => {
      console.log('going back')
    }}
  />
))
