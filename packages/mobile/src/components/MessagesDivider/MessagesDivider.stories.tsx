import React from 'react'
import { storiesOf } from '@storybook/react-native'
import { MessagesDivider } from './MessagesDivider.component'

storiesOf('MessagesDivider', module)
  .add('default', () => <MessagesDivider title='Today' />)
  .add('long date', () => <MessagesDivider title='March 15, 2025' />)
