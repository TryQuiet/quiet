import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { CreateChannel } from './CreateChannel.component'

storiesOf('CreateChannel', module).add('Default', () => (
    <CreateChannel createChannelAction={() => {}} handleBackButton={() => {}} />
))
