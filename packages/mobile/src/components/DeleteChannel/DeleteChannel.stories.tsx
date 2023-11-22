import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { DeleteChannel } from './DeleteChannel.component'

storiesOf('DeleteChannel', module).add('Default', () => (
    <DeleteChannel
        name={'general'}
        deleteChannel={() => {
            console.log('deleting channel')
        }}
        handleBackButton={() => {
            console.log('going back')
        }}
    />
))
