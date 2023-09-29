import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { Loading } from './Loading.component'

storiesOf('Loading', module).add('Default', () => (
  <Loading
    title={'Creating community “Disco-fever”'}
    caption={'Additional info if needed can go here otherwise this is hidden.'}
  />
))
