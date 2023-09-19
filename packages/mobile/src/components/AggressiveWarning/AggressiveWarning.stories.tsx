import { storiesOf } from '@storybook/react-native'
import React from 'react'
import AggressiveWarningComponent from './AggressiveWarning.component'

storiesOf('AggressiveWarning', module).add('Default', () => (
  <AggressiveWarningComponent communityName='devteam' leaveCommunity={() => {}} handleBackButton={() => {}} />
))
