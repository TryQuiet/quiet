import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { View } from 'react-native'

import { InitCheck } from './InitCheck.component'

storiesOf('InitCheck', module).add('Default', () => (
    <View>
        <InitCheck event={'Websocket connected'} passed={true} />
        <InitCheck event={'Channels replicated'} passed={false} />
    </View>
))
