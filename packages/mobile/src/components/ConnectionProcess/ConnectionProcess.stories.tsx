import { ConnectionProcessInfo } from '@quiet/types'
import { storiesOf } from '@storybook/react-native'
import React from 'react'
import ConnectionProcessComponent from './ConnectionProcess.component'

storiesOf('ConnectionProcess', module).add('Default', () => (
    <ConnectionProcessComponent
        connectionProcess={{
            number: 40,
            text: ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE,
        }}
        openUrl={() => console.log('open')}
    />
))
