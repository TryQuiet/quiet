import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'
import { ActionProgress } from './ActionProgress.component'

// Progress bar 2 / With text=True (5390:19570); the fill is teal, the decision of record (#3518).
storiesOf('ActionProgress', module)
  .add('In progress', () => (
    <View style={{ padding: 24 }}>
      <ActionProgress status={'Generating device link…'} />
    </View>
  ))
  .add('With phases', () => (
    <View style={{ padding: 24 }}>
      <ActionProgress status={'Joining now!'} secondary={'This first time might take a while.'} value={0.5} />
    </View>
  ))
