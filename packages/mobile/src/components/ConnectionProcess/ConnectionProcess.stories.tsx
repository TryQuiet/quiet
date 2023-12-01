import { ConnectionProcessInfo } from '@quiet/types'
import { storiesOf } from '@storybook/react-native'
import React from 'react'
import ConnectionProcessComponent from './ConnectionProcess.component'

storiesOf('ConnectionProcess', module).add('Default', () => (
  <ConnectionProcessComponent
    connectionProcess={{
      number: 50,
      text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY,
    }}
    openUrl={() => console.log('open')}
  />
))
