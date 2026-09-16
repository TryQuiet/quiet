import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { CreateChannel } from './CreateChannel.component'

storiesOf('CreateChannel', module)
  .add('Private channel allowed', () => (
    <CreateChannel
      createChannelAction={() => {}}
      handleBackButton={() => {}}
      canCreateChannel={true}
      canCreatePrivateChannel={true}
    />
  ))
  .add('Private channel not allowed', () => (
    <CreateChannel
      createChannelAction={() => {}}
      handleBackButton={() => {}}
      canCreateChannel={true}
      canCreatePrivateChannel={false}
    />
  ))
